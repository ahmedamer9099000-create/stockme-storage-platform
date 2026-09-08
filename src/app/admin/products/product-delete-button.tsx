"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function ProductDeleteButton({ productId, productName }: { productId: number; productName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm(`هل أنت متأكد من حذف منتج "${productName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    setLoading(true);
    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!json.success) return alert(json.error ?? "تعذر حذف المنتج");
    router.refresh();
  }

  return (
    <Button size="sm" variant="danger" onClick={remove} disabled={loading}>
      {loading ? "..." : "حذف"}
    </Button>
  );
}
