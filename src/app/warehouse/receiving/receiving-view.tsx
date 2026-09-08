"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, StatusPill, EmptyState } from "@/components/ui";

type ReceivingOrder = { id: number; customerId: number; warehouseId: number; supplier: string | null; status: string; createdAt: number };
type Customer = { id: number; companyName: string };
type Product = { id: number; customerId: number; name: string; sku: string; spaceM2: number };
type Warehouse = { id: number; name: string };
type Bin = { id: number; code: string };
type ReceivingItem = { id: number; receivingOrderId: number; productId: number; expectedQty: number; receivedQty: number; damagedQty: number; binId: number | null };

const statusLabels: Record<string, string> = {
  pending: "بانتظار الاستلام",
  received: "بانتظار الموافقة",
  approved: "بانتظار تحديد المكان",
  putaway: "مكتمل",
};

export function ReceivingView({
  initialOrders,
  customers,
  products,
  warehouses,
  allItems,
  bins,
}: {
  initialOrders: ReceivingOrder[];
  customers: Customer[];
  products: Product[];
  warehouses: Warehouse[];
  allItems: ReceivingItem[];
  bins: Bin[];
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [showForm, setShowForm] = useState(false);
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const itemsByOrder = new Map<number, ReceivingItem[]>();
  for (const it of allItems) {
    itemsByOrder.set(it.receivingOrderId, [...(itemsByOrder.get(it.receivingOrderId) ?? []), it]);
  }

  return (
    <div>
      <div className="mb-4">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "إغلاق" : "+ أمر استلام جديد"}
        </Button>
      </div>

      {showForm && (
        <NewReceivingForm
          customers={customers}
          products={products}
          warehouses={warehouses}
          onCreated={(o) => {
            setOrders((prev) => [o, ...prev]);
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {orders.length === 0 ? (
        <EmptyState title="لا توجد أوامر استلام" />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <ReceivingOrderCard
              key={o.id}
              order={o}
              customerName={customerById.get(o.customerId)?.companyName ?? "—"}
              items={itemsByOrder.get(o.id) ?? []}
              products={products}
              bins={bins}
              onChanged={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReceivingOrderCard({
  order,
  customerName,
  items,
  products,
  bins,
  onChanged,
}: {
  order: ReceivingOrder;
  customerName: string;
  items: ReceivingItem[];
  products: Product[];
  bins: Bin[];
  onChanged: () => void;
}) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const [loading, setLoading] = useState(false);

  // --- pending: enter received + damaged quantities ---
  const [counts, setCounts] = useState<Record<number, { received: number; damaged: number }>>(
    Object.fromEntries(items.map((it) => [it.id, { received: it.expectedQty, damaged: 0 }]))
  );

  async function submitReceive() {
    setLoading(true);
    await fetch(`/api/receiving/${order.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((it) => ({ receivingItemId: it.id, receivedQty: counts[it.id]?.received ?? 0, damagedQty: counts[it.id]?.damaged ?? 0 })),
      }),
    });
    setLoading(false);
    onChanged();
  }

  // --- received: approve + storage space ---
  const defaultSpace = items.reduce((sum, it) => sum + (productById.get(it.productId)?.spaceM2 ?? 0), 0);
  const [actualSpace, setActualSpace] = useState<number>(defaultSpace);

  async function submitApprove() {
    setLoading(true);
    await fetch(`/api/receiving/${order.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualSpaceM2: actualSpace }),
    });
    setLoading(false);
    onChanged();
  }

  // --- approved: assign bins ---
  const [binChoices, setBinChoices] = useState<Record<number, number | "">>(Object.fromEntries(items.map((it) => [it.id, it.binId ?? ""])));

  async function submitPutaway() {
    const missing = items.filter((it) => !binChoices[it.id]);
    if (missing.length > 0) return;
    setLoading(true);
    await fetch(`/api/receiving/${order.id}/putaway`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((it) => ({ receivingItemId: it.id, binId: Number(binChoices[it.id]) })) }),
    });
    setLoading(false);
    onChanged();
  }

  // --- receiving report totals (shown once received/approved/putaway) ---
  const totalExpected = items.reduce((s, it) => s + it.expectedQty, 0);
  const totalReceived = items.reduce((s, it) => s + it.receivedQty, 0);
  const totalDamaged = items.reduce((s, it) => s + it.damagedQty, 0);
  const totalMissing = Math.max(totalExpected - totalReceived - totalDamaged, 0);
  const isException = order.status !== "pending" && (totalDamaged > 0 || totalMissing > 0);

  return (
    <Card className="bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold">{customerName}</p>
          <p className="text-xs text-muted">{order.supplier ? `المورد: ${order.supplier}` : "بدون مورد محدد"}</p>
        </div>
        <StatusPill status={order.status} label={statusLabels[order.status]} />
      </div>

      {order.status === "pending" ? (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{productById.get(it.productId)?.name ?? `منتج #${it.productId}`}</span>
              <span className="text-muted text-xs">متوقع: {it.expectedQty}</span>
              <div className="flex items-center gap-1">
                <Label htmlFor={`rec-${it.id}`}>مستلم</Label>
                <Input
                  id={`rec-${it.id}`}
                  type="number"
                  min={0}
                  className="w-20"
                  value={counts[it.id]?.received ?? 0}
                  onChange={(e) => setCounts((c) => ({ ...c, [it.id]: { ...c[it.id], received: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-1">
                <Label htmlFor={`dmg-${it.id}`}>تالف</Label>
                <Input
                  id={`dmg-${it.id}`}
                  type="number"
                  min={0}
                  className="w-20"
                  value={counts[it.id]?.damaged ?? 0}
                  onChange={(e) => setCounts((c) => ({ ...c, [it.id]: { ...c[it.id], damaged: Number(e.target.value) } }))}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3">
          <div className={`rounded-lg p-3 text-sm ${isException ? "bg-danger-bg" : "bg-success-bg"}`}>
            <p className={`font-semibold mb-1 ${isException ? "text-danger" : "text-success"}`}>{isException ? "استثناء (Exception)" : "مطابق (Match)"}</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <span>متوقع: {totalExpected}</span>
              <span>مستلم: {totalReceived}</span>
              <span>تالف: {totalDamaged}</span>
              <span>مفقود: {totalMissing}</span>
            </div>
          </div>
        </div>
      )}

      {order.status === "approved" && (
        <div className="space-y-2 mb-3">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{productById.get(it.productId)?.name ?? `منتج #${it.productId}`}</span>
              <select
                className="rounded-lg border border-line px-2 py-1 text-xs"
                value={binChoices[it.id]}
                onChange={(e) => setBinChoices((c) => ({ ...c, [it.id]: e.target.value ? Number(e.target.value) : "" }))}
              >
                <option value="">اختر مكان التخزين</option>
                {bins.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {order.status === "received" && (
        <div className="mb-3">
          <Label htmlFor={`space-${order.id}`}>المساحة الفعلية (م²)</Label>
          <Input
            id={`space-${order.id}`}
            type="number"
            min={0}
            step="0.1"
            className="w-40"
            value={actualSpace}
            onChange={(e) => setActualSpace(Number(e.target.value))}
          />
        </div>
      )}

      {order.status === "pending" && (
        <Button size="sm" onClick={submitReceive} disabled={loading}>
          {loading ? "جاري التسجيل..." : "تسجيل الاستلام"}
        </Button>
      )}
      {order.status === "received" && (
        <Button size="sm" onClick={submitApprove} disabled={loading}>
          {loading ? "جاري الموافقة..." : "موافقة وتحديث المخزون"}
        </Button>
      )}
      {order.status === "approved" && (
        <Button size="sm" onClick={submitPutaway} disabled={loading}>
          {loading ? "جاري الحفظ..." : "تأكيد أماكن التخزين"}
        </Button>
      )}
    </Card>
  );
}

function NewReceivingForm({
  customers,
  products,
  warehouses,
  onCreated,
}: {
  customers: Customer[];
  products: Product[];
  warehouses: Warehouse[];
  onCreated: (o: ReceivingOrder) => void;
}) {
  const [customerId, setCustomerId] = useState<number | "">("");
  const [warehouseId, setWarehouseId] = useState<number | "">(warehouses[0]?.id ?? "");
  const [supplier, setSupplier] = useState("");
  const [lines, setLines] = useState<{ productId: number | ""; expectedQty: number }[]>([{ productId: "", expectedQty: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerProducts = products.filter((p) => p.customerId === customerId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !warehouseId) return;
    const items = lines.filter((l) => l.productId).map((l) => ({ productId: l.productId as number, expectedQty: l.expectedQty }));
    if (items.length === 0) {
      setError("أضف صنفًا واحدًا على الأقل");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/receiving", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, warehouseId, supplier, items }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) {
      setError(json.error);
      return;
    }
    onCreated(json.data);
  }

  return (
    <Card className="bg-surface p-4 mb-4">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="customer">العميل</Label>
            <select id="customer" required className="w-full rounded-lg border border-line px-3 py-2 text-sm" value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}>
              <option value="">اختر عميلاً</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="warehouse">المخزن</Label>
            <select id="warehouse" required className="w-full rounded-lg border border-line px-3 py-2 text-sm" value={warehouseId} onChange={(e) => setWarehouseId(Number(e.target.value))}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="supplier">المورد (اختياري)</Label>
            <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>الأصناف المتوقعة</Label>
          {lines.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                value={line.productId}
                onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, productId: Number(e.target.value) } : l)))}
              >
                <option value="">اختر منتجًا</option>
                {customerProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                className="w-24"
                value={line.expectedQty}
                onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, expectedQty: Number(e.target.value) } : l)))}
              />
            </div>
          ))}
          <button type="button" onClick={() => setLines((ls) => [...ls, { productId: "", expectedQty: 1 }])} className="text-brand text-xs font-medium">
            + إضافة صنف آخر
          </button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "..." : "إنشاء أمر الاستلام"}
        </Button>
      </form>
    </Card>
  );
}