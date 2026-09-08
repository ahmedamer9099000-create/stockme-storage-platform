"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeadStatusSelect({ leadId, status, labels }: { leadId: number; status: string; labels: Record<string, string> }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function update(newStatus: string) {
    setValue(newStatus);
    setLoading(true);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      className="rounded-lg border border-line px-2 py-1.5 text-xs bg-white disabled:opacity-50"
      value={value}
      disabled={loading}
      onChange={(e) => update(e.target.value)}
    >
      {Object.entries(labels).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  );
}
