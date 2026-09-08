"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import { Button, Card, Input, Label } from "@/components/ui";
import { useApiForm } from "@/lib/use-api-form";

type SessionUser = { role: "SUPER_ADMIN" | "ADMIN" | "WAREHOUSE_EMPLOYEE" | "CUSTOMER" };

function roleHome(role: SessionUser["role"]) {
  if (role === "CUSTOMER") return "/customer";
  if (role === "WAREHOUSE_EMPLOYEE") return "/warehouse";
  return "/admin";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { submit, error, loading } = useApiForm<SessionUser>((user) => router.push(roleHome(user.role)));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-16 px-5">
        <Card className="bg-surface p-8 w-full max-w-sm">
          <h1 className="font-display text-xl font-bold mb-1">تسجيل الدخول</h1>
          <p className="text-sm text-muted mb-6">ادخل لحسابك في مساحة</p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit("/api/auth/login", { email, password });
            }}
          >
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "جارٍ الدخول..." : "دخول"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-line text-xs text-muted space-y-1">
            <p className="font-semibold text-ink mb-1">حسابات تجريبية (كلمة المرور: Demo@1234)</p>
            <p>superadmin@demo.com — Super Admin</p>
            <p>admin@demo.com — Admin</p>
            <p>employee@demo.com — موظف مخزن</p>
            <p>customer@demo.com — عميل</p>
          </div>

          <p className="text-sm text-center mt-6">
            مفيش حساب؟ <Link href="/register" className="text-brand font-medium">سجّل الآن</Link>
          </p>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
