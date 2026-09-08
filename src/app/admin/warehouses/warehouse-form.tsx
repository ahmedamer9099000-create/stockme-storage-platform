"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

export function WarehouseForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/warehouses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        code,
        address: address || undefined,
        totalCapacityM2: Number(capacity),
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!json.success) {
      setError(json.error ?? "تعذر إضافة المخزن");
      return;
    }
    setName("");
    setCode("");
    setAddress("");
    setCapacity(100);
    router.refresh();
  }

  return (
    <Card className="bg-surface p-5 max-w-2xl">
      <p className="font-display font-semibold mb-1">إضافة مخزن جديد</p>
      <p className="text-sm text-muted mb-4">
        بمجرد الإضافة، يظهر المخزن تلقائيًا لكل التجار عند حجز مساحة تخزين.
      </p>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="name">اسم المخزن</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="مخزن القاهرة الرئيسي" />
        </div>
        <div>
          <Label htmlFor="code">كود المخزن</Label>
          <Input id="code" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="CAI-01" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">العنوان (اختياري)</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="المنطقة الصناعية، القاهرة" />
        </div>
        <div>
          <Label htmlFor="capacity">السعة الكلية (م²)</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            step="0.5"
            required
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy}>
            {busy ? "جارٍ الإضافة..." : "إضافة المخزن"}
          </Button>
        </div>
      </form>
      {error && <p className="text-sm text-danger mt-3">{error}</p>}
    </Card>
  );
}
