"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, EmptyState, StatusPill } from "@/components/ui";

type ReturnRow = {
  id: number;
  returnNumber: string;
  customerName: string;
  reason: string;
  status: "requested" | "received" | "investigating" | "processed";
  items: { name: string; quantity: number }[];
};

const statusLabels: Record<string, string> = {
  requested: "بانتظار الاستلام",
  received: "بانتظار الفحص",
  investigating: "قيد التحقيق",
};

const conditionOptions: { key: "good" | "damaged" | "missing" | "destroyed"; label: string; variant: "primary" | "ghost" | "danger" }[] = [
  { key: "good", label: "سليم → للمخزون", variant: "primary" },
  { key: "damaged", label: "تالف", variant: "danger" },
  { key: "missing", label: "مفقود → تحقيق", variant: "ghost" },
  { key: "destroyed", label: "إتلاف كامل", variant: "danger" },
];

export function ReturnsQueue({ initialReturns }: { initialReturns: ReturnRow[] }) {
  const router = useRouter();
  const [returns, setReturns] = useState(initialReturns);
  const [busy, setBusy] = useState<number | null>(null);

  async function callAction(id: number, path: string, body?: object) {
    setBusy(id);
    await fetch(`/api/returns/${id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(null);
    setReturns((r) => r.filter((x) => x.id !== id));
    router.refresh();
  }

  if (returns.length === 0) {
    return <EmptyState title="لا توجد مرتجعات قيد المعالجة" />;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {returns.map((r) => (
        <Card key={r.id} className="bg-surface p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted">{r.customerName}</p>
            <StatusPill status={r.status} label={statusLabels[r.status]} />
          </div>
          <p className="font-mono text-sm font-semibold mb-1">{r.returnNumber}</p>
          <p className="text-sm text-muted mb-3">السبب: {r.reason}</p>
          <ul className="text-sm mb-4 space-y-1">
            {r.items.map((it, i) => (
              <li key={i}>
                {it.name} × {it.quantity}
              </li>
            ))}
          </ul>

          {r.status === "requested" && (
            <Button size="sm" onClick={() => callAction(r.id, "receive")} disabled={busy === r.id}>
              {busy === r.id ? "..." : "تأكيد الاستلام"}
            </Button>
          )}

          {r.status === "received" && (
            <div className="flex flex-wrap gap-2">
              {conditionOptions.map((c) => (
                <Button key={c.key} size="sm" variant={c.variant} onClick={() => callAction(r.id, "process", { condition: c.key })} disabled={busy === r.id}>
                  {c.label}
                </Button>
              ))}
            </div>
          )}

          {r.status === "investigating" && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => callAction(r.id, "resolve", { found: true })} disabled={busy === r.id}>
                تم العثور عليه → للمخزون
              </Button>
              <Button size="sm" variant="danger" onClick={() => callAction(r.id, "resolve", { found: false })} disabled={busy === r.id}>
                تأكيد الفقدان نهائيًا
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}