-- reset-customers-products.sql
-- Wipes ALL customers, products, and every record that references them,
-- so the system starts fresh — as if newly launched.
--
-- Stays untouched: warehouses, pricing plans, settings, staff accounts
-- (ADMIN / SUPER_ADMIN / WAREHOUSE_EMPLOYEE), and leads.
--
-- Run once against your LIVE database with:
--   npx wrangler d1 execute storage-platform-db --remote --file=./scripts/reset-customers-products.sql
--
-- (Drop --remote to test against your local dev DB first.)

DELETE FROM picking_tasks;
DELETE FROM packing_tasks;
DELETE FROM shipments;
DELETE FROM order_items;
DELETE FROM orders;

DELETE FROM return_items;
DELETE FROM returns;

DELETE FROM receiving_items;
DELETE FROM receiving_orders;

DELETE FROM payments;
DELETE FROM invoice_items;
DELETE FROM invoices;

DELETE FROM inventory_movements;
DELETE FROM products;

DELETE FROM storage_allocations;

DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE customer_id IS NOT NULL);
DELETE FROM users WHERE customer_id IS NOT NULL;

DELETE FROM customers;

-- Restart auto-increment IDs from 1 for a truly clean slate.
DELETE FROM sqlite_sequence WHERE name IN (
  'picking_tasks', 'packing_tasks', 'shipments', 'order_items', 'orders',
  'return_items', 'returns', 'receiving_items', 'receiving_orders',
  'payments', 'invoice_items', 'invoices', 'inventory_movements', 'products',
  'storage_allocations', 'notifications', 'users', 'customers'
);
