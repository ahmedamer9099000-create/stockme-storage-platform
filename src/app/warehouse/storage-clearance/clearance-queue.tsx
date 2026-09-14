"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, EmptyState } from "@/components/ui";

type AllocationRow = {
  id: number;
  customerName: string;
  warehouseName: string;
  allocatedM2: number;
};

export function ClearanceQueue({ initialAllocations }: { initialAllocations: AllocationRow[] }) {
  const router = useRouter();
  const [allocations, setAllocations] = useState(initialAllocations);
  const [busy, setBusy] = useState<number | null>(null);

  async function confirmClearance(id: number) {
    setBusy(id);
    await fetch(`/api/storage/${id}/confirm-clearance`, { method: "POST" });
    setBusy(null);
    setAllocations((rows) => rows.filter((r) => r.id !== id));
    router.refresh();
  }

  if (allocations.length === 0) {
    return <EmptyState title="لا توجد مساحات بانتظار تأكيد الإخلاء" />;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {allocations.map((a) => (
        <Card key={a.id} className="bg-surface p-4">
          <p className="text-xs text-muted mb-1">{a.warehouseName}</p>
          <p className="font-semibold mb-1">{a.customerName}</p>
          <p className="text-sm text-muted mb-4">{a.allocatedM2} م² — انتهى الحجز ولم يُجدَّد</p>
          <Button size="sm" onClick={() => confirmClearance(a.id)} disabled={busy === a.id}>
            {busy === a.id ? "..." : "تم الإخلاء"}
          </Button>
        </Card>
      ))}
    </div>
  );
}