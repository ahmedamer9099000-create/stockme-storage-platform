"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function OrderActions({ orderId, status }: { orderId: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run(url: string) {
    setBusy(true);
    const res = await fetch(url, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!json.success) return alert(json.error ?? "حدث خطأ");
    router.refresh();
  }
  if (status === "pending") return <Button size="sm" onClick={() => run(`/api/orders/${orderId}/confirm`)} disabled={busy}>{busy ? "..." : "تأكيد وبدء التجهيز"}</Button>;
  if (status === "shipped") return <Button size="sm" onClick={() => run(`/api/orders/${orderId}/deliver`)} disabled={busy}>{busy ? "..." : "تأكيد التسليم"}</Button>;
  return null;
}
