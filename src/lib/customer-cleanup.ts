import { db, schema } from "@/db";
import { eq, inArray } from "drizzle-orm";

/**
 * Fully deletes a customer and every row across the schema that references
 * them — orders (and their picking/packing/shipments), returns, receiving,
 * invoices/payments, products (and their inventory ledger), storage
 * allocations, and any user account tied to them.
 *
 * This exists because customers.id is referenced (NOT NULL) from many tables,
 * so a bare `DELETE FROM customers WHERE id = ?` fails with a foreign key
 * violation the moment the customer has any real activity — including an
 * active storage allocation. Deleting in this order (children before parents)
 * lets a Super Admin remove a customer regardless of how much history they have.
 */
export async function deleteCustomerCascade(customerId: number): Promise<void> {
  const orderRows = await db.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.customerId, customerId));
  const orderIds = orderRows.map((o) => o.id);

  const returnRows = await db.select({ id: schema.returns.id }).from(schema.returns).where(eq(schema.returns.customerId, customerId));
  const returnIds = returnRows.map((r) => r.id);

  const receivingRows = await db
    .select({ id: schema.receivingOrders.id })
    .from(schema.receivingOrders)
    .where(eq(schema.receivingOrders.customerId, customerId));
  const receivingIds = receivingRows.map((r) => r.id);

  const invoiceRows = await db.select({ id: schema.invoices.id }).from(schema.invoices).where(eq(schema.invoices.customerId, customerId));
  const invoiceIds = invoiceRows.map((i) => i.id);

  const productRows = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.customerId, customerId));
  const productIds = productRows.map((p) => p.id);

  const userRows = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.customerId, customerId));
  const userIds = userRows.map((u) => u.id);

  const statements: unknown[] = [];

  if (orderIds.length > 0) {
    statements.push(db.delete(schema.pickingTasks).where(inArray(schema.pickingTasks.orderId, orderIds)));
    statements.push(db.delete(schema.packingTasks).where(inArray(schema.packingTasks.orderId, orderIds)));
    statements.push(db.delete(schema.shipments).where(inArray(schema.shipments.orderId, orderIds)));
    statements.push(db.delete(schema.orderItems).where(inArray(schema.orderItems.orderId, orderIds)));
  }
  if (returnIds.length > 0) {
    statements.push(db.delete(schema.returnItems).where(inArray(schema.returnItems.returnId, returnIds)));
  }
  if (receivingIds.length > 0) {
    statements.push(db.delete(schema.receivingItems).where(inArray(schema.receivingItems.receivingOrderId, receivingIds)));
  }
  if (invoiceIds.length > 0) {
    statements.push(db.delete(schema.payments).where(inArray(schema.payments.invoiceId, invoiceIds)));
    statements.push(db.delete(schema.invoiceItems).where(inArray(schema.invoiceItems.invoiceId, invoiceIds)));
  }
  if (productIds.length > 0) {
    statements.push(db.delete(schema.inventoryMovements).where(inArray(schema.inventoryMovements.productId, productIds)));
  }
  if (userIds.length > 0) {
    statements.push(db.delete(schema.notifications).where(inArray(schema.notifications.userId, userIds)));
  }

  statements.push(db.delete(schema.orders).where(eq(schema.orders.customerId, customerId)));
  statements.push(db.delete(schema.returns).where(eq(schema.returns.customerId, customerId)));
  statements.push(db.delete(schema.receivingOrders).where(eq(schema.receivingOrders.customerId, customerId)));
  statements.push(db.delete(schema.invoices).where(eq(schema.invoices.customerId, customerId)));
  statements.push(db.delete(schema.products).where(eq(schema.products.customerId, customerId)));
  statements.push(db.delete(schema.storageAllocations).where(eq(schema.storageAllocations.customerId, customerId)));
  statements.push(db.delete(schema.users).where(eq(schema.users.customerId, customerId)));
  statements.push(db.delete(schema.customers).where(eq(schema.customers.id, customerId)));

  await db.batch(statements as never);
}
