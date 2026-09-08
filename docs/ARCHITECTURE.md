# البنية المعمارية (Architecture)

## المكدس التقني (Technology Stack)

| الطبقة | التقنية | السبب |
|---|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + React 19 | Server Components تقلل الـ JS المُرسَل للمتصفح، وتناسب لوحات تحكم بيانات-كثيفة مثل هذا المشروع |
| Styling | Tailwind CSS v4 + مكوّنات مخصصة | لا مكتبة مكونات جاهزة كبيرة — تصميم مخصص خفيف مبني على design tokens (انظر `src/app/globals.css`) |
| Backend | Next.js Route Handlers (`src/app/api/**/route.ts`) | REST API حقيقي وقابل للتوثيق، بدل الاعتماد الكامل على Server Actions |
| Database | SQLite عبر `better-sqlite3` | **بديل عن الخطة الأصلية (PostgreSQL)** — انظر القسم أدناه |
| ORM | Drizzle ORM | **بديل عن الخطة الأصلية (Prisma)** — انظر القسم أدناه |
| Auth | JWT في HttpOnly Cookie (بدون مكتبة خارجية) | تحكم كامل في شكل الـ session وتفادي الاعتماد على خدمة auth خارجية لمشروع بهذا الحجم |
| Fonts | `@fontsource/*` (خطوط مُستضافة محليًا عبر npm) | **بديل عن `next/font/google`** — بيئة البناء تمنع الوصول لـ `fonts.googleapis.com` |

## لماذا SQLite + Drizzle بدل PostgreSQL + Prisma؟

الخطة الأصلية في هذا المستند كانت PostgreSQL (مُدار) + Prisma. أثناء التنفيذ الفعلي، فشل أمر `prisma init` لأن محرك Prisma (schema-engine) يُحمَّل من `binaries.prisma.sh` عند أول استخدام، وهذا النطاق غير متاح في بيئة البناء المستخدمة هنا (قائمة النطاقات المسموحة تقتصر على سجلات الحزم مثل npm/PyPI/crates وGitHub). هذا ليس قيدًا في المشروع نفسه، لكنه قيد في بيئة *هذه الجلسة* بالتحديد.

**البديل:** `better-sqlite3` (رابطة أصلية تُبنى محليًا عبر `node-gyp` بدون أي تحميل خارجي) مع **Drizzle ORM** كطبقة استعلام type-safe. هذا لم يُغيِّر أي شيء في تصميم الـ schema أو منطق التطبيق — فقط طبقة الاتصال بقاعدة البيانات.

### الانتقال إلى PostgreSQL

الانتقال بسيط نسبيًا لأن Drizzle يدعم PostgreSQL بنفس نمط الكود:

1. `npm install pg drizzle-orm` (موجود بالفعل) و`npm uninstall better-sqlite3`
2. تغيير `src/db/index.ts` من `drizzle-orm/better-sqlite3` إلى `drizzle-orm/node-postgres`، واستبدال `new Database(...)` بـ `new Pool({ connectionString })`
3. تغيير `src/db/schema.ts`: استبدال `sqliteTable`/`integer`/`text` باستيرادات `pg-core` المكافئة (`pgTable`/`serial`/`text`/`timestamp`) — معظم الحقول تُترجَم مباشرة، والفرق الأساسي هو نوع `id` (autoIncrement → serial) والتواريخ (unix integer → timestamp حقيقي)
4. `drizzle.config.ts`: تغيير `dialect: "sqlite"` إلى `dialect: "postgresql"` وتحديث `dbCredentials`
5. إعادة توليد الـ migrations: `npm run db:generate`

لا تغيير مطلوب في أي API route أو صفحة — كل الاستعلامات تمر عبر `db.select()/.insert()/.update()` من Drizzle، وهي نفس الواجهة لكل الـ dialects.

## مبدأ التصميم الأهم: سجل حركة المخزون (Inventory Ledger)

**لا يُكتب `products.quantity` مباشرة في أي مكان في الكود بخلاف `src/lib/inventory.ts`.** كل تغيير في المخزون (استلام، بيع، مرتجع، تعديل، تلف، نقل) يمر عبر دالة واحدة: `recordMovement()`.

هذه الدالة، داخل معاملة قاعدة بيانات واحدة (transaction):
1. تقرأ الرصيد الحالي
2. تحسب الرصيد الجديد وتتحقق أنه لا يقل عن صفر
3. تكتب صف جديد في `inventory_movements` (previousBalance, newBalance, type, userId, reason, reference)
4. تحدّث `products.quantity` بالقيمة الجديدة

هذا يضمن أن `products.quantity` هو دائمًا مجموع كل الحركات المسجَّلة — ولا يمكن أبدًا أن ينحرف عن السجل التاريخي، وكل رقم في النظام قابل للتتبع لمصدره.

## هيكل المجلدات

```
src/
  app/
    (site)                      الموقع العام: /, /pricing, /faq, /login, /register ...
    admin/                      لوحة الإدارة (Server Components تقرأ من DB مباشرة + مكوّنات client صغيرة للتفاعل)
    customer/                   لوحة العميل
    warehouse/                  لوحة موظف المخزن
    api/                        كل REST endpoints
  components/
    ui/                         مكوّنات أساسية (Button, Card, Input, StatusPill, BinPath...)
    site/                       Header/Footer وصفحة محتوى عامة
    dashboard/                  DashboardShell (Sidebar+Topbar)، PageHeader، StatCard، DataTable
  db/
    schema.ts                   تعريف الـ 27 جدولاً (Drizzle)
    index.ts                    عميل قاعدة البيانات (singleton)
  lib/
    auth.ts                     تجزئة كلمات المرور، JWT، قراءة/كتابة الجلسة، RBAC guards
    inventory.ts                recordMovement() — القلب الحسابي للنظام
    pricing.ts                  محرك التسعير (يقرأ من DB، لا أسعار مكتوبة بالكود)
    api-helpers.ts              أغلفة موحّدة للاستجابات + requireUser()
scripts/
  seed.ts                       بيانات تجريبية حسب المواصفة تمامًا (10 عملاء، 50 منتج...)
```

**نمط ثابت:** الصفحات نفسها Server Components تستعلم من `db` مباشرة (بدون round-trip عبر fetch لنفس السيرفر)، بينما التفاعل (نماذج، أزرار تُحدِّث حالة) في مكوّنات `"use client"` منفصلة تستدعي الـ API routes. هذا يقلل الـ JavaScript المرسَل للعميل ويُبقي منطق القراءة الأساسي في مكان واحد.

## RBAC

أربعة أدوار: `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_EMPLOYEE`, `CUSTOMER`. الفحص يتم على مستويين:
- **صفحة (Server Component):** كل `layout.tsx` في `/admin`, `/customer`, `/warehouse` يستدعي `getFreshUser()` (قراءة طازجة من DB، وليس فقط فك تشفير JWT، حتى ينعكس تعليق الحساب فورًا) ويُحوِّل لـ `/login` عند عدم التطابق.
- **API:** كل route يستدعي `requireUser(roles)` من `api-helpers.ts` كأول سطر.

عزل بيانات العميل: كل استعلام API يُصفَّى بـ `customerId` عندما يكون الطالب بدور `CUSTOMER` — لا يمكن لعميل رؤية بيانات عميل آخر (مُختبر في smoke test، انظر `docs/TESTING.md`).

## نقاط التوسع المستقبلية (مُصمَّمة داخل الـ schema لكن غير مُفعَّلة)

- **Multi-Warehouse:** الـ schema يدعمه بالفعل (`warehouses` → `zones` → `racks` → `shelves` → `bins`, و`storage_allocations.warehouseId`) — واجهة اختيار المخزن في نماذج الاستلام موجودة، لكن لا توجد بعد صفحة لإدارة عدة مخازن من لوحة الإدارة.
- **Integration Layer لشركات الشحن:** `POST /api/orders/[id]/shipment` يسجّل بيانات الشحن يدويًا الآن؛ الحقل مصمَّم ليصبح استدعاء API خارجي لاحقًا بدون تغيير في شكل البيانات المخزَّنة.
- **Barcode/QR:** حقل `products.barcode` موجود ومُستخدَم في البحث، لكن لا يوجد ماسح فعلي (يحتاج هاردوير/كاميرا في المتصفح).
- **AI Forecasting:** لا يوجد أي بنية له حاليًا — يحتاج تصميمًا منفصلاً عند الحاجة الفعلية.

القائمة الكاملة مع تفاصيل كل بند في [`TODO.md`](./TODO.md).
