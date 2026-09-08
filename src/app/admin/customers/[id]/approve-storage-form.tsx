"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function ApproveStorageForm({ allocationId }: { allocationId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  async function decide(approve: boolean) {
    setLoading(true);
    await fetch(`/api/storage/${allocationId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve, reason: approve ? undefined : reason }),
    });
    setLoading(false);
    setShowReject(false);
    router.refresh();
  }

  if (showReject) {
    return (
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <input
          type="text"
          placeholder="سبب الرفض (اختياري)"
          className="rounded-lg border border-line px-2 py-1 text-xs flex-1 min-w-[140px]"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button size="sm" onClick={() => decide(false)} disabled={loading}>
          {loading ? "..." : "تأكيد الرفض"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>
          إلغاء
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button size="sm" onClick={() => decide(true)} disabled={loading}>
        موافقة
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setShowReject(true)} disabled={loading}>
        رفض
      </Button>
    </div>
  );
}