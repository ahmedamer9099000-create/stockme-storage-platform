"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, EmptyState } from "@/components/ui";

type Product = {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  category: string | null;
  quantity: number;
  minStock: number;
  unitWeightKg: number | null;
  unitDimensions: string | null;
};

type SortKey = "name" | "quantity" | "sku";

export function InventoryTable({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    let rows = products;
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }
    return [...rows].sort((a, b) => {
      if (sortKey === "quantity") return b.quantity - a.quantity;
      if (sortKey === "sku") return a.sku.localeCompare(b.sku);
      return a.name.localeCompare(b.name, "ar");
    });
  }, [products, search, sortKey]);

  function exportCsv() {
    const headers = ["SKU", "Barcode", "Name", "Category", "Quantity", "MinStock"];
    const lines = [headers.join(",")];
    for (const p of filtered) {
      lines.push([p.sku, p.barcode ?? "", p.name, p.category ?? "", p.quantity, p.minStock].map((v) => JSON.stringify(v)).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteProduct(id: number) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input placeholder="ابحث بالاسم أو SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select className="rounded-lg border border-line px-3 py-2 text-sm" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="name">ترتيب: الاسم</option>
          <option value="quantity">ترتيب: الكمية</option>
          <option value="sku">ترتيب: SKU</option>
        </select>
        <Button size="sm" variant="ghost" onClick={exportCsv}>
          تصدير CSV
        </Button>
        <Button size="sm" onClick={() => setShowForm((s) => !s)} className="mr-auto">
          {showForm ? "إغلاق" : "+ إضافة منتج"}
        </Button>
      </div>

      {showForm && (
        <AddProductForm
          onCreated={(p) => {
            setProducts((prev) => [p, ...prev]);
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد منتجات" description="أضف أول منتج لبدء تتبع مخزونك" />
      ) : (
        <Card className="bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-line-soft/50 text-right">
                {["SKU", "المنتج", "الفئة", "الكمية", "الحد الأدنى", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium text-muted whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{p.category ?? "—"}</td>
                  <td className={`px-4 py-3 ${p.quantity <= p.minStock ? "text-danger font-medium" : ""}`}>{p.quantity}</td>
                  <td className="px-4 py-3 text-muted">{p.minStock}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteProduct(p.id)} className="text-danger text-xs hover:underline">
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function AddProductForm({ onCreated }: { onCreated: (p: Product) => void }) {
  const [form, setForm] = useState({ sku: "", name: "", category: "", initialQuantity: 0, minStock: 5 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    setLoading(false);
    if (!json.success) {
      setError(json.error);
      return;
    }
    onCreated(json.data);
  }

  return (
    <Card className="bg-surface p-4 mb-4">
      <form onSubmit={submit} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="name">اسم المنتج</Label>
          <Input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="category">الفئة</Label>
          <Input id="category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="qty">الكمية الافتتاحية</Label>
          <Input id="qty" type="number" min={0} value={form.initialQuantity} onChange={(e) => setForm((f) => ({ ...f, initialQuantity: Number(e.target.value) }))} />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "..." : "إضافة"}
        </Button>
      </form>
      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </Card>
  );
}
