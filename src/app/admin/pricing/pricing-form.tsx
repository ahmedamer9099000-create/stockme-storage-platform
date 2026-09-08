"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card } from "@/components/ui";

type Plan = {
  pricePerM2: number;
  minMonthlyFee: number;
  pricePerCarton: number | null;
  pricePerPallet: number | null;
  receivingFee: number | null;
  pickingFee: number | null;
  packingFee: number | null;
  returnFee: number | null;
  shippingHandlingFee: number | null;
};

const fields: { key: keyof Plan; label: string }[] = [
  { key: "pricePerM2", label: "السعر لكل م²/شهر" },
  { key: "minMonthlyFee", label: "الحد الأدنى للفاتورة الشهرية" },
  { key: "pricePerCarton", label: "السعر لكل كرتونة" },
  { key: "pricePerPallet", label: "السعر لكل طبلية (Pallet)" },
  { key: "receivingFee", label: "رسوم الاستلام" },
  { key: "pickingFee", label: "رسوم التجهيز (Picking)" },
  { key: "packingFee", label: "رسوم التغليف (Packing)" },
  { key: "returnFee", label: "رسوم المرتجعات" },
  { key: "shippingHandlingFee", label: "رسوم مناولة الشحن" },
];

export function PricingForm({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [form, setForm] = useState(plan);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await fetch("/api/settings/pricing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card className="bg-surface p-6 max-w-xl">
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <Label htmlFor={f.key}>{f.label} (EGP)</Label>
            <Input
              id={f.key}
              type="number"
              value={form[f.key] ?? 0}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: Number(e.target.value) }))}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} disabled={loading}>
          {loading ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </Button>
        {saved && <span className="text-sm text-success">تم الحفظ ✓</span>}
      </div>
    </Card>
  );
}
