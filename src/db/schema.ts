import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const now = () => sql`(strftime('%s','now'))`;

// ============ USERS & AUTH ============
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_EMPLOYEE", "CUSTOMER"] }).notNull(),
  customerId: integer("customer_id"), // set when role = CUSTOMER
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  verificationToken: text("verification_token"),
  createdAt: integer("created_at").notNull().default(now()),
});

export const loginAttempts = sqliteTable("login_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  ip: text("ip").notNull(),
  success: integer("success", { mode: "boolean" }).notNull(),
  type: text("type", { enum: ["login", "register"] }).notNull().default("login"),
  createdAt: integer("created_at").notNull().default(now()),
});

// ============ CUSTOMERS ============
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  companyName: text("company_name").notNull(),
  businessType: text("business_type"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  address: text("address"),
  status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
  createdAt: integer("created_at").notNull().default(now()),
});

// ============ WAREHOUSE LOCATION HIERARCHY ============
export const warehouses = sqliteTable("warehouses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  totalCapacityM2: real("total_capacity_m2").notNull(),
  createdAt: integer("created_at").notNull().default(now()),
});

export const zones = sqliteTable("zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
});

export const racks = sqliteTable("racks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zoneId: integer("zone_id").notNull().references(() => zones.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
});

export const shelves = sqliteTable("shelves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rackId: integer("rack_id").notNull().references(() => racks.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
});

export const bins = sqliteTable("bins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shelfId: integer("shelf_id").notNull().references(() => shelves.id),
  name: text("name").notNull(),
  code: text("code").notNull(), // full path label e.g. A01-03-02
});

// ============ STORAGE ALLOCATION ============
export const storageAllocations = sqliteTable("storage_allocations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  allocatedM2: real("allocated_m2").notNull(),
  usedM2: real("used_m2").notNull().default(0),
  monthlyFee: real("monthly_fee").notNull(),
  startDate: integer("start_date").notNull().default(now()),
  endDate: integer("end_date"),
  status: text("status", { enum: ["active", "ended"] }).notNull().default("active"),
  approvalStatus: text("approval_status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
});

// ============ PRODUCTS & INVENTORY ============
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  sku: text("sku").notNull(),
  barcode: text("barcode"),
  name: text("name").notNull(),
  category: text("category"),
  description: text("description"),
  quantity: integer("quantity").notNull().default(0), // denormalized total on-hand, kept in sync via ledger
  minStock: integer("min_stock").notNull().default(0),
  unitWeightKg: real("unit_weight_kg"),
  unitDimensions: text("unit_dimensions"), // "LxWxH cm"
  imageUrl: text("image_url"),
  binId: integer("bin_id").references(() => bins.id),
  spaceM2: real("space_m2").notNull().default(0),
  reservedQty: integer("reserved_qty").notNull().default(0),
  requestedInitialQty: integer("requested_initial_qty"),
  approvalStatus: text("approval_status", { enum: ["pending", "approved", "rejected"] }).notNull().default("approved"),
  rejectionReason: text("rejection_reason"),
  createdAt: integer("created_at").notNull().default(now()),
});

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  type: text("type", { enum: ["IN", "OUT", "RETURN", "ADJUSTMENT", "DAMAGE", "TRANSFER"] }).notNull(),
  quantity: integer("quantity").notNull(),
  previousBalance: integer("previous_balance").notNull(),
  newBalance: integer("new_balance").notNull(),
  userId: integer("user_id").references(() => users.id),
  reason: text("reason"),
  referenceType: text("reference_type"), // 'receiving_order' | 'order' | 'return' | 'manual'
  referenceId: integer("reference_id"),
  createdAt: integer("created_at").notNull().default(now()),
});

// ============ RECEIVING ============
export const receivingOrders = sqliteTable("receiving_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  supplier: text("supplier"),
  status: text("status", { enum: ["pending", "received", "approved", "putaway"] }).notNull().default("pending"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at").notNull().default(now()),
  receivedAt: integer("received_at"),
  approvedAt: integer("approved_at"),
  putawayAt: integer("putaway_at"),
});

export const receivingItems = sqliteTable("receiving_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  receivingOrderId: integer("receiving_order_id").notNull().references(() => receivingOrders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  expectedQty: integer("expected_qty").notNull().default(0),
  receivedQty: integer("received_qty").notNull().default(0),
  damagedQty: integer("damaged_qty").notNull().default(0),
  binId: integer("bin_id").references(() => bins.id),
  notes: text("notes"),
});

// ============ ORDERS ============
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  status: text("status", {
    enum: ["pending", "confirmed", "picking", "picked", "packing", "packed", "ready_for_shipping", "shipped", "delivered", "cancelled", "returned"],
  }).notNull().default("pending"),
  shippingAddress: text("shipping_address"),
  paymentStatus: text("payment_status", { enum: ["paid", "pending", "overdue", "partially_paid"] }).notNull().default("pending"),
  paymentMethod: text("payment_method", { enum: ["cod", "online", "instapay"] }).notNull().default("cod"),
  paymentProofUrl: text("payment_proof_url"),
  createdAt: integer("created_at").notNull().default(now()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
});

// ============ PICKING / PACKING ============
export const pickingTasks = sqliteTable("picking_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  status: text("status", { enum: ["pending", "picked", "missing", "damaged"] }).notNull().default("pending"),
  pickedQty: integer("picked_qty").notNull().default(0),
  notes: text("notes"),
  createdAt: integer("created_at").notNull().default(now()),
  completedAt: integer("completed_at"),
});

export const packingTasks = sqliteTable("packing_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  packagingType: text("packaging_type"),
  weightKg: real("weight_kg"),
  dimensions: text("dimensions"),
  packagingCost: real("packaging_cost").default(0),
  status: text("status", { enum: ["pending", "packed"] }).notNull().default("pending"),
  notes: text("notes"),
  packedBy: integer("packed_by").references(() => users.id),
  createdAt: integer("created_at").notNull().default(now()),
  completedAt: integer("completed_at"),
});

// ============ SHIPPING ============
export const shipments = sqliteTable("shipments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  courier: text("courier"),
  trackingNumber: text("tracking_number"),
  shippingCost: real("shipping_cost").default(0),
  status: text("status", { enum: ["pending", "shipped", "in_transit", "delivered", "failed"] }).notNull().default("pending"),
  shippedAt: integer("shipped_at"),
  deliveredAt: integer("delivered_at"),
});

// ============ RETURNS ============
export const returns = sqliteTable("returns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  returnNumber: text("return_number").notNull().unique(),
  orderId: integer("order_id").references(() => orders.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  reason: text("reason").notNull(),
  condition: text("condition", { enum: ["good", "damaged", "missing", "destroyed"] }),
  decision: text("decision", { enum: ["return_to_stock", "damaged", "investigate", "dispose"] }),
  status: text("status", { enum: ["requested", "received", "investigating", "processed"] }).notNull().default("requested"),
  receivedAt: integer("received_at"),
  processedAt: integer("processed_at"),
  createdAt: integer("created_at").notNull().default(now()),
});

export const returnItems = sqliteTable("return_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  returnId: integer("return_id").notNull().references(() => returns.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
});

// ============ CARTON HANDOFFS (ready cartons handed to a courier, not tied to an order) ============
export const cartonHandoffs = sqliteTable("carton_handoffs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  cartonCount: integer("carton_count").notNull(),
  spaceFreedM2: real("space_freed_m2").notNull().default(0),
  courier: text("courier"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at").notNull().default(now()),
});

// ============ BILLING ============
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  periodStart: integer("period_start").notNull(),
  periodEnd: integer("period_end").notNull(),
  subtotal: real("subtotal").notNull().default(0),
  taxRate: real("tax_rate").notNull().default(14),
  taxAmount: real("tax_amount").notNull().default(0),
  total: real("total").notNull().default(0),
  status: text("status", { enum: ["draft", "paid", "pending", "overdue", "partially_paid"] }).notNull().default("pending"),
  dueDate: integer("due_date"),
  createdAt: integer("created_at").notNull().default(now()),
});

export const invoiceItems = sqliteTable("invoice_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  type: text("type", { enum: ["storage", "receiving", "picking", "packing", "return", "shipping", "other"] }).notNull(),
  quantity: real("quantity").notNull().default(1),
  amount: real("amount").notNull(),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  amount: real("amount").notNull(),
  method: text("method", { enum: ["cash", "bank_transfer", "online"] }).notNull(),
  status: text("status", { enum: ["completed", "pending", "failed"] }).notNull().default("completed"),
  paidAt: integer("paid_at").default(now()),
  notes: text("notes"),
});

// ============ PRICING ============
export const pricingPlans = sqliteTable("pricing_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  pricePerM2: real("price_per_m2").notNull(),
  minMonthlyFee: real("min_monthly_fee").notNull().default(0),
  pricePerCarton: real("price_per_carton").default(0),
  pricePerPallet: real("price_per_pallet").default(0),
  receivingFee: real("receiving_fee").default(0),
  pickingFee: real("picking_fee").default(0),
  packingFee: real("packing_fee").default(0),
  returnFee: real("return_fee").default(0),
  shippingHandlingFee: real("shipping_handling_fee").default(0),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
});

// ============ NOTIFICATIONS / AUDIT / LEADS / SETTINGS ============
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull().default(now()),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: integer("created_at").notNull().default(now()),
});

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  businessType: text("business_type"),
  requiredSpaceM2: real("required_space_m2"),
  numberOfProducts: integer("number_of_products"),
  requiredServices: text("required_services"), // JSON string array
  status: text("status", { enum: ["new", "contacted", "qualified", "proposal_sent", "won", "lost"] }).notNull().default("new"),
  notes: text("notes"),
  followUpDate: integer("follow_up_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: integer("created_at").notNull().default(now()),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});