"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site/chrome";
import { Button, Card, Input, Label } from "@/components/ui";
import { useApiForm } from "@/lib/use-api-form";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "", businessType: "", whatsapp: "" });
  const [registered, setRegistered] = useState(false);
  const { submit, error, loading } = useApiForm(() => setRegistered(true));

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (registered) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center py-16 px-5">
          <Card className="bg-surface p-8 w-full max-w-md text-center">
            <h1 className="font-display text-xl font-bold mb-2">افحص بريدك الإلكتروني 📩</h1>
            <p className="text-sm text-muted">
              بعتنالك رابط تأكيد على <strong>{form.email}</strong>. لازم تدوس عليه الأول عشان تقدر تسجّل الدخول.
            </p>
            <p className="text-sm text-center mt-6">
              بعد التأكيد <Link href="/login" className="text-brand font-medium">سجّل الدخول من هنا</Link>
            </p>
          </Card>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-16 px-5">
        <Card className="bg-surface p-8 w-full max-w-md">
          <h1 className="font-display text-xl font-bold mb-1">إنشاء حساب تاجر</h1>
          <p className="text-sm text-muted mb-6">احجز مساحتك الآن وابدأ التخزين خلال 24 ساعة</p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit("/api/auth/register", form);
            }}
          >
            <div>
              <Label htmlFor="companyName">اسم المتجر / النشاط</Label>
              <Input id="companyName" required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="متجر ..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">اسمك</Label>
                <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="businessType">نوع النشاط</Label>
                <Input id="businessType" value={form.businessType} onChange={(e) => set("businessType", e.target.value)} placeholder="ملابس، إلكترونيات..." />
              </div>
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="whatsapp">رقم واتساب</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} />
              <p className="text-xs text-muted mt-1">8 أحرف على الأقل، تحتوي على حرف ورقم</p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
            </Button>
          </form>

          <p className="text-sm text-center mt-6">
            عندك حساب؟ <Link href="/login" className="text-brand font-medium">سجّل الدخول</Link>
          </p>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}