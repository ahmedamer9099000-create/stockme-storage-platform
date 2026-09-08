"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Label, EmptyState } from "@/components/ui";

type Order = { id: number; orderNumber: string; customerName: string };

export function PackingStation({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);

  if (orders.length === 0) {
    return <EmptyState title="لا توجد طلبات جاهزة للتغليف" description="الطلبات تظهر هنا بعد إتمام التجهيز (Picking) بالكامل" />;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {orders.map((o) => (
        <PackingCard key={o.id} order={o} onPacked={() => setOrders((prev) => prev.filter((x) => x.id !== o.id))} onRefresh={() => router.refresh()} />
      ))}
    </div>
  );
}

function PackingCard({ order, onPacked, onRefresh }: { order: Order; onPacked: () => void; onRefresh: () => void }) {
  const [packagingType, setPackagingType] = useState("كرتونة متوسطة");
  const [weightKg, setWeightKg] = useState(1);
  const [loading, setLoading] = useState(false);

  // shipment fields, shown after packing is confirmed
  const [packed, setPacked] = useState(false);
  const [courier, setCourier] = useState("بوسطة");
  const [tracking, setTracking] = useState("");

  async function markPacked() {
    setLoading(true);
    await fetch(`/api/orders/${order.id}/packing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packagingType, weightKg }),
    });
    setLoading(false);
    setPacked(true);
    onRefresh();
  }

  async function ship() {
    setLoading(true);
    await fetch(`/api/orders/${order.id}/shipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courier, trackingNumber: tracking }),
    });
    setLoading(false);
    onPacked();
    onRefresh();
  }

  return (
    <Card className="bg-surface p-4">
      <p className="text-xs text-muted mb-1">{order.customerName}</p>
      <p className="font-mono text-sm font-semibold mb-3">{order.orderNumber}</p>

      {!packed ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor={`type-${order.id}`}>نوع التغليف</Label>
            <Input id={`type-${order.id}`} value={packagingType} onChange={(e) => setPackagingType(e.target.value)} />
          </div>
          <div>
            <Label htmlFor={`w-${order.id}`}>الوزن (كجم)</Label>
            <Input id={`w-${order.id}`} type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} />
          </div>
          <Button size="sm" onClick={markPacked} disabled={loading}>
            {loading ? "..." : "تم التغليف"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-success">✓ تم التغليف — أدخل بيانات الشحن</p>
          <div>
            <Label htmlFor={`courier-${order.id}`}>شركة الشحن</Label>
            <Input id={`courier-${order.id}`} value={courier} onChange={(e) => setCourier(e.target.value)} />
          </div>
          <div>
            <Label htmlFor={`track-${order.id}`}>رقم التتبع</Label>
            <Input id={`track-${order.id}`} value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </div>
          <Button size="sm" onClick={ship} disabled={loading}>
            {loading ? "..." : "تأكيد الشحن"}
          </Button>
        </div>
      )}
    </Card>
  );
}
