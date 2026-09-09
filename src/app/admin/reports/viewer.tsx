"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, StatusPill, EmptyState } from "@/components/ui";

const reportTypes = [
  { key: "inventory", label: "تقرير المخزون" },
  { key: "storage-utilization", label: "إشغال المساحات" },
  { key: "revenue", label: "الإيرادات الشهرية" },
  { key: "outstanding-payments", label: "المدفوعات المستحقة" },
  { key: "returns", label: "المرتجعات" },
  { key: "damaged", label: "المنتجات التالفة" },
  { key: "warehouse-activity", label: "نشاط المخزن" },
];

const fieldLabels: Record<string, string> = {
  sku: "SKU",
  name: "الاسم",
  quantity: "الكمية",
  minStock: "الحد الأدنى",
  customerId: "رقم العميل",
  customerName: "العميل",
  companyName: "اسم المتجر",
  warehouseId: "المخزن",
  warehouseName: "المخزن",
  status: "الحالة",
  total: "الإجمالي",
  amount: "المبلغ",
  date: "التاريخ",
  createdAt: "التاريخ",
  month: "الشهر",
  allocatedM2: "المساحة المخصصة",
  usedM2: "المساحة المستخدمة",
  reason: "السبب",
  orderNumber: "رقم الطلب",
  invoiceNumber: "رقم الفاتورة",
};

function labelFor(key: string) {
  return fieldLabels[key] ?? key;
}

function isStatusField(key: string) {
  return key === "status" || key.toLowerCase().endsWith("status");
}

function isCodeField(key: string) {
  return key === "sku" || key.toLowerCase().endsWith("id") || key.toLowerCase().includes("number");
}

function formatValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return <span className="text-muted">—</span>;
  if (isStatusField(key) && typeof value === "string") return <StatusPill status={value} />;
  if (typeof value === "number") return value.toLocaleString("ar-EG");
  return String(value);
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

function ReportTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return <EmptyState title="لا توجد بيانات لهذا التقرير" description="جرّب نوع تقرير آخر أو راجع لاحقًا بعد تسجيل حركة جديدة" />;
  }
  const headers = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto -mx-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-line-soft/50 text-right">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium text-muted whitespace-nowrap">
                {labelFor(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line [&>tr:nth-child(even)]:bg-line-soft/30 [&>tr]:transition-colors [&>tr:hover]:bg-line-soft/60">
          {rows.map((row, i) => (
            <tr key={i}>
              {headers.map((h) => (
                <td key={h} className={`px-4 py-3 whitespace-nowrap ${isCodeField(h) ? "font-mono text-xs" : ""}`}>
                  {formatValue(h, row[h])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportSummary({ obj }: { obj: Record<string, unknown> }) {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return <EmptyState title="لا توجد بيانات لهذا التقرير" />;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map(([key, value]) => (
        <div key={key} className="border border-line rounded-xl p-4">
          <p className="text-xs text-muted mb-1.5">{labelFor(key)}</p>
          <p className="font-display font-bold text-lg">{formatValue(key, value)}</p>
        </div>
      ))}
    </div>
  );
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

  const isArray = Array.isArray(data);
  const recordCount = isArray ? (data as unknown[]).length : data ? 1 : 0;

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
          <p className="text-sm text-muted">{loading ? "جارٍ التحميل..." : `${recordCount} سجل`}</p>
          <Button size="sm" variant="ghost" onClick={exportCsv} disabled={!data}>
            تصدير CSV
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted text-center py-16">جارٍ التحميل...</p>
        ) : isArray ? (
          <ReportTable rows={data as Record<string, unknown>[]} />
        ) : data ? (
          <ReportSummary obj={data as Record<string, unknown>} />
        ) : (
          <EmptyState title="لا توجد بيانات لهذا التقرير" />
        )}
      </Card>
    </div>
  );
}
