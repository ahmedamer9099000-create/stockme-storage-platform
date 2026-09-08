"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

type Warehouse = { id: number; name: string; address: string | null; totalCapacityM2: number; availableM2: number };

export function StorageBooking({ warehouses }: { warehouses: Warehouse[] }) {
  const router = useRouter();
  const bookable = warehouses.filter((w) => w.availableM2 > 0);
  const [warehouseId, setWarehouseId] = useState(bookable[0]?.id ?? "");
  const selected = warehouses.find((w) => w.id === warehouseId);
  const [area, setArea] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ warehouseId: Number(warehouseId), allocatedM2: Number(area) }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!json.success) {
      setError(json.error ?? "تعذر إتمام الحجز");
      return;
    }
    router.refresh();
  }

  return (
    <Card className="bg-surface p-5 mt-5 max-w-2xl">
      <p className="font-display font-semibold mb-1">احجز مساحة جديدة</p>
      <p className="text-sm text-muted mb-4">اختر المخزن والمساحة، وسيتم حساب الرسوم الشهرية تلقائيًا.</p>

      {warehouses.length === 0 ? (
        <p className="text-sm text-muted">لا توجد مخازن متاحة حاليًا — راجع الإدارة.</p>
      ) : bookable.length === 0 ? (
        <p className="text-sm text-danger">كل المخازن المتاحة ممتلئة حاليًا. حاول لاحقًا أو تواصل مع الإدارة.</p>
      ) : (
        <form onSubmit={submit} className="grid sm:grid-cols-3 gap-3 items-end">
          <div>
            <Label htmlFor="warehouse">المخزن</Label>
            <select
              id="warehouse"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              value={warehouseId}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} disabled={w.availableM2 <= 0}>
                  {w.name} — متاح {w.availableM2} م² {w.availableM2 <= 0 ? "(ممتلئ)" : ""}
                </option>
              ))}
            </select>
            {selected && selected.address && <p className="text-xs text-muted mt-1">{selected.address}</p>}
          </div>
          <div>
            <Label htmlFor="area">المساحة (م²)</Label>
            <Input
              id="area"
              type="number"
              min={1}
              max={selected?.availableM2 ?? undefined}
              step="0.5"
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
            />
            {selected && <p className="text-xs text-muted mt-1">أقصى مساحة متاحة في هذا المخزن: {selected.availableM2} م²</p>}
          </div>
          <Button type="submit" disabled={busy || !bookable.length}>
            {busy ? "جارٍ الحجز..." : "حجز المساحة"}
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-danger mt-3">{error}</p>}
    </Card>
  );
}
