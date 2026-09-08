"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function CustomerDeleteButton({ customerId, companyName }: { customerId: number; companyName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف عميل "${companyName}" نهائيًا؟ سيتم فقدان كل بياناته المرتبطة. هذا الإجراء لا يمكن التراجع عنه.`
      )
    )
      return;
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!json.success) return alert(json.error ?? "تعذر حذف العميل");
    router.push("/admin/customers");
    router.refresh();
  }

  return (
    <Button variant="danger" size="sm" onClick={remove} disabled={loading}>
      {loading ? "جارٍ الحذف..." : "حذف العميل نهائيًا"}
    </Button>
  );
}
