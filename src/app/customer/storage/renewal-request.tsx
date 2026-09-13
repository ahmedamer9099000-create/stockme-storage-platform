"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

type Plan = { pricePerM2: number; minMonthlyFee: number; discountPct3m: number; discountPct6m: number; discountPct12m: number } | undefined;

const DURATION_OPTIONS = [
  { months: 1, label: "شهر واحد" },
  { months: 3, label: "3 شهور" },
  { months: 6, label: "6 شهور" },
  { months: 12, label: "سنة كاملة" },
];

export function RenewalRequest({
  allocationId,
  hasPendingRenewal,
  plan,
  allocatedM2,
}: {
  allocationId: number;
  hasPendingRenewal: boolean;
  plan: Plan;
  allocatedM2: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
    const baseMonthly = Math.max(allocatedM2 * plan.pricePerM2, plan.minMonthlyFee);
    const discountPct = discountFor(durationMonths);
    const discountedMonthly = baseMonthly * (1 - discountPct / 100);
    const total = discountedMonthly * durationMonths;
    return { discountPct, discountedMonthly, total };
  }, [plan, allocatedM2, durationMonths]);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/storage/${allocationId}/renew`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMonths }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!json.success) {
      setError(json.error ?? "تعذر إرسال طلب التجديد");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (hasPendingRenewal) {
    return <p className="text-xs text-warning mt-2">طلب التجديد قيد المراجعة من الإدارة.</p>;
  }

  if (!open) {
    return (
      <Button size="sm" className="mt-2" onClick={() => setOpen(true)}>
        طلب تجديد
      </Button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-line p-3 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
      {pricePreview && (
        <div className="text-sm">
          <span className="text-muted">إجمالي المدة: </span>
          <span className="font-semibold">{pricePreview.total.toLocaleString()} EGP</span>
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={submit}>
          {busy ? "جارٍ الإرسال..." : "تأكيد طلب التجديد"}
        </Button>
        <Button size="sm" type="button" onClick={() => setOpen(false)} className="bg-transparent text-ink border border-line hover:bg-line-soft">
          إلغاء
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}