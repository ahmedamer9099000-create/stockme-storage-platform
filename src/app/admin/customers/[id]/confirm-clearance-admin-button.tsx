"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function ConfirmClearanceAdminButton({ allocationId }: { allocationId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    await fetch(`/api/storage/${allocationId}/confirm-clearance-admin`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" className="mt-2" onClick={confirm} disabled={loading}>
      {loading ? "..." : "تأكيد نهائي للإخلاء"}
    </Button>
  );
}