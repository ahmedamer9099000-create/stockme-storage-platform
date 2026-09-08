"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function WarehouseDeleteButton({ warehouseId, warehouseName }: { warehouseId: number; warehouseName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm(`هل أنت متأكد من حذف مخزن "${warehouseName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/warehouses/${warehouseId}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!json.success) {
      setError(json.error ?? "تعذر حذف المخزن");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <Button size="sm" variant="danger" onClick={remove} disabled={loading}>
        {loading ? "جارٍ الحذف..." : "حذف"}
      </Button>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
