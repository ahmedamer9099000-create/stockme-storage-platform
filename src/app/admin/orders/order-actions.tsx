"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  return (
    <div className="flex items-center gap-2">
      <Link href={`/admin/orders/${orderId}`} className="text-xs text-blue-600 hover:underline">
        عرض التفاصيل
      </Link>
      {status === "pending" && (
        <Button size="sm" onClick={() => run(`/api/orders/${orderId}/confirm`)} disabled={busy}>
          {busy ? "..." : "تأكيد وبدء التجهيز"}
        </Button>
      )}
      {status === "shipped" && (
        <Button size="sm" onClick={() => run(`/api/orders/${orderId}/deliver`)} disabled={busy}>
          {busy ? "..." : "تأكيد التسليم"}
        </Button>
      )}
    </div>
  );
}