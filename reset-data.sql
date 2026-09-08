-- =====================================================================
-- Reset script: يمسح كل بيانات التجريبة (طلبات/عملاء/منتجات/فواتير)
-- ويسيب البنية التحتية زي هي (مخازن، خطط التسعير، حسابات الأدمن/الموظفين)
--
-- الترتيب مهم: بنمسح الجداول الفرعية الأول قبل الجداول الأساسية
-- عشان مانكسرش أي ربط بين الجداول (foreign keys).
-- =====================================================================

-- 1) التجهيز والتغليف والشحن (مرتبطين بالطلبات)
DELETE FROM picking_tasks;
DELETE FROM packing_tasks;
DELETE FROM shipments;

-- 2) المرتجعات
DELETE FROM return_items;
DELETE FROM returns;

-- 3) الطلبات
DELETE FROM order_items;
DELETE FROM orders;

-- 4) الاستلام (receiving)
DELETE FROM receiving_items;
DELETE FROM receiving_orders;

-- 5) حركة المخزون (ledger)
DELETE FROM inventory_movements;

-- 6) الفواتير والمدفوعات
DELETE FROM payments;
DELETE FROM invoice_items;
DELETE FROM invoices;

-- 7) حجوزات المساحات
DELETE FROM storage_allocations;

-- 8) المنتجات
DELETE FROM products;

-- 9) الإشعارات (كانت مرتبطة بطلبات/منتجات محذوفة، تنضيف عشان متفضلش يتيمة)
DELETE FROM notifications;

-- 10) العملاء
DELETE FROM customers;

-- 11) حسابات الدخول بتاعة العملاء بس (مش الأدمن ولا موظفي المخزن)
DELETE FROM users WHERE role = 'CUSTOMER';

-- 12) إعادة ضبط عدادات الـ ID عشان أول طلب/عميل/منتج جديد يبدأ برقم 1
DELETE FROM sqlite_sequence WHERE name IN (
  'picking_tasks', 'packing_tasks', 'shipments',
  'return_items', 'returns',
  'order_items', 'orders',
  'receiving_items', 'receiving_orders',
  'inventory_movements',
  'payments', 'invoice_items', 'invoices',
  'storage_allocations',
  'products',
  'notifications',
  'customers'
);
