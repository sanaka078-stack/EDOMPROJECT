import { jsPDF } from "jspdf";

// Colors matching the dark theme with gold accents
const COLORS = {
  primary: [212, 175, 55] as [number, number, number], // Gold
  dark: [26, 26, 26] as [number, number, number], // Dark background
  darkSecondary: [35, 35, 35] as [number, number, number], // Slightly lighter
  text: [255, 255, 255] as [number, number, number], // White text
  textDark: [60, 60, 60] as [number, number, number], // Dark text for light bg
  muted: [156, 163, 175] as [number, number, number], // Gray text
  border: [55, 55, 55] as [number, number, number], // Border color
  tableHeader: [40, 40, 40] as [number, number, number], // Table header bg
  tableRow: [30, 30, 30] as [number, number, number], // Table row bg
  tableRowAlt: [25, 25, 25] as [number, number, number], // Alternate row bg
};

// Database schema definition - all 45+ tables
const DATABASE_SCHEMA = {
  // Core Business
  products: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "name", type: "text", nullable: false },
      { name: "slug", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "price", type: "numeric", nullable: false },
      { name: "compare_at_price", type: "numeric", nullable: true },
      { name: "cost_price", type: "numeric", nullable: true },
      { name: "sku", type: "text", nullable: true },
      { name: "barcode", type: "text", nullable: true },
      { name: "quantity", type: "integer", nullable: false },
      { name: "category", type: "text", nullable: true },
      { name: "category_id", type: "uuid", nullable: true },
      { name: "images", type: "text[]", nullable: true },
      { name: "tags", type: "text[]", nullable: true },
      { name: "weight", type: "numeric", nullable: true },
      { name: "dimensions", type: "jsonb", nullable: true },
      { name: "is_active", type: "boolean", nullable: false },
      { name: "is_featured", type: "boolean", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "category_id", references: "categories.id" }],
    category: "Core Business",
  },
  product_variants: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "product_id", type: "uuid", nullable: false },
      { name: "name", type: "text", nullable: false },
      { name: "sku", type: "text", nullable: true },
      { name: "price", type: "numeric", nullable: true },
      { name: "compare_at_price", type: "numeric", nullable: true },
      { name: "quantity", type: "integer", nullable: true },
      { name: "options", type: "jsonb", nullable: true },
      { name: "image_url", type: "text", nullable: true },
      { name: "is_active", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "product_id", references: "products.id" }],
    category: "Core Business",
  },
  product_inventory: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "product_id", type: "uuid", nullable: false },
      { name: "variant_id", type: "uuid", nullable: true },
      { name: "quantity", type: "integer", nullable: true },
      { name: "sku", type: "text", nullable: true },
      { name: "low_stock_threshold", type: "integer", nullable: true },
      { name: "warehouse_location", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [
      { column: "product_id", references: "products.id" },
      { column: "variant_id", references: "product_variants.id" },
    ],
    category: "Core Business",
  },
  product_reviews: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "product_id", type: "uuid", nullable: false },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "customer_name", type: "text", nullable: true },
      { name: "rating", type: "integer", nullable: false },
      { name: "title", type: "text", nullable: true },
      { name: "content", type: "text", nullable: true },
      { name: "review_text", type: "text", nullable: true },
      { name: "is_verified", type: "boolean", nullable: true },
      { name: "is_approved", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "product_id", references: "products.id" }],
    category: "Core Business",
  },
  categories: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "name", type: "text", nullable: false },
      { name: "slug", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "image_url", type: "text", nullable: true },
      { name: "parent_id", type: "uuid", nullable: true },
      { name: "sort_order", type: "integer", nullable: true },
      { name: "is_active", type: "boolean", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "parent_id", references: "categories.id" }],
    category: "Core Business",
  },
  orders: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "order_number", type: "text", nullable: false },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "customer_id", type: "uuid", nullable: true },
      { name: "status", type: "text", nullable: false },
      { name: "payment_status", type: "text", nullable: true },
      { name: "payment_method", type: "text", nullable: true },
      { name: "subtotal", type: "numeric", nullable: false },
      { name: "shipping_cost", type: "numeric", nullable: true },
      { name: "discount_amount", type: "numeric", nullable: true },
      { name: "total_amount", type: "numeric", nullable: false },
      { name: "shipping_address", type: "jsonb", nullable: true },
      { name: "billing_address", type: "jsonb", nullable: true },
      { name: "notes", type: "text", nullable: true },
      { name: "tracking_number", type: "text", nullable: true },
      { name: "coupon_id", type: "uuid", nullable: true },
      { name: "coupon_code", type: "text", nullable: true },
      { name: "is_gift", type: "boolean", nullable: true },
      { name: "gift_message", type: "text", nullable: true },
      { name: "payment_verified_at", type: "timestamptz", nullable: true },
      { name: "payment_verified_by", type: "uuid", nullable: true },
      { name: "payment_verification_notes", type: "text", nullable: true },
      { name: "shipped_at", type: "timestamptz", nullable: true },
      { name: "delivered_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [
      { column: "customer_id", references: "customers.id" },
      { column: "coupon_id", references: "coupons.id" },
    ],
    category: "Core Business",
  },
  order_items: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "order_id", type: "uuid", nullable: false },
      { name: "product_id", type: "uuid", nullable: true },
      { name: "product_name", type: "text", nullable: false },
      { name: "quantity", type: "integer", nullable: false },
      { name: "unit_price", type: "numeric", nullable: false },
      { name: "total_price", type: "numeric", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [
      { column: "order_id", references: "orders.id" },
      { column: "product_id", references: "products.id" },
    ],
    category: "Core Business",
  },
  order_tracking: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "order_id", type: "uuid", nullable: false },
      { name: "status", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "location", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "order_id", references: "orders.id" }],
    category: "Core Business",
  },
  customers: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "full_name", type: "text", nullable: false },
      { name: "email", type: "text", nullable: true },
      { name: "phone", type: "text", nullable: true },
      { name: "address", type: "jsonb", nullable: true },
      { name: "notes", type: "text", nullable: true },
      { name: "tags", type: "text[]", nullable: true },
      { name: "total_orders", type: "integer", nullable: true },
      { name: "total_spent", type: "numeric", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Core Business",
  },
  customer_notes: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "customer_id", type: "uuid", nullable: false },
      { name: "conversation_id", type: "uuid", nullable: true },
      { name: "content", type: "text", nullable: false },
      { name: "created_by", type: "uuid", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [
      { column: "customer_id", references: "customers.id" },
      { column: "conversation_id", references: "live_chat_conversations.id" },
    ],
    category: "Core Business",
  },
  coupons: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "code", type: "text", nullable: false },
      { name: "title", type: "text", nullable: true },
      { name: "description", type: "text", nullable: true },
      { name: "discount_type", type: "text", nullable: false },
      { name: "discount_value", type: "numeric", nullable: false },
      { name: "minimum_order_amount", type: "numeric", nullable: true },
      { name: "maximum_discount", type: "numeric", nullable: true },
      { name: "usage_limit", type: "integer", nullable: true },
      { name: "used_count", type: "integer", nullable: true },
      { name: "user_limit", type: "integer", nullable: true },
      { name: "max_uses", type: "integer", nullable: true },
      { name: "first_order_only", type: "boolean", nullable: true },
      { name: "applicable_products", type: "jsonb", nullable: true },
      { name: "applicable_categories", type: "jsonb", nullable: true },
      { name: "starts_at", type: "timestamptz", nullable: true },
      { name: "expires_at", type: "timestamptz", nullable: true },
      { name: "is_active", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Core Business",
  },
  coupon_usage: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "coupon_id", type: "uuid", nullable: false },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "order_id", type: "uuid", nullable: true },
      { name: "discount_applied", type: "numeric", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [
      { column: "coupon_id", references: "coupons.id" },
      { column: "order_id", references: "orders.id" },
    ],
    category: "Core Business",
  },
  inventory_history: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "product_id", type: "uuid", nullable: false },
      { name: "quantity_change", type: "integer", nullable: false },
      { name: "reason", type: "text", nullable: true },
      { name: "reference_type", type: "text", nullable: true },
      { name: "reference_id", type: "uuid", nullable: true },
      { name: "created_by", type: "uuid", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "product_id", references: "products.id" }],
    category: "Core Business",
  },
  wishlists: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "product_id", type: "uuid", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "product_id", references: "products.id" }],
    category: "Core Business",
  },

  // User Management
  profiles: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "full_name", type: "text", nullable: true },
      { name: "email", type: "text", nullable: true },
      { name: "phone", type: "text", nullable: true },
      { name: "avatar_url", type: "text", nullable: true },
      { name: "bio", type: "text", nullable: true },
      { name: "date_of_birth", type: "date", nullable: true },
      { name: "gender", type: "text", nullable: true },
      { name: "company_name", type: "text", nullable: true },
      { name: "language_preference", type: "text", nullable: true },
      { name: "notify_order_updates", type: "boolean", nullable: true },
      { name: "notify_order_shipped", type: "boolean", nullable: true },
      { name: "notify_order_delivered", type: "boolean", nullable: true },
      { name: "notify_promotions", type: "boolean", nullable: true },
      { name: "notify_new_arrivals", type: "boolean", nullable: true },
      { name: "notify_price_drops", type: "boolean", nullable: true },
      { name: "notify_account_activity", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "User Management",
  },
  user_roles: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "role", type: "app_role", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "User Management",
  },
  user_addresses: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "label", type: "text", nullable: true },
      { name: "full_name", type: "text", nullable: false },
      { name: "phone", type: "text", nullable: false },
      { name: "street_address", type: "text", nullable: false },
      { name: "area", type: "text", nullable: true },
      { name: "city", type: "text", nullable: false },
      { name: "postal_code", type: "text", nullable: true },
      { name: "country", type: "text", nullable: true },
      { name: "is_default", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "User Management",
  },
  user_sessions: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "session_token", type: "text", nullable: false },
      { name: "device_info", type: "jsonb", nullable: true },
      { name: "ip_address", type: "text", nullable: true },
      { name: "user_agent", type: "text", nullable: true },
      { name: "is_current", type: "boolean", nullable: true },
      { name: "last_active_at", type: "timestamptz", nullable: true },
      { name: "expires_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "User Management",
  },
  login_activity: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "email", type: "text", nullable: true },
      { name: "status", type: "text", nullable: false },
      { name: "ip_address", type: "text", nullable: true },
      { name: "user_agent", type: "text", nullable: true },
      { name: "device_info", type: "jsonb", nullable: true },
      { name: "location", type: "text", nullable: true },
      { name: "failure_reason", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "User Management",
  },
  trusted_devices: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "device_id", type: "text", nullable: false },
      { name: "device_name", type: "text", nullable: true },
      { name: "device_type", type: "text", nullable: true },
      { name: "browser", type: "text", nullable: true },
      { name: "os", type: "text", nullable: true },
      { name: "ip_address", type: "text", nullable: true },
      { name: "last_used_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "User Management",
  },
  two_factor_auth: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "secret", type: "text", nullable: false },
      { name: "is_enabled", type: "boolean", nullable: true },
      { name: "backup_codes", type: "text[]", nullable: true },
      { name: "verified_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "User Management",
  },
  password_history: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "password_hash", type: "text", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "User Management",
  },
  recovery_codes: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "code", type: "text", nullable: false },
      { name: "used_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "User Management",
  },
  security_settings: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "require_2fa", type: "boolean", nullable: true },
      { name: "login_notification", type: "boolean", nullable: true },
      { name: "session_timeout_minutes", type: "integer", nullable: true },
      { name: "password_expires_days", type: "integer", nullable: true },
      { name: "last_password_change", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "User Management",
  },

  // Messaging
  contact_messages: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "name", type: "text", nullable: true },
      { name: "first_name", type: "text", nullable: true },
      { name: "last_name", type: "text", nullable: true },
      { name: "email", type: "text", nullable: false },
      { name: "phone", type: "text", nullable: true },
      { name: "subject", type: "text", nullable: true },
      { name: "message", type: "text", nullable: false },
      { name: "status", type: "text", nullable: true },
      { name: "is_read", type: "boolean", nullable: true },
      { name: "replied_at", type: "timestamptz", nullable: true },
      { name: "replied_by", type: "uuid", nullable: true },
      { name: "first_response_at", type: "timestamptz", nullable: true },
      { name: "response_time_seconds", type: "integer", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: true },
    ],
    foreignKeys: [],
    category: "Messaging",
  },
  contact_message_replies: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "message_id", type: "uuid", nullable: false },
      { name: "reply_subject", type: "text", nullable: true },
      { name: "reply_content", type: "text", nullable: false },
      { name: "recipient_email", type: "text", nullable: true },
      { name: "replied_by", type: "uuid", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "message_id", references: "contact_messages.id" }],
    category: "Messaging",
  },
  live_chat_conversations: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "customer_id", type: "uuid", nullable: true },
      { name: "customer_name", type: "text", nullable: true },
      { name: "customer_email", type: "text", nullable: true },
      { name: "customer_phone", type: "text", nullable: true },
      { name: "customer_avatar", type: "text", nullable: true },
      { name: "customer_notes", type: "text", nullable: true },
      { name: "subject", type: "text", nullable: true },
      { name: "status", type: "text", nullable: false },
      { name: "priority", type: "text", nullable: true },
      { name: "category", type: "text", nullable: true },
      { name: "tags", type: "text[]", nullable: true },
      { name: "notes", type: "text", nullable: true },
      { name: "assigned_to", type: "uuid", nullable: true },
      { name: "unread_count", type: "integer", nullable: true },
      { name: "first_response_at", type: "timestamptz", nullable: true },
      { name: "response_time_seconds", type: "integer", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Messaging",
  },
  live_chat_messages: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "conversation_id", type: "uuid", nullable: false },
      { name: "sender_id", type: "uuid", nullable: true },
      { name: "sender_name", type: "text", nullable: true },
      { name: "sender_type", type: "text", nullable: false },
      { name: "sender", type: "text", nullable: true },
      { name: "content", type: "text", nullable: false },
      { name: "attachments", type: "jsonb", nullable: true },
      { name: "is_read", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "conversation_id", references: "live_chat_conversations.id" }],
    category: "Messaging",
  },
  support_tickets: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "ticket_number", type: "text", nullable: false },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "customer_name", type: "text", nullable: false },
      { name: "customer_email", type: "text", nullable: false },
      { name: "customer_phone", type: "text", nullable: true },
      { name: "subject", type: "text", nullable: false },
      { name: "description", type: "text", nullable: false },
      { name: "category", type: "text", nullable: true },
      { name: "priority", type: "text", nullable: true },
      { name: "status", type: "text", nullable: true },
      { name: "order_id", type: "uuid", nullable: true },
      { name: "assigned_to", type: "uuid", nullable: true },
      { name: "resolved_at", type: "timestamptz", nullable: true },
      { name: "first_response_at", type: "timestamptz", nullable: true },
      { name: "response_time_seconds", type: "integer", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "order_id", references: "orders.id" }],
    category: "Messaging",
  },
  ticket_replies: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "ticket_id", type: "uuid", nullable: false },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "sender_name", type: "text", nullable: true },
      { name: "sender_type", type: "text", nullable: true },
      { name: "message", type: "text", nullable: false },
      { name: "attachments", type: "jsonb", nullable: true },
      { name: "is_internal", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "ticket_id", references: "support_tickets.id" }],
    category: "Messaging",
  },
  canned_responses: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "title", type: "text", nullable: false },
      { name: "content", type: "text", nullable: false },
      { name: "category", type: "text", nullable: true },
      { name: "shortcut", type: "text", nullable: true },
      { name: "created_by", type: "uuid", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Messaging",
  },
  quick_replies: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "title", type: "text", nullable: false },
      { name: "content", type: "text", nullable: false },
      { name: "category", type: "text", nullable: true },
      { name: "shortcut", type: "text", nullable: true },
      { name: "sort_order", type: "integer", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Messaging",
  },
  conversation_tags: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "name", type: "text", nullable: false },
      { name: "color", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Messaging",
  },
  notifications: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "type", type: "text", nullable: false },
      { name: "title", type: "text", nullable: false },
      { name: "message", type: "text", nullable: true },
      { name: "data", type: "jsonb", nullable: true },
      { name: "is_read", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Messaging",
  },

  // Settings & Config
  store_settings: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "key", type: "text", nullable: false },
      { name: "value", type: "text", nullable: true },
      { name: "description", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Settings & Config",
  },
  email_templates: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "name", type: "text", nullable: false },
      { name: "slug", type: "text", nullable: true },
      { name: "subject", type: "text", nullable: false },
      { name: "body_html", type: "text", nullable: true },
      { name: "body_text", type: "text", nullable: true },
      { name: "variables", type: "text[]", nullable: true },
      { name: "is_active", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Settings & Config",
  },
  payment_methods: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "name", type: "text", nullable: false },
      { name: "code", type: "text", nullable: false },
      { name: "display_name", type: "text", nullable: true },
      { name: "description", type: "text", nullable: true },
      { name: "instructions", type: "text", nullable: true },
      { name: "logo_url", type: "text", nullable: true },
      { name: "is_active", type: "boolean", nullable: true },
      { name: "is_manual", type: "boolean", nullable: true },
      { name: "supports_verification", type: "boolean", nullable: true },
      { name: "sort_order", type: "integer", nullable: true },
      { name: "config", type: "jsonb", nullable: true },
      { name: "account_details", type: "jsonb", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Settings & Config",
  },
  enabled_payment_methods: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "method_id", type: "text", nullable: false },
      { name: "code", type: "text", nullable: false },
      { name: "name", type: "text", nullable: false },
      { name: "name_bn", type: "text", nullable: true },
      { name: "description", type: "text", nullable: true },
      { name: "instructions", type: "text", nullable: true },
      { name: "logo_url", type: "text", nullable: true },
      { name: "account_details", type: "jsonb", nullable: true },
      { name: "is_active", type: "boolean", nullable: true },
      { name: "supports_verification", type: "boolean", nullable: true },
      { name: "sort_order", type: "integer", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Settings & Config",
  },
  shipping_zones: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "name", type: "text", nullable: false },
      { name: "countries", type: "text[]", nullable: true },
      { name: "regions", type: "text[]", nullable: true },
      { name: "is_active", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Settings & Config",
  },
  shipping_rates: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "zone_id", type: "uuid", nullable: false },
      { name: "name", type: "text", nullable: false },
      { name: "rate_type", type: "text", nullable: true },
      { name: "rate", type: "numeric", nullable: false },
      { name: "min_order_amount", type: "numeric", nullable: true },
      { name: "max_order_amount", type: "numeric", nullable: true },
      { name: "min_weight", type: "numeric", nullable: true },
      { name: "max_weight", type: "numeric", nullable: true },
      { name: "min_days", type: "integer", nullable: true },
      { name: "max_days", type: "integer", nullable: true },
      { name: "is_active", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "zone_id", references: "shipping_zones.id" }],
    category: "Settings & Config",
  },
  shipments: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "order_id", type: "uuid", nullable: false },
      { name: "courier", type: "text", nullable: false },
      { name: "tracking_number", type: "text", nullable: true },
      { name: "consignment_id", type: "text", nullable: true },
      { name: "status", type: "text", nullable: true },
      { name: "courier_response", type: "jsonb", nullable: true },
      { name: "shipped_at", type: "timestamptz", nullable: true },
      { name: "delivered_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [{ column: "order_id", references: "orders.id" }],
    category: "Settings & Config",
  },
  pathao_settings: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "client_id", type: "text", nullable: true },
      { name: "client_secret", type: "text", nullable: true },
      { name: "access_token", type: "text", nullable: true },
      { name: "refresh_token", type: "text", nullable: true },
      { name: "token_expires_at", type: "timestamptz", nullable: true },
      { name: "default_store_id", type: "text", nullable: true },
      { name: "is_enabled", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Settings & Config",
  },
  steadfast_settings: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "api_key", type: "text", nullable: true },
      { name: "secret_key", type: "text", nullable: true },
      { name: "is_enabled", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Settings & Config",
  },
  auto_discount_rules: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "name", type: "text", nullable: false },
      { name: "description", type: "text", nullable: true },
      { name: "rule_type", type: "text", nullable: false },
      { name: "discount_type", type: "text", nullable: false },
      { name: "discount_value", type: "numeric", nullable: false },
      { name: "min_purchase", type: "numeric", nullable: true },
      { name: "max_discount", type: "numeric", nullable: true },
      { name: "conditions", type: "jsonb", nullable: true },
      { name: "priority", type: "integer", nullable: true },
      { name: "starts_at", type: "timestamptz", nullable: true },
      { name: "expires_at", type: "timestamptz", nullable: true },
      { name: "is_active", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Settings & Config",
  },
  auto_reply_settings: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "is_enabled", type: "boolean", nullable: true },
      { name: "message", type: "text", nullable: true },
      { name: "delay_seconds", type: "integer", nullable: true },
      { name: "schedule", type: "jsonb", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Settings & Config",
  },

  // Analytics & Tracking
  analytics_events: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "event_type", type: "text", nullable: false },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "session_id", type: "text", nullable: true },
      { name: "page_url", type: "text", nullable: true },
      { name: "referrer", type: "text", nullable: true },
      { name: "user_agent", type: "text", nullable: true },
      { name: "ip_address", type: "text", nullable: true },
      { name: "event_data", type: "jsonb", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Analytics & Tracking",
  },
  daily_stats: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "date", type: "date", nullable: false },
      { name: "total_revenue", type: "numeric", nullable: true },
      { name: "total_orders", type: "integer", nullable: true },
      { name: "new_customers", type: "integer", nullable: true },
      { name: "page_views", type: "integer", nullable: true },
      { name: "unique_visitors", type: "integer", nullable: true },
      { name: "conversion_rate", type: "numeric", nullable: true },
      { name: "average_order_value", type: "numeric", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Analytics & Tracking",
  },
  abandoned_carts: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "session_id", type: "text", nullable: false },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "customer_name", type: "text", nullable: true },
      { name: "customer_email", type: "text", nullable: true },
      { name: "cart_items", type: "jsonb", nullable: false },
      { name: "cart_total", type: "numeric", nullable: false },
      { name: "last_activity_at", type: "timestamptz", nullable: false },
      { name: "abandoned_at", type: "timestamptz", nullable: true },
      { name: "recovered_at", type: "timestamptz", nullable: true },
      { name: "recovered_order_id", type: "uuid", nullable: true },
      { name: "reminder_sent_count", type: "integer", nullable: true },
      { name: "first_reminder_sent_at", type: "timestamptz", nullable: true },
      { name: "second_reminder_sent_at", type: "timestamptz", nullable: true },
      { name: "final_reminder_sent_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Analytics & Tracking",
  },

  // Security
  blocked_ips: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "ip_address", type: "text", nullable: false },
      { name: "reason", type: "text", nullable: true },
      { name: "blocked_by", type: "text", nullable: true },
      { name: "blocked_until", type: "timestamptz", nullable: true },
      { name: "is_permanent", type: "boolean", nullable: true },
      { name: "created_by", type: "uuid", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Security",
  },
  blocked_login_attempts: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "email", type: "text", nullable: true },
      { name: "ip_address", type: "text", nullable: true },
      { name: "reason", type: "text", nullable: true },
      { name: "blocked_until", type: "timestamptz", nullable: true },
      { name: "is_permanent", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Security",
  },
  failed_login_attempts: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "email", type: "text", nullable: false },
      { name: "ip_address", type: "text", nullable: true },
      { name: "user_agent", type: "text", nullable: true },
      { name: "reason", type: "text", nullable: true },
      { name: "attempt_count", type: "integer", nullable: true },
      { name: "last_attempt_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Security",
  },
  account_lockouts: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "email", type: "text", nullable: false },
      { name: "reason", type: "text", nullable: true },
      { name: "failed_attempts", type: "integer", nullable: true },
      { name: "unlock_at", type: "timestamptz", nullable: false },
      { name: "is_unlocked", type: "boolean", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: true },
    ],
    foreignKeys: [],
    category: "Security",
  },
  ip_rate_limits: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "ip_address", type: "text", nullable: false },
      { name: "endpoint", type: "text", nullable: true },
      { name: "request_count", type: "integer", nullable: true },
      { name: "window_start", type: "timestamptz", nullable: true },
      { name: "is_blocked", type: "boolean", nullable: true },
      { name: "blocked_until", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Security",
  },
  ip_rate_limit_settings: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "setting_key", type: "text", nullable: false },
      { name: "endpoint", type: "text", nullable: true },
      { name: "max_requests", type: "integer", nullable: true },
      { name: "window_seconds", type: "integer", nullable: true },
      { name: "time_window_seconds", type: "integer", nullable: true },
      { name: "block_duration_seconds", type: "integer", nullable: true },
      { name: "is_enabled", type: "boolean", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Security",
  },
  geo_blocking_rules: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "country_code", type: "text", nullable: false },
      { name: "country_name", type: "text", nullable: true },
      { name: "is_blocked", type: "boolean", nullable: true },
      { name: "reason", type: "text", nullable: true },
      { name: "created_by", type: "uuid", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: true },
    ],
    foreignKeys: [],
    category: "Security",
  },

  // Other
  admin_presence: {
    columns: [
      { name: "id", type: "uuid", nullable: false, primary: true },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "is_online", type: "boolean", nullable: true },
      { name: "last_seen_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false },
    ],
    foreignKeys: [],
    category: "Other",
  },
};

interface TableSchema {
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primary?: boolean;
  }>;
  foreignKeys: Array<{
    column: string;
    references: string;
  }>;
  category: string;
}

export function generateSchemaPDF(): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 20;
  let pageNumber = 1;

  const tables = Object.entries(DATABASE_SCHEMA) as [string, TableSchema][];
  const totalTables = tables.length;
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Helper: Draw page header
  const drawHeader = () => {
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.primary);
    doc.text("EKTA CLOTHING", margin, 15);

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.text("Database Schema", margin, 23);

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Generated: ${currentDate}`, pageWidth - margin, 15, { align: "right" });
    doc.text(`Total Tables: ${totalTables}`, pageWidth - margin, 22, { align: "right" });
  };

  // Helper: Draw page footer
  const drawFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text("© EKTA CLOTHING - Database Documentation", margin, pageHeight - 10);
  };

  // Helper: Check and add new page if needed
  const checkNewPage = (neededHeight: number): void => {
    if (y + neededHeight > pageHeight - 20) {
      drawFooter();
      doc.addPage();
      pageNumber++;
      drawHeader();
      y = 45;
    }
  };

  // Helper: Draw separator line
  const drawSeparator = () => {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // ========== COVER PAGE ==========
  drawHeader();

  y = 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.primary);
  doc.text("Database Schema", pageWidth / 2, y, { align: "center" });

  y += 15;
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.textDark);
  doc.text("Complete Documentation", pageWidth / 2, y, { align: "center" });

  y += 30;
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  const categories = [...new Set(tables.map(([_, t]) => t.category))];
  
  doc.text("Categories:", margin + 20, y);
  y += 8;
  categories.forEach((cat) => {
    const count = tables.filter(([_, t]) => t.category === cat).length;
    doc.text(`• ${cat} (${count} tables)`, margin + 25, y);
    y += 6;
  });

  y += 15;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin + 20, y, pageWidth - margin * 2 - 40, 30, 3, 3, "F");
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("This document contains the complete database schema including", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.text("all tables, columns, data types, and foreign key relationships.", pageWidth / 2, y, { align: "center" });

  drawFooter();

  // ========== TABLE OF CONTENTS ==========
  doc.addPage();
  pageNumber++;
  drawHeader();
  y = 45;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text("Table of Contents", margin, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let currentCategory = "";
  tables.forEach(([tableName, tableData], index) => {
    checkNewPage(12);
    
    if (tableData.category !== currentCategory) {
      currentCategory = tableData.category;
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primary);
      doc.text(currentCategory, margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
    }

    doc.setTextColor(80, 80, 80);
    const colCount = tableData.columns.length;
    doc.text(`${index + 1}. ${tableName}`, margin + 10, y);
    doc.text(`${colCount} columns`, pageWidth - margin - 30, y);
    y += 5;
  });

  drawFooter();

  // ========== TABLE DETAILS ==========
  currentCategory = "";
  tables.forEach(([tableName, tableData]) => {
    // Calculate height needed for this table
    const headerHeight = 25;
    const rowHeight = 5;
    const tableHeight = headerHeight + (tableData.columns.length * rowHeight) + 20;

    checkNewPage(Math.min(tableHeight, 80));

    // Category header if changed
    if (tableData.category !== currentCategory) {
      currentCategory = tableData.category;
      checkNewPage(30);
      
      doc.setFillColor(...COLORS.primary);
      doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.dark);
      doc.text(currentCategory.toUpperCase(), margin + 5, y + 5.5);
      y += 15;
    }

    // Table name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.text(`TABLE: ${tableName}`, margin, y);
    y += 8;

    // Column headers
    doc.setFillColor(...COLORS.tableHeader);
    doc.rect(margin, y - 4, pageWidth - margin * 2, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);
    
    const col1 = margin + 3;
    const col2 = margin + 65;
    const col3 = margin + 115;
    const col4 = margin + 145;
    
    doc.text("Column Name", col1, y);
    doc.text("Data Type", col2, y);
    doc.text("Nullable", col3, y);
    doc.text("Key", col4, y);
    y += 5;

    // Column rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    tableData.columns.forEach((column, idx) => {
      checkNewPage(6);
      
      // Alternate row colors
      if (idx % 2 === 0) {
        doc.setFillColor(...COLORS.tableRow);
      } else {
        doc.setFillColor(...COLORS.tableRowAlt);
      }
      doc.rect(margin, y - 3.5, pageWidth - margin * 2, 5, "F");

      doc.setTextColor(200, 200, 200);
      doc.text(column.name, col1, y);
      
      doc.setTextColor(...COLORS.muted);
      doc.text(column.type, col2, y);
      
      if (column.nullable) {
        doc.setTextColor(...COLORS.muted);
      } else {
        doc.setTextColor(120, 200, 120);
      }
      doc.text(column.nullable ? "Yes" : "No", col3, y);
      
      if (column.primary) {
        doc.setTextColor(...COLORS.primary);
        doc.text("PK", col4, y);
      }
      
      y += 5;
    });

    // Foreign keys
    if (tableData.foreignKeys.length > 0) {
      y += 3;
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      tableData.foreignKeys.forEach((fk) => {
        checkNewPage(6);
        doc.text(`FK: ${fk.column} → ${fk.references}`, margin + 3, y);
        y += 4;
      });
    }

    y += 10;
    drawSeparator();
  });

  // ========== RELATIONSHIPS SUMMARY ==========
  doc.addPage();
  pageNumber++;
  drawHeader();
  y = 45;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text("Foreign Key Relationships", margin, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  tables.forEach(([tableName, tableData]) => {
    if (tableData.foreignKeys.length > 0) {
      checkNewPage(8 + tableData.foreignKeys.length * 5);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primary);
      doc.text(tableName, margin, y);
      y += 5;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      tableData.foreignKeys.forEach((fk) => {
        doc.text(`  └─ ${fk.column} → ${fk.references}`, margin + 5, y);
        y += 5;
      });
      y += 3;
    }
  });

  drawFooter();

  // ========== SAVE PDF ==========
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`Database-Schema-${dateStr}.pdf`);
}
