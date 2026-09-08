"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function SuspendToggle({ customerId, status }: { customerId: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const newStatus = status === "active" ? "suspended" : "active";
    await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant={status === "active" ? "danger" : "secondary"} size="sm" onClick={toggle} disabled={loading}>
      {status === "active" ? "تعليق الحساب" : "تفعيل الحساب"}
    </Button>
  );
}
