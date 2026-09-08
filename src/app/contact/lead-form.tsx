"use client";

import { useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";

export function LeadForm() {
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", businessType: "", requiredSpaceM2: "", numberOfProducts: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        requiredSpaceM2: form.requiredSpaceM2 ? Number(form.requiredSpaceM2) : undefined,
        numberOfProducts: form.numberOfProducts ? Number(form.numberOfProducts) : undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) {
      setError(json.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="bg-surface p-8 text-center max-w-md">
        <p className="font-display font-semibold text-lg mb-2">تم استلام طلبك ✓</p>
        <p className="text-sm text-muted">هنتواصل معاك في أقرب وقت على الرقم اللي كتبته.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-surface p-6 max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="name">الاسم</Label>
          <Input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="whatsapp">رقم واتساب (اختياري)</Label>
          <Input id="whatsapp" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="businessType">نوع النشاط</Label>
          <Input id="businessType" value={form.businessType} onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))} placeholder="ملابس، إلكترونيات..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="space">المساحة المطلوبة (م²)</Label>
            <Input id="space" type="number" value={form.requiredSpaceM2} onChange={(e) => setForm((f) => ({ ...f, requiredSpaceM2: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="products">عدد المنتجات تقريبًا</Label>
            <Input id="products" type="number" value={form.numberOfProducts} onChange={(e) => setForm((f) => ({ ...f, numberOfProducts: e.target.value }))} />
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "جارٍ الإرسال..." : "اطلب عرض سعر"}
        </Button>
      </form>
    </Card>
  );
}
