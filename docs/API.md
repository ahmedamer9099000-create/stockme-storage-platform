# توثيق الـ API

كل الـ endpoints تحت `/api`. المصادقة عبر HttpOnly cookie (`session_token`) يُضبَط تلقائيًا عند `/api/auth/login` أو `/api/auth/register` — لا حاجة لإرسال Authorization header يدويًا من المتصفح، لكن عند الاختبار بـ curl استخدم `-c cookies.txt` ثم `-b cookies.txt`.

كل استجابة بالشكل:
```json
{ "success": true, "data": ... }
{ "success": false, "error": "رسالة بالعربية" }
```

## Auth

| Method | Path | من يستطيع | الوصف |
|---|---|---|---|
| POST | `/api/auth/register` | عام | ينشئ حساب عميل جديد (Customer) + عميل مرتبط به، ويسجّل الدخول تلقائيًا |
| POST | `/api/auth/login` | عام | `{ email, password }` → يضبط جلسة الدخول |
| POST | `/api/auth/logout` | مسجَّل دخول | يمسح الجلسة |
| GET | `/api/auth/me` | مسجَّل دخول | بيانات المستخدم الحالي |

## Products / Inventory

| Method | Path | من يستطيع | الوصف |
|---|---|---|---|
| GET | `/api/products?search=&customerId=` | الكل | العميل يرى منتجاته فقط؛ الإدارة/الموظفون يرون الكل أو يصفّون بـ `customerId` |
| POST | `/api/products` | الكل | ينشئ منتجًا؛ `initialQuantity` يُسجَّل كحركة `IN` في السجل |
| GET/PATCH/DELETE | `/api/products/[id]` | حسب الملكية | DELETE للإدارة فقط |
| GET | `/api/products/[id]/movements` | حسب الملكية | سجل حركة المخزون الكامل للمنتج |
| POST | `/api/products/[id]/movements` | موظف/إدارة | تعديل يدوي (`ADJUSTMENT` أو `DAMAGE`) |

## Customers (إدارة)

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/customers` | كل العملاء |
| POST | `/api/customers` | إنشاء عميل يدويًا (مع تسجيل دخول اختياري) |
| GET | `/api/customers/[id]` | عرض 360° — مخزون، طلبات، فواتير، مساحة |
| PATCH | `/api/customers/[id]` | تعديل بيانات أو تعليق/تفعيل (`status`) |
| DELETE | `/api/customers/[id]` | Super Admin فقط |

## Warehouses

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/warehouses` | كل المخازن |
| POST | `/api/warehouses` | إنشاء مخزن (إدارة) |

## Receiving

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/receiving` | أوامر الاستلام (العميل يرى أوامره فقط) |
| POST | `/api/receiving` | إنشاء أمر استلام معلَّق مع أصناف متوقَّعة |
| POST | `/api/receiving/[id]/confirm` | تأكيد الكميات الفعلية → يحدّث المخزون عبر السجل تلقائيًا + إشعار للعميل |

## Orders

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/orders` | الطلبات (مُصفَّاة حسب الدور) |
| POST | `/api/orders` | طلب إخراج بضاعة جديد (حالة `pending`) |
| GET | `/api/orders/[id]` | تفاصيل كاملة: الأصناف، Picking، Packing، الشحنة |
| PATCH | `/api/orders/[id]` | تعديل حالة الدفع/العنوان (موظف/إدارة) |
| POST | `/api/orders/[id]/confirm` | يُنشئ مهمة Picking لكل صنف، ينقل الحالة إلى `picking` |
| POST | `/api/orders/[id]/packing` | يتطلب الحالة `picked`؛ يسجّل التغليف وينقل الحالة إلى `packed` |
| POST | `/api/orders/[id]/shipment` | يتطلب الحالة `packed`؛ يسجّل الشحن يدويًا وينقل الحالة إلى `shipped` + إشعار |

## Picking

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/picking-tasks?status=pending` | قائمة مهام التجهيز مع بيانات المنتج وموقعه |
| POST | `/api/picking-tasks/[id]/pick` | `{ pickedQty }` → يخصم المخزون عبر السجل (`OUT`)، ينقل الطلب لـ `picked` تلقائيًا عند اكتمال كل المهام |
| POST | `/api/picking-tasks/[id]/report` | `{ issue: "missing"|"damaged", notes? }` → يُشعِر الإدارة |

## Returns

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/returns` | المرتجعات (مُصفَّاة حسب الدور) |
| POST | `/api/returns` | إنشاء طلب إرجاع |
| POST | `/api/returns/[id]/process` | `{ decision: "return_to_stock"\|"damaged"\|"quarantine"\|"dispose" }` — `return_to_stock` وحده يعيد الكمية للمخزون فعليًا |

## Billing

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/invoices` | الفواتير (مُصفَّاة حسب الدور) |
| POST | `/api/invoices/generate` | `{ customerId, periodStart, periodEnd }` (unix seconds) — يبني فاتورة من التخزين + الاستلام + التجهيز + التغليف + المرتجعات الفعلية في الفترة، حسب إعدادات التسعير الحالية |
| GET | `/api/invoices/[id]` | تفاصيل + بنود + مدفوعات |
| POST | `/api/invoices/[id]/payments` | `{ amount, method, notes? }` — يُعيد حساب حالة الفاتورة (`paid`/`partially_paid`/`pending`) |

## Pricing Engine

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/settings/pricing` | خطة التسعير الافتراضية الحالية |
| PATCH | `/api/settings/pricing` | تعديل أي من: `pricePerM2`, `minMonthlyFee`, `pricePerCarton`, `pricePerPallet`, `receivingFee`, `pickingFee`, `packingFee`, `returnFee`, `shippingHandlingFee` (إدارة فقط) |

## Storage Calculator (عام)

| Method | Path | الوصف |
|---|---|---|
| POST | `/api/calculator` | بدون مصادقة — `{ areaM2, durationMonths, numberOfCartons, needsInventoryManagement, needsPicking, needsPacking, needsShipping, estimatedOrdersPerMonth }` → تقدير شهري مفصَّل |

## Leads (CRM)

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/leads` | إدارة فقط |
| POST | `/api/leads` | عام — نموذج الحجز في الصفحة الرئيسية/تواصل معنا |
| PATCH | `/api/leads/[id]` | تحديث الحالة/الملاحظات/متابعة (إدارة) |

## Dashboards (بيانات JSON للـ overview cards)

`GET /api/dashboard/admin` · `GET /api/dashboard/customer` · `GET /api/dashboard/warehouse`

## Reports

`GET /api/reports?type=<...>&from=&to=` — الأنواع: `inventory`, `storage-utilization`, `revenue`, `outstanding-payments`, `returns`, `damaged`, `warehouse-activity`. إدارة فقط.

## Notifications

`GET /api/notifications` · `POST /api/notifications/[id]/read`
