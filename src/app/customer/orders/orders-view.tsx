"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, StatusPill, EmptyState } from "@/components/ui";

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentProofUrl: string | null;
  createdAt: number;
};
type Product = { id: number; sku: string; name: string; quantity: number };

const statusLabels: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكَّد",
  picking: "قيد التجهيز",
  picked: "تم التجهيز",
  packing: "قيد التغليف",
  packed: "تم التغليف",
  ready_for_shipping: "جاهز للشحن",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  returned: "مرتجع",
};

export function OrdersView({ initialOrders, products }: { initialOrders: Order[]; products: Product[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) setOrders(json.data);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <div className="mb-4">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "إغلاق" : "+ طلب إخراج بضاعة"}
        </Button>
      </div>

      {showForm && (
        <NewOrderForm
          products={products}
          onCreated={(o) => {
            setOrders((prev) => [o, ...prev]);
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {orders.length === 0 ? (
        <EmptyState title="لا توجد طلبات بعد" description="أنشئ أول طلب إخراج بضاعة من الزر أعلاه" />
      ) : (
        <Card className="bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-line-soft/50 text-right">
                {["رقم الطلب", "الحالة", "حالة الدفع", "التاريخ", "إثبات الدفع"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.status} label={statusLabels[o.status] ?? o.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.paymentStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{new Date(o.createdAt * 1000).toLocaleDateString("ar-EG")}</td>
                  <td className="px-4 py-3">
                    {o.paymentStatus === "paid" ? (
                      <span className="text-xs text-muted">—</span>
                    ) : (
                      <PaymentProofUpload orderId={o.id} hasProof={!!o.paymentProofUrl} onUploaded={() => router.refresh()} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function PaymentProofUpload({ orderId, hasProof, onUploaded }: { orderId: number; hasProof: boolean; onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/orders/${orderId}/payment-proof`, { method: "POST", body: formData });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!json.success) {
      setError(json.error ?? "فشل رفع الصورة");
      return;
    }
    onUploaded();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-1">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" id={`proof-${orderId}`} onChange={handleFile} />
      <label htmlFor={`proof-${orderId}`}>
        <Button size="sm" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "جارٍ الرفع..." : hasProof ? "استبدال صورة إنستاباي" : "رفع صورة تحويل إنستاباي"}
        </Button>
      </label>
      {hasProof && !busy && <span className="text-xs text-success">تم الرفع، بانتظار المراجعة</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

function NewOrderForm({ products, onCreated }: { products: Product[]; onCreated: (o: Order) => void }) {
  const [productId, setProductId] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingAddress: address, items: [{ productId, quantity }] }),
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
      {products.length === 0 ? (
        <p className="text-sm text-muted">أضف منتجات في صفحة &quot;مخزوني&quot; أولاً قبل إنشاء طلب.</p>
      ) : (
        <form onSubmit={submit} className="grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <Label htmlFor="product">المنتج</Label>
            <select id="product" required className="w-full rounded-lg border border-line px-3 py-2 text-sm" value={productId} onChange={(e) => setProductId(Number(e.target.value))}>
              <option value="">اختر منتجًا</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.quantity} متاح)
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="qty">الكمية</Label>
            <Input id="qty" type="number" min={1} required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="address">عنوان الشحن</Label>
            <Input id="address" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان بالتفصيل" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "..." : "إرسال الطلب"}
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </Card>
  );
}
