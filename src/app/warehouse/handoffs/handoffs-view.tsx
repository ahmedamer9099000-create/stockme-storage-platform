"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, EmptyState } from "@/components/ui";

type Customer = { id: number; companyName: string };
type Warehouse = { id: number; name: string };
type Handoff = {
  id: number;
  customerId: number;
  warehouseId: number;
  cartonCount: number;
  spaceFreedM2: number;
  courier: string | null;
  notes: string | null;
  createdAt: number;
};

export function HandoffsView({
  customers,
  warehouses,
  initialHandoffs,
}: {
  customers: Customer[];
  warehouses: Warehouse[];
  initialHandoffs: Handoff[];
}) {
  const router = useRouter();
  const [handoffs, setHandoffs] = useState(initialHandoffs);
  const [showForm, setShowForm] = useState(false);
  const customerById = new Map(customers.map((c) => [c.id, c]));

  return (
    <div>
      <div className="mb-4">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "إغلاق" : "+ تسجيل تسليم جديد"}
        </Button>
      </div>

      {showForm && (
        <NewHandoffForm
          customers={customers}
          warehouses={warehouses}
          onCreated={(h) => {
            setHandoffs((prev) => [h, ...prev]);
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {handoffs.length === 0 ? (
        <EmptyState title="لا توجد عمليات تسليم مسجلة" />
      ) : (
        <div className="space-y-3">
          {handoffs.map((h) => (
            <Card key={h.id} className="bg-surface p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{customerById.get(h.customerId)?.companyName ?? "—"}</p>
                  <p className="text-xs text-muted">
                    {h.cartonCount} كرتونة — {h.spaceFreedM2} م² متفرغة{h.courier ? ` — ${h.courier}` : ""}
                  </p>
                  {h.notes && <p className="text-xs text-muted mt-1">{h.notes}</p>}
                </div>
                <p className="text-xs text-muted">{new Date(h.createdAt * 1000).toLocaleDateString("ar-EG")}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewHandoffForm({
  customers,
  warehouses,
  onCreated,
}: {
  customers: Customer[];
  warehouses: Warehouse[];
  onCreated: (h: Handoff) => void;
}) {
  const [customerId, setCustomerId] = useState<number | "">("");
  const [warehouseId, setWarehouseId] = useState<number | "">(warehouses[0]?.id ?? "");
  const [cartonCount, setCartonCount] = useState<number>(1);
  const [spaceFreedM2, setSpaceFreedM2] = useState<number>(0);
  const [courier, setCourier] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !warehouseId) {
      setError("اختر العميل والمخزن");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/carton-handoffs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, warehouseId, cartonCount, spaceFreedM2, courier: courier || undefined, notes: notes || undefined }),
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
        <div className="grid sm:grid-cols-2 gap-3">
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
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cartonCount">عدد الكراتين</Label>
            <Input id="cartonCount" type="number" min={1} value={cartonCount} onChange={(e) => setCartonCount(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="spaceFreed">المساحة المتفرغة (م²)</Label>
            <Input id="spaceFreed" type="number" min={0} step="0.1" value={spaceFreedM2} onChange={(e) => setSpaceFreedM2(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <Label htmlFor="courier">شركة الشحن / المندوب (اختياري)</Label>
          <Input id="courier" value={courier} onChange={(e) => setCourier(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="notes">ملاحظات (اختياري)</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "..." : "تسجيل التسليم"}
        </Button>
      </form>
    </Card>
  );
}