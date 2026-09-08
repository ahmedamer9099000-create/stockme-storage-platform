"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";

export function RecordPaymentForm({ invoiceId, remaining }: { invoiceId: number; remaining: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(remaining);
  const [method, setMethod] = useState<"cash" | "bank_transfer" | "online">("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (amount <= 0) {
      setError("المبلغ يجب أن يكون أكبر من صفر");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) {
      setError(json.error ?? "حدث خطأ أثناء تسجيل الدفعة");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        تسجيل دفعة
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        type="number"
        min={0}
        step="0.01"
        className="w-28"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <select className="rounded-lg border border-line px-2 py-2 text-xs" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
        <option value="cash">كاش</option>
        <option value="bank_transfer">تحويل بنكي</option>
        <option value="online">دفع إلكتروني</option>
      </select>
      <Button size="sm" onClick={submit} disabled={loading}>
        {loading ? "جاري التسجيل..." : "تأكيد"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        إلغاء
      </Button>
      {error && <p className="text-xs text-danger w-full">{error}</p>}
    </div>
  );
}