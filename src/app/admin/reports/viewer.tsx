"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button } from "@/components/ui";

const reportTypes = [
  { key: "inventory", label: "تقرير المخزون" },
  { key: "storage-utilization", label: "إشغال المساحات" },
  { key: "revenue", label: "الإيرادات الشهرية" },
  { key: "outstanding-payments", label: "المدفوعات المستحقة" },
  { key: "returns", label: "المرتجعات" },
  { key: "damaged", label: "المنتجات التالفة" },
  { key: "warehouse-activity", label: "نشاط المخزن" },
];

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

export function ReportsViewer() {
  const [type, setType] = useState("inventory");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?type=${type}`);
    const json = await res.json();
    setData(json.success ? json.data : null);
    setLoading(false);
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  function exportCsv() {
    const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [data as Record<string, unknown>];
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {reportTypes.map((rt) => (
          <button
            key={rt.key}
            onClick={() => setType(rt.key)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              type === rt.key ? "bg-brand text-white border-brand" : "bg-white border-line text-ink/70 hover:border-brand"
            }`}
          >
            {rt.label}
          </button>
        ))}
      </div>

      <Card className="bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted">{loading ? "جارٍ التحميل..." : `${Array.isArray(data) ? data.length : 1} سجل`}</p>
          <Button size="sm" variant="ghost" onClick={exportCsv} disabled={!data}>
            تصدير CSV
          </Button>
        </div>
        <pre className="text-xs bg-line-soft rounded-lg p-4 overflow-auto max-h-[480px]" dir="ltr">
          {JSON.stringify(data, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
