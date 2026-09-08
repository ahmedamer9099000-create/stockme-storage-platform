# مساحة — Storage & Fulfillment Management Platform

منصة ويب كاملة لتأجير مساحات تخزين مرنة وخدمات Fulfillment (تجهيز وتغليف وشحن) للتجار وأصحاب المتاجر الإلكترونية.

بُنيت بـ **Next.js 16 (App Router) + TypeScript + Drizzle ORM + SQLite**، بواجهة عربية RTL أولاً مع دعم إنجليزي جزئي (LTR للحقول التقنية مثل SKU والباركود).

> **ملاحظة عن اختيار قاعدة البيانات:** الخطة الأصلية كانت PostgreSQL عبر Prisma، لكن بيئة البناء التي استُخدمت هنا تمنع الوصول لخوادم تحميل محرك Prisma (`binaries.prisma.sh`)، فتم التحول إلى **SQLite عبر Drizzle ORM**. المشروع أصلاً كان يستخدم `better-sqlite3` (ملف محلي) للتطوير، وتم تحويله لاحقًا إلى **Cloudflare D1** (نفس محرك SQLite، لكن مُدار من Cloudflare) عشان ينشر على Cloudflare Workers مجانًا بدون خادم دائم. التفاصيل الكاملة في [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## التشغيل محليًا

يتطلب Node.js 20+.

```bash
npm install
npm run db:migrate   # ينشئ قاعدة البيانات وجداولها (27 جدولاً)
npm run db:seed       # يملأ بيانات تجريبية: 10 عملاء، 50 منتج، 3 مخازن، 10 طلبات، 5 مرتجعات، 10 فواتير
npm run dev            # يشغّل السيرفر على http://localhost:3000
```

لإعادة البذر من الصفر (يمسح قاعدة البيانات بالكامل):

```bash
npm run db:reset
```

### متغيرات البيئة

انسخ `.env.example` إلى `.env.local` وعدّل حسب الحاجة (القيم الافتراضية تعمل مباشرة للتطوير المحلي):

```bash
cp .env.example .env.local
```

| المتغير | الوصف | افتراضي |
|---|---|---|
| `JWT_SECRET` | مفتاح توقيع جلسات الدخول — **غيّره إلزاميًا في أي بيئة إنتاج** | `dev-secret-change-me-in-production` |
| `DATABASE_PATH` | (قديم — كان يُستخدم مع `better-sqlite3` محليًا فقط، غير مستخدم بعد الانتقال لـ Cloudflare D1) | `./data/app.db` |

## حسابات تجريبية (Demo Accounts)

كلمة المرور لكل الحسابات: **`Demo@1234`**

| البريد الإلكتروني | الدور |
|---|---|
| `superadmin@demo.com` | Super Admin |
| `admin@demo.com` | Admin |
| `employee@demo.com` | Warehouse Employee |
| `customer@demo.com` | Customer (متجر تجربة 1) |

## البنية

- `/` الموقع العام (Home, How It Works, Pricing/Calculator, Fulfillment, Features, About, FAQ, Contact, Login, Register)
- `/admin` لوحة تحكم الإدارة (Super Admin + Admin)
- `/customer` لوحة تحكم العميل
- `/warehouse` لوحة تحكم موظف المخزن (متاحة أيضًا لـ Admin/Super Admin)
- `/api/*` كل الـ API — التوثيق الكامل في [`docs/API.md`](docs/API.md)

للتفاصيل المعمارية الكاملة راجع [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
للاختبار اليدوي خطوة بخطوة راجع [`docs/TESTING.md`](docs/TESTING.md).
لتعليمات النشر راجع [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## ما هو مُنفَّذ فعليًا مقابل ما هو TODO

القاعدة الملتزم بها في هذا المشروع: **لا Fake Functionality**. كل زر إما يعمل فعليًا أو موسوم بوضوح TODO. القائمة الكاملة في [`docs/TODO.md`](docs/TODO.md).

**تعمل فعليًا (end-to-end، مُختبرة يدويًا عبر smoke test كامل):** التسجيل/الدخول بأدوار RBAC، إدارة المنتجات والمخزون، **سجل حركة مخزون كامل (Ledger) — لا يُكتب `quantity` مباشرة أبدًا**، الاستلام (Receiving) مع تحديث المخزون تلقائيًا، الطلبات بدورة حياة كاملة (Pending→Confirmed→Picking→Picked→Packing→Packed→Shipped)، Picking مع خصم مخزون فعلي وأزرار Confirm/Missing/Damaged، Packing، Shipping (يدوي)، Returns بأربع قرارات مختلفة تؤثر على المخزون فعليًا، الفواتير (توليد تلقائي من التسعير + مدفوعات)، محرك التسعير القابل للتعديل من الإدارة، آلة حساب التخزين العامة، CRM بسيط للعملاء المحتملين، التقارير مع تصدير CSV، الإشعارات.

**TODO الأهم (تفاصيل كاملة في docs/TODO.md):** بوابة دفع إلكتروني حقيقية، تكامل WhatsApp API فعلي، تكامل API فعلي مع شركات الشحن، دعم قارئ باركود فعلي بالهاردوير، تصدير PDF للفواتير، اختبارات آلية شاملة، دعم إنجليزي كامل لكل الواجهة.
