"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, BinPath, EmptyState } from "@/components/ui";

type Task = { id: number; orderId: number; requestedQty: number; productName: string; productSku: string; location: string | null };

export function PickingQueue({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [busy, setBusy] = useState<number | null>(null);

  async function confirmPick(task: Task) {
    setBusy(task.id);
    const res = await fetch(`/api/picking-tasks/${task.id}/pick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickedQty: task.requestedQty }),
    });
    const json = await res.json();
    setBusy(null);
    if (json.success) {
      setTasks((t) => t.filter((x) => x.id !== task.id));
      router.refresh();
    } else {
      alert(json.error);
    }
  }

  async function report(task: Task, issue: "missing" | "damaged") {
    setBusy(task.id);
    await fetch(`/api/picking-tasks/${task.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issue }),
    });
    setBusy(null);
    setTasks((t) => t.filter((x) => x.id !== task.id));
    router.refresh();
  }

  if (tasks.length === 0) {
    return <EmptyState title="لا توجد مهام تجهيز معلَّقة" description="كل الطلبات مجهَّزة حاليًا 🎉" />;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((t) => (
        <Card key={t.id} className="bg-surface p-4">
          <p className="text-xs text-muted mb-1">طلب #{t.orderId}</p>
          <p className="font-semibold mb-1">{t.productName}</p>
          <p className="font-mono text-xs text-muted mb-3">{t.productSku}</p>
          <div className="mb-3">
            <BinPath code={t.location} />
          </div>
          <p className="text-sm mb-4">
            الكمية المطلوبة: <span className="font-semibold">{t.requestedQty}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => confirmPick(t)} disabled={busy === t.id}>
              تأكيد الالتقاط
            </Button>
            <Button size="sm" variant="ghost" onClick={() => report(t, "missing")} disabled={busy === t.id}>
              إبلاغ عن نقص
            </Button>
            <Button size="sm" variant="ghost" onClick={() => report(t, "damaged")} disabled={busy === t.id}>
              إبلاغ عن تلف
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
