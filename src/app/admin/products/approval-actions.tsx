"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function ProductApprovalActions({ productId }: { productId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function decide(approve: boolean) {
    let reason: string | undefined;
    if (!approve) {
      reason = window.prompt("سبب الرفض (اختياري):") ?? undefined;
    }
    setLoading(true);
    await fetch(`/api/products/${productId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve, reason }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={loading} onClick={() => decide(true)}>
        موافقة
      </Button>
      <Button size="sm" variant="danger" disabled={loading} onClick={() => decide(false)}>
        رفض
      </Button>
    </div>
  );
}
