"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

type Warehouse = { id: number; name: string; address: string | null; totalCapacityM2: number; availableM2: number };
type Plan = { pricePerM2: number; minMonthlyFee: number; discountPct3m: number; discountPct6m: number; discountPct12m: number } | undefined;

const DURATION_OPTIONS = [
  { months: 1, label: "شهر واحد" },
  { months: 3, label: "3 شهور" },
  { months: 6, label: "6 شهور" },
  { months: 12, label: "سنة كاملة" },
];

export function StorageBooking({ warehouses, plan }: { warehouses: Warehouse[]; plan: Plan }) {
  const router = useRouter();
  const bookable = warehouses.filter((w) => w.availableM2 > 0);
  const [warehouseId, setWarehouseId] = useState(bookable[0]?.id ?? "");
  const selected = warehouses.find((w) => w.id === warehouseId);
  const [area, setArea] = useState(5);
  const [durationMonths, setDurationMonths] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function discountFor(months: number) {
    if (!plan) return 0;
    if (months === 3) return plan.discountPct3m;
    if (months === 6) return plan.discountPct6m;
    if (months === 12) return plan.discountPct12m;
    return 0;
  }

  const pricePreview = useMemo(() => {
    if (!plan) return null;
    const baseMonthly = Math.max(area * plan.pricePerM2, plan.minMonthlyFee);
    const discountPct = discountFor(durationMonths);
    const discountedMonthly = baseMonthly * (1 - discountPct / 100);
    const total = discountedMonthly * durationMonths;
    return { baseMonthly, discountPct, discountedMonthly, total };
  }, [plan, area, durationMonths]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ warehouseId: Number(warehouseId), allocatedM2: Number(area), durationMonths }),
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
      <p className="text-sm text-muted mb-4">اختر المخزن والمساحة ومدة الاشتراك، وسيتم حساب الرسوم تلقائيًا.</p>

      {warehouses.length === 0 ? (
        <p className="text-sm text-muted">لا توجد مخازن متاحة حاليًا — راجع الإدارة.</p>
      ) : bookable.length === 0 ? (
        <p className="text-sm text-danger">كل المخازن المتاحة ممتلئة حاليًا. حاول لاحقًا أو تواصل مع الإدارة.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 items-end">
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
          </div>

          <div>
            <Label htmlFor="duration">مدة الاشتراك</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              {DURATION_OPTIONS.map((opt) => {
                const discount = discountFor(opt.months);
                const isSelected = durationMonths === opt.months;
                return (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setDurationMonths(opt.months)}
                    className={`rounded-lg border px-3 py-2 text-sm text-center transition-colors ${
                      isSelected ? "border-signal bg-signal/10 text-signal font-semibold" : "border-line hover:bg-line-soft"
                    }`}
                  >
                    <div>{opt.label}</div>
                    {discount > 0 && <div className="text-xs mt-0.5 text-success">خصم {discount}%</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {pricePreview && (
            <div className="rounded-lg bg-line-soft/50 p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">الرسوم الشهرية الأساسية</span>
                <span>{pricePreview.baseMonthly.toLocaleString()} EGP</span>
              </div>
              {pricePreview.discountPct > 0 && (
                <div className="flex justify-between text-success">
                  <span>الرسوم الشهرية بعد الخصم ({pricePreview.discountPct}%)</span>
                  <span>{pricePreview.discountedMonthly.toLocaleString()} EGP</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-1 border-t border-line mt-1">
                <span>إجمالي المدة ({durationMonths} شهر)</span>
                <span>{pricePreview.total.toLocaleString()} EGP</span>
              </div>
            </div>
          )}
        </form>
      )}
      {error && <p className="text-sm text-danger mt-3">{error}</p>}
    </Card>
  );
}