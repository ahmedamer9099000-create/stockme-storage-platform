# النشر (Deployment) — Cloudflare Workers + D1

المشروع مُجهَّز للنشر على **Cloudflare Workers** (استضافة السيرفر عبر [OpenNext](https://opennext.js.org/cloudflare)) مع **Cloudflare D1** (قاعدة بيانات SQLite مُدارة) كبديل لملف SQLite المحلي. الاثنان مجانيان تمامًا وميحتاجوش بطاقة ائتمان (على عكس Firebase App Hosting اللي بيطلب حساب Blaze).

## القيد الأهم قبل أي نشر إنتاجي

`JWT_SECRET` الافتراضي (`dev-secret-change-me-in-production`) **يجب تغييره** قبل أي نشر عام — أي شخص يعرف هذه القيمة الافتراضية يمكنه تزوير جلسة دخول بأي دور. ولّد قيمة عشوائية قوية:

```bash
openssl rand -base64 32
```

هتضيفها كـ **secret** على Cloudflare (مش plain text)، بالخطوات تحت.

## لماذا D1 بدل ملف SQLite المحلي؟

Cloudflare Workers بيئة serverless — نظام الملفات مؤقت (ephemeral)، فملف `data/app.db` مش هيفضل موجود بين الطلبات. D1 هو حل Cloudflare الرسمي: نفس محرك SQLite لكن مُدار ومتاح كـ binding داخل الـ Worker. الكود اتحول بالفعل ليستخدم D1 عبر `drizzle-orm/d1` (شوف `src/db/index.ts`).

**ملاحظة مهمة:** D1 لا يدعم `db.transaction()` التفاعلي (زي better-sqlite3). الكود بيستخدم بدلاً منه `db.batch()` للعمليات اللي تحتاج ذرية (atomicity) حقيقية، وكتابات متتالية (sequential) في الحالات التانية — كل مكان معلَّم بتعليق `NOTE (D1)` في الكود يوضح السبب.

## خطوات النشر الكاملة

### 1) تسجيل الدخول على Cloudflare

```bash
npx wrangler login
```

هيفتح المتصفح لتسجيل الدخول (أو إنشاء حساب مجاني لو مش عندك واحد — من غير بطاقة ائتمان).

### 2) إنشاء قاعدة بيانات D1

```bash
npx wrangler d1 create storage-platform-db
```

هيطبع output فيه `database_id`. انسخه وحطه في `wrangler.jsonc` مكان `REPLACE_WITH_YOUR_D1_DATABASE_ID`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "storage-platform-db",
    "database_id": "الـ id اللي نسخته هنا",
    "migrations_dir": "drizzle"
  }
]
```

### 3) تثبيت الباكدجات

```bash
npm install
```

### 4) توليد ملفات الـ migration (لو مش موجودة بالفعل)

```bash
npm run db:generate
```

بينشئ ملفات SQL في `./drizzle` من `src/db/schema.ts`.

### 5) تطبيق الـ migrations على D1

للتجربة المحلية أولًا (D1 المحلي بيشتغل عبر Miniflare، بدون أي اتصال إنترنت):

```bash
npm run db:migrate:local
```

وبعد التأكد إن كل حاجة تمام، على قاعدة البيانات الحقيقية على Cloudflare:

```bash
npm run db:migrate:remote
```

### 6) بيانات تجريبية (اختياري)

```bash
npm run db:seed:local     # لقاعدة البيانات المحلية
npm run db:seed:remote    # لقاعدة البيانات الحقيقية — لا تُشغِّله على بيانات إنتاج فعلية
```

بيولّد ملف `seed-data/seed.sql` ويطبّقه عبر `wrangler d1 execute`.

### 7) ضبط الـ secrets

```bash
npx wrangler secret put JWT_SECRET
```

هيطلب منك تلصق القيمة اللي ولّدتها بـ `openssl rand -base64 32` فوق.

### 8) معاينة محلية (اختياري لكن موصى به)

```bash
npm run cf:preview
```

بيبني المشروع بالكامل ويشغّله محليًا بنفس بيئة Cloudflare Workers (مش `next dev` العادي) — أدق طريقة تتأكد إن حاجة معينة مش هتنكسر بعد النشر الفعلي.

### 9) النشر الفعلي

```bash
npm run cf:deploy
```

هيبني المشروع (عبر OpenNext) وينشره على Cloudflare Workers. في الآخر هيطبع الرابط بتاع موقعك (`https://storage-platform.<اسم-حسابك>.workers.dev` أو دومين مخصص لو ضبطته).

## بعد النشر

- غيّر كلمات مرور كل الحسابات التجريبية (`Demo@1234`) أو احذفها كليًا قبل فتح النظام لمستخدمين حقيقيين:
  ```bash
  npx wrangler d1 execute storage-platform-db --remote --command="DELETE FROM users WHERE email LIKE '%@demo.com'"
  ```
- HTTPS مفعّل تلقائيًا على كل نطاقات `*.workers.dev` وأي دومين مخصص تضيفه عبر Cloudflare — كوكي الجلسة مضبوط بـ `secure: true` تلقائيًا في `production`.
- راقب استخدامك المجاني من لوحة تحكم Cloudflare (Workers & Pages → مشروعك → Metrics) للتأكد إنك لسه جوه الحدود المجانية (100 ألف طلب/يوم، 5GB تخزين D1).

## بدائل تانية (لو غيّرت رأيك بخصوص Cloudflare)

- **VPS/استضافة بخادم دائم** (Railway، Render، Fly.io، أو أي VPS): يرجع الكود لاستخدام `better-sqlite3` بدل D1، وملف `data/app.db` هيفضل شغال عادي لأن السيرفر دائم. محتاج رجوع جزئي في الكود (راجع commit history أو اسأل هنا لو عايز تعمل ده).
- **Vercel + Postgres**: Vercel أنسب استضافة لـ Next.js عمومًا لكن محتاج قاعدة بيانات خارجية زي Postgres (Neon/Supabase) بدل D1 — تفاصيل الانتقال في [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md#الانتقال-إلى-postgresql).
