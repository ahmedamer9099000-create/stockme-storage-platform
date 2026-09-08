// Automated version of the end-to-end smoke test documented in docs/TESTING.md.
// Uses Node's built-in test runner (no extra dependency) against a running dev/prod server.
// Run with: npm run test:smoke  (server must already be running on BASE_URL)

import { test, before } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function api(path: string, opts: RequestInit & { cookie?: string } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as Record<string, string>) };
  if (opts.cookie) headers["Cookie"] = opts.cookie;
  const res = await fetch(BASE + path, { ...opts, headers });
  const setCookie = res.headers.get("set-cookie");
  const json = await res.json();
  return { status: res.status, json, cookie: setCookie ? setCookie.split(";")[0] : opts.cookie };
}

let adminCookie: string, customerCookie: string, employeeCookie: string;

before(async () => {
  const admin = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@demo.com", password: "Demo@1234" }) });
  assert.equal(admin.json.success, true);
  adminCookie = admin.cookie!;

  const customer = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "customer@demo.com", password: "Demo@1234" }) });
  assert.equal(customer.json.success, true);
  customerCookie = customer.cookie!;

  const employee = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "employee@demo.com", password: "Demo@1234" }) });
  assert.equal(employee.json.success, true);
  employeeCookie = employee.cookie!;
});

test("RBAC: customer cannot list all customers", async () => {
  const res = await api("/api/customers", { cookie: customerCookie });
  assert.equal(res.status, 403);
});

test("admin can list customers (seeded: 10)", async () => {
  const res = await api("/api/customers", { cookie: adminCookie });
  assert.equal(res.status, 200);
  assert.equal(res.json.data.length, 10);
});

test("full order lifecycle deducts and restores stock through the ledger", async () => {
  // create product with opening balance
  const product = await api("/api/products", {
    method: "POST",
    cookie: customerCookie,
    body: JSON.stringify({ sku: `TEST-${Date.now()}`, name: "Automated test product", initialQuantity: 50 }),
  });
  assert.equal(product.status, 201);
  const productId = product.json.data.id;

  let movements = await api(`/api/products/${productId}/movements`, { cookie: customerCookie });
  assert.equal(movements.json.data.length, 1);
  assert.equal(movements.json.data[0].newBalance, 50);

  // order 5 units
  const order = await api("/api/orders", {
    method: "POST",
    cookie: customerCookie,
    body: JSON.stringify({ shippingAddress: "Test address", items: [{ productId, quantity: 5 }] }),
  });
  assert.equal(order.status, 201);
  const orderId = order.json.data.id;

  const confirm = await api(`/api/orders/${orderId}/confirm`, { method: "POST", cookie: adminCookie });
  assert.equal(confirm.json.data.tasksCreated, 1);

  const queue = await api("/api/picking-tasks?status=pending", { cookie: employeeCookie });
  const task = queue.json.data.find((t: { product: { id: number } }) => t.product?.id === productId);
  assert.ok(task, "picking task should exist for the new product");

  const pick = await api(`/api/picking-tasks/${task.id}/pick`, { method: "POST", cookie: employeeCookie, body: JSON.stringify({ pickedQty: 5 }) });
  assert.equal(pick.json.data.orderFullyPicked, true);

  movements = await api(`/api/products/${productId}/movements`, { cookie: customerCookie });
  assert.equal(movements.json.data[0].type, "OUT");
  assert.equal(movements.json.data[0].previousBalance, 50);
  assert.equal(movements.json.data[0].newBalance, 45);

  const pack = await api(`/api/orders/${orderId}/packing`, { method: "POST", cookie: employeeCookie, body: JSON.stringify({ packagingType: "box", weightKg: 1 }) });
  assert.equal(pack.json.data.packed, true);

  const ship = await api(`/api/orders/${orderId}/shipment`, { method: "POST", cookie: employeeCookie, body: JSON.stringify({ courier: "Test Courier" }) });
  assert.equal(ship.status, 201);

  const finalOrder = await api(`/api/orders/${orderId}`, { cookie: customerCookie });
  assert.equal(finalOrder.json.data.order.status, "shipped");

  // return 1 unit -> return_to_stock should restore it
  const ret = await api("/api/returns", {
    method: "POST",
    cookie: customerCookie,
    body: JSON.stringify({ orderId, reason: "test return", items: [{ productId, quantity: 1 }] }),
  });
  assert.equal(ret.status, 201);

  const process = await api(`/api/returns/${ret.json.data.id}/process`, { method: "POST", cookie: adminCookie, body: JSON.stringify({ decision: "return_to_stock" }) });
  assert.equal(process.json.data.processed, true);

  movements = await api(`/api/products/${productId}/movements`, { cookie: customerCookie });
  assert.equal(movements.json.data[0].type, "RETURN");
  assert.equal(movements.json.data[0].previousBalance, 45);
  assert.equal(movements.json.data[0].newBalance, 46);
});

test("invoice generation computes tax correctly", async () => {
  const now = Math.floor(Date.now() / 1000);
  const res = await api("/api/invoices/generate", {
    method: "POST",
    cookie: adminCookie,
    body: JSON.stringify({ customerId: 1, periodStart: now - 30 * 24 * 60 * 60, periodEnd: now }),
  });
  assert.equal(res.status, 201);
  const inv = res.json.data;
  const expectedTax = Math.round(inv.subtotal * 0.14 * 100) / 100;
  assert.equal(inv.taxAmount, expectedTax);
  assert.equal(Math.round((inv.subtotal + inv.taxAmount) * 100) / 100, inv.total);
});

test("public endpoints work without auth", async () => {
  const calc = await api("/api/calculator", { method: "POST", body: JSON.stringify({ areaM2: 10, durationMonths: 1 }) });
  assert.equal(calc.status, 200);
  assert.ok(calc.json.data.monthlySubtotal > 0);

  const lead = await api("/api/leads", { method: "POST", body: JSON.stringify({ name: "Test Lead", phone: "01000000000" }) });
  assert.equal(lead.status, 201);
});
