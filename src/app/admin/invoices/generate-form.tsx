"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

type Customer = { id: number; companyName: string };

export function GenerateInvoiceForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!customerId) return;
    setLoading(true);
    const now = Math.floor(Date.now() / 1000);
    await fetch("/api/invoices/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, periodStart: now - 30 * 24 * 60 * 60, periodEnd: now }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        إنشاء فاتورة جديدة
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select className="rounded-lg border border-line px-3 py-2 text-sm" value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}>
        <option value="">اختر عميلاً</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.companyName}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={generate} disabled={loading || !customerId}>
        {loading ? "جارٍ الإنشاء..." : "توليد"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        إلغاء
      </Button>
    </div>
  );
}
