"use client";

import { useState } from "react";
import { Card, Button, Input, Label } from "@/components/ui";

type Estimate = { items: { label: string; amount: number }[]; monthlySubtotal: number; durationMonths: number; totalForDuration: number };

export function Calculator() {
  const [form, setForm] = useState({
    areaM2: 10,
    durationMonths: 1,
    numberOfProducts: 20,
    numberOfCartons: 10,
    needsInventoryManagement: true,
    needsPicking: false,
    needsPacking: false,
    needsShipping: false,
    estimatedOrdersPerMonth: 0,
  });
  const [result, setResult] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/calculator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    setLoading(false);
    if (!json.success) {
      setError(json.error);
      return;
    }
    setResult(json.data);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="bg-surface p-6">
        <form onSubmit={calculate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="area">المساحة المطلوبة (م²)</Label>
              <Input id="area" type="number" min={1} value={form.areaM2} onChange={(e) => setForm((f) => ({ ...f, areaM2: Number(e.target.value) }))} />
            </div>
            <div>
              <Label htmlFor="duration">مدة التخزين (أشهر)</Label>
              <Input id="duration" type="number" min={1} value={form.durationMonths} onChange={(e) => setForm((f) => ({ ...f, durationMonths: Number(e.target.value) }))} />
            </div>
            <div>
              <Label htmlFor="products">عدد المنتجات</Label>
              <Input id="products" type="number" min={0} value={form.numberOfProducts} onChange={(e) => setForm((f) => ({ ...f, numberOfProducts: Number(e.target.value) }))} />
            </div>
            <div>
              <Label htmlFor="cartons">عدد الكراتين</Label>
              <Input id="cartons" type="number" min={0} value={form.numberOfCartons} onChange={(e) => setForm((f) => ({ ...f, numberOfCartons: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="space-y-2">
            {[
              { key: "needsInventoryManagement" as const, label: "أحتاج إدارة مخزون رقمية" },
              { key: "needsPicking" as const, label: "أحتاج تجهيز الطلبات (Picking)" },
              { key: "needsPacking" as const, label: "أحتاج تغليف (Packing)" },
              { key: "needsShipping" as const, label: "أحتاج مناولة شحن" },
            ].map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form[opt.key]} onChange={(e) => setForm((f) => ({ ...f, [opt.key]: e.target.checked }))} />
                {opt.label}
              </label>
            ))}
          </div>

          {(form.needsPicking || form.needsPacking || form.needsShipping) && (
            <div>
              <Label htmlFor="orders">عدد الطلبات المتوقع شهريًا</Label>
              <Input id="orders" type="number" min={0} value={form.estimatedOrdersPerMonth} onChange={(e) => setForm((f) => ({ ...f, estimatedOrdersPerMonth: Number(e.target.value) }))} />
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "جاري الحساب..." : "احسب التكلفة"}
          </Button>
        </form>
      </Card>

      <Card className="bg-ink text-white p-6">
        {!result ? (
          <p className="text-white/60 text-sm">أدخل بياناتك واضغط &quot;احسب التكلفة&quot; لمشاهدة التقدير هنا.</p>
        ) : (
          <div>
            <p className="text-white/60 text-sm mb-4">تقديرك الشهري</p>
            <div className="space-y-3">
              {result.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white/70">{item.label}</span>
                  <span className="font-medium">{item.amount.toLocaleString()} EGP</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-white/15">
              <p className="text-white/60 text-sm mb-1">الإجمالي المتوقع</p>
              <p className="font-display font-bold text-4xl text-signal">
                {result.monthlySubtotal.toLocaleString()} <span className="text-lg font-normal text-white/70">EGP / شهر</span>
              </p>
            </div>

            {result.durationMonths > 1 && (
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                <span className="text-white/70">الإجمالي لمدة {result.durationMonths} شهر</span>
                <span className="font-semibold">{result.totalForDuration.toLocaleString()} EGP</span>
              </div>
            )}

            <Button href="/register" className="w-full mt-6">
              احجز مساحتك
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}