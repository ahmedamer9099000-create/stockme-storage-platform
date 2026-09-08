"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function ConfirmPaymentButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "paid" }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!json.success) return alert(json.error ?? "حدث خطأ");
    router.refresh();
  }

  return (
    <Button size="sm" onClick={confirm} disabled={busy}>
      {busy ? "..." : "تأكيد الدفع"}
    </Button>
  );
}
