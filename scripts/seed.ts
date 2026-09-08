/**
 * Generates demo data as a plain .sql file, then applies it with:
 *   npm run db:seed:local   ->  wrangler d1 execute storage-platform-db --local  --file=./seed-data/seed.sql
 *   npm run db:seed:remote  ->  wrangler d1 execute storage-platform-db --remote --file=./seed-data/seed.sql
 *
 * Output deliberately does NOT live under ./drizzle (the migrations_dir) —
 * `wrangler d1 migrations apply` scans that whole folder and would otherwise
 * treat seed.sql as a schema migration and track it in the migrations table.
 *
 * Why not use drizzle/db directly like before? On Cloudflare D1 the database
 * connection only exists inside a Worker's per-request runtime context
 * (`getCloudflareContext()`), so a standalone Node script (this one) can't
 * import "@/db" the way it could with the old better-sqlite3 file. Emitting
 * SQL and letting `wrangler d1 execute` apply it sidesteps that entirely —
 * and it works the same way for both local and remote D1.
 *
 * IDs are assigned explicitly by this script (rather than left to
 * AUTOINCREMENT) so foreign keys can be wired up deterministically. This
 * assumes a freshly migrated, empty database — do not run against a
 * database that already has real data (see docs/DEPLOYMENT.md).
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";

const statements: string[] = [];

function esc(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function insert(table: string, row: Record<string, unknown>) {
  const cols = Object.keys(row);
  statements.push(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((c) => esc(row[c])).join(", ")});`);
}

async function main() {
  console.log("Building seed.sql...");

  // ---------- Pricing plan ----------
  const planId = 1;
  insert("pricing_plans", {
    id: planId,
    name: "الخطة الافتراضية",
    price_per_m2: 450,
    min_monthly_fee: 500,
    price_per_carton: 15,
    price_per_pallet: 200,
    receiving_fee: 25,
    picking_fee: 20,
    packing_fee: 15,
    return_fee: 30,
    shipping_handling_fee: 10,
    is_default: true,
  });

  // ---------- Warehouses ----------
  const warehouseDefs = [
    { name: "المخزن الرئيسي - فيصل", code: "WH-A", address: "فيصل، الجيزة", totalCapacityM2: 100 },
    { name: "مخزن مدينة نصر", code: "WH-B", address: "مدينة نصر، القاهرة", totalCapacityM2: 60 },
    { name: "مخزن أكتوبر", code: "WH-C", address: "6 أكتوبر، الجيزة", totalCapacityM2: 80 },
  ];
  const warehouseIds: number[] = [];
  warehouseDefs.forEach((w, i) => {
    const id = i + 1;
    warehouseIds.push(id);
    insert("warehouses", { id, name: w.name, code: w.code, address: w.address, total_capacity_m2: w.totalCapacityM2 });
  });

  // ---------- Zone -> Rack -> Shelf -> Bin hierarchy (warehouse A only) ----------
  const binIds: number[] = [];
  let zoneId = 0, rackId = 0, shelfId = 0, binId = 0;
  for (let z = 1; z <= 2; z++) {
    zoneId++;
    insert("zones", { id: zoneId, warehouse_id: warehouseIds[0], name: `منطقة ${z}`, code: `Z${z}` });
    for (let r = 1; r <= 2; r++) {
      rackId++;
      const rackCode = `R${z}${r}`;
      insert("racks", { id: rackId, zone_id: zoneId, name: `رف ${z}${r}`, code: rackCode });
      for (let s = 1; s <= 3; s++) {
        shelfId++;
        const shelfCode = `${rackCode}-S${s}`;
        insert("shelves", { id: shelfId, rack_id: rackId, name: `شلف ${s}`, code: shelfCode });
        for (let b = 1; b <= 2; b++) {
          binId++;
          binIds.push(binId);
          insert("bins", { id: binId, shelf_id: shelfId, name: `صندوق ${b}`, code: `${shelfCode}-B${b}` });
        }
      }
    }
  }

  // ---------- Demo accounts ----------
  const demoPasswordHash = await bcrypt.hash("Demo@1234", 10);
  let userId = 0;
  const superAdminId = ++userId;
  insert("users", { id: superAdminId, email: "superadmin@demo.com", password_hash: demoPasswordHash, name: "Super Admin", role: "SUPER_ADMIN" });
  const adminId = ++userId;
  insert("users", { id: adminId, email: "admin@demo.com", password_hash: demoPasswordHash, name: "Admin", role: "ADMIN" });
  const employeeId = ++userId;
  insert("users", { id: employeeId, email: "employee@demo.com", password_hash: demoPasswordHash, name: "Warehouse Employee", role: "WAREHOUSE_EMPLOYEE" });

  // ---------- 10 customers (+ login users) ----------
  const businessTypes = ["ملابس", "إلكترونيات", "مستحضرات تجميل", "أحذية", "إكسسوارات"];
  const customerIds: number[] = [];
  let customerIdCounter = 0;
  for (let i = 1; i <= 10; i++) {
    const customerId = ++customerIdCounter;
    customerIds.push(customerId);
    insert("customers", {
      id: customerId,
      company_name: `متجر تجربة ${i}`,
      business_type: businessTypes[i % businessTypes.length],
      phone: `010000000${i}`,
      whatsapp: `010000000${i}`,
      address: "القاهرة، مصر",
      status: "active",
    });

    const email = i === 1 ? "customer@demo.com" : `customer${i}@demo.com`;
    const custUserId = ++userId;
    insert("users", { id: custUserId, name: `صاحب متجر تجربة ${i}`, email, password_hash: demoPasswordHash, role: "CUSTOMER", customer_id: customerId });
    statements.push(`UPDATE customers SET user_id = ${custUserId} WHERE id = ${customerId};`);

    if (i <= 5) {
      const allocatedM2 = [5, 10, 15, 20, 8][i - 1];
      insert("storage_allocations", {
        customer_id: customerId,
        warehouse_id: warehouseIds[0],
        allocated_m2: allocatedM2,
        used_m2: Math.round(allocatedM2 * 0.6),
        monthly_fee: Math.max(allocatedM2 * 450, 500),
        status: "active",
      });
    }
  }

  // ---------- 50 products across the first 5 customers ----------
  const categories = ["ملابس رجالي", "ملابس حريمي", "إكسسوارات", "أحذية", "إلكترونيات صغيرة"];
  const productIdByIndex: number[] = [];
  const productCustomerId: number[] = [];
  for (let i = 1; i <= 50; i++) {
    const productId = i;
    const customerId = customerIds[i % 5];
    const bin = binIds[i % binIds.length];
    productIdByIndex.push(productId);
    productCustomerId.push(customerId);
    insert("products", {
      id: productId,
      customer_id: customerId,
      sku: `SKU-${1000 + i}`,
      barcode: `620000000${1000 + i}`,
      name: `منتج تجريبي ${i}`,
      category: categories[i % categories.length],
      description: "منتج تجريبي لبيانات الاختبار",
      quantity: 0,
      min_stock: 5,
      unit_weight_kg: Math.round(Math.random() * 20) / 10 + 0.1,
      unit_dimensions: "20x15x10 cm",
      bin_id: bin,
    });

    // opening IN movement through the ledger (mirrors recordMovement's effect)
    const qty = 20 + (i % 30);
    statements.push(`UPDATE products SET quantity = ${qty} WHERE id = ${productId};`);
    insert("inventory_movements", {
      product_id: productId,
      type: "IN",
      quantity: qty,
      previous_balance: 0,
      new_balance: qty,
      user_id: employeeId,
      reason: "رصيد افتتاحي (بيانات تجريبية)",
      reference_type: "manual",
    });
  }

  // ---------- 10 orders ----------
  const orderStatuses = ["pending", "picking", "picked", "packed", "shipped", "delivered"] as const;
  const orderIds: number[] = [];
  const orderCustomerIds: number[] = [];
  for (let i = 1; i <= 10; i++) {
    const orderId = i;
    const customerId = customerIds[i % 5];
    orderIds.push(orderId);
    orderCustomerIds.push(customerId);
    insert("orders", {
      id: orderId,
      order_number: `ORD-DEMO-${1000 + i}`,
      customer_id: customerId,
      status: orderStatuses[i % orderStatuses.length],
      shipping_address: "عنوان تجريبي، القاهرة",
      payment_status: i % 3 === 0 ? "pending" : "paid",
    });
    const candidateProduct = productIdByIndex.find((_, idx) => productCustomerId[idx] === customerId);
    if (candidateProduct) {
      insert("order_items", { order_id: orderId, product_id: candidateProduct, quantity: 2 });
    }
  }

  // ---------- 5 returns ----------
  for (let i = 1; i <= 5; i++) {
    const order = { id: orderIds[i], customerId: orderCustomerIds[i] };
    const candidateProduct = productIdByIndex.find((_, idx) => productCustomerId[idx] === order.customerId);
    const returnId = i;
    insert("returns", {
      id: returnId,
      return_number: `RET-DEMO-${100 + i}`,
      order_id: order.id,
      customer_id: order.customerId,
      reason: "مقاس غير مناسب",
      status: i <= 2 ? "processed" : "pending",
      decision: i <= 2 ? "return_to_stock" : null,
    });
    if (candidateProduct) {
      insert("return_items", { return_id: returnId, product_id: candidateProduct, quantity: 1 });
    }
  }

  // ---------- 10 invoices ----------
  const nowSec = Math.floor(Date.now() / 1000);
  for (let i = 1; i <= 10; i++) {
    const customerId = customerIds[i % 5];
    const subtotal = 500 + i * 120;
    const taxAmount = Math.round(subtotal * 0.14 * 100) / 100;
    const total = subtotal + taxAmount;
    const status = i % 4 === 0 ? "paid" : i % 4 === 1 ? "overdue" : "pending";
    const invoiceId = i;
    insert("invoices", {
      id: invoiceId,
      invoice_number: `INV-DEMO-${1000 + i}`,
      customer_id: customerId,
      period_start: nowSec - 60 * 24 * 60 * 60,
      period_end: nowSec - 30 * 24 * 60 * 60,
      subtotal,
      tax_rate: 14,
      tax_amount: taxAmount,
      total,
      status,
      due_date: nowSec - 15 * 24 * 60 * 60,
    });
    insert("invoice_items", { invoice_id: invoiceId, description: "رسوم تخزين شهرية", type: "storage", quantity: 1, amount: subtotal });
    if (status === "paid") {
      insert("payments", { invoice_id: invoiceId, amount: total, method: "bank_transfer", status: "completed" });
    }
  }

  // ---------- leads ----------
  insert("leads", { name: "أحمد صاحب متجر أونلاين", phone: "01099998888", business_type: "ملابس", required_space_m2: 10, number_of_products: 40, status: "new" });
  insert("leads", { name: "سارة ستور", phone: "01088887777", business_type: "مستحضرات تجميل", required_space_m2: 5, number_of_products: 20, status: "contacted" });

  // ---------- settings ----------
  insert("settings", { key: "company_name", value: "مساحة — Storage & Fulfillment" });
  insert("settings", { key: "currency", value: "EGP" });
  insert("settings", { key: "default_tax_rate", value: "14" });

  const outDir = join(process.cwd(), "seed-data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "seed.sql");
  writeFileSync(outPath, statements.join("\n") + "\n", "utf-8");

  console.log(`Wrote ${statements.length} statements to ${outPath}`);
  console.log("Apply it with:");
  console.log("  npx wrangler d1 execute storage-platform-db --local  --file=./seed-data/seed.sql   # local dev DB");
  console.log("  npx wrangler d1 execute storage-platform-db --remote --file=./seed-data/seed.sql   # production D1");
  console.log("Demo accounts (password for all: Demo@1234):");
  console.log("  superadmin@demo.com  (SUPER_ADMIN)");
  console.log("  admin@demo.com       (ADMIN)");
  console.log("  employee@demo.com    (WAREHOUSE_EMPLOYEE)");
  console.log("  customer@demo.com    (CUSTOMER — متجر تجربة 1)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
