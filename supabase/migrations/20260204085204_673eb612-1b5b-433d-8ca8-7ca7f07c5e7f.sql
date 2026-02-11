-- EKTA CLOTHING - Complete Database Schema
-- Total Tables: 56

-- Create custom type for user roles
CREATE TYPE app_role AS ENUM ('admin', 'manager', 'support', 'user');

-- =====================
-- CORE BUSINESS (14 tables)
-- =====================

-- TABLE: categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  compare_at_price NUMERIC,
  cost_price NUMERIC,
  sku TEXT,
  barcode TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  category_id UUID REFERENCES public.categories(id),
  images TEXT[],
  tags TEXT[],
  weight NUMERIC,
  dimensions JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: product_variants
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC,
  compare_at_price NUMERIC,
  quantity INTEGER DEFAULT 0,
  options JSONB,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: product_inventory
CREATE TABLE public.product_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  sku TEXT,
  low_stock_threshold INTEGER DEFAULT 5,
  warehouse_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: product_reviews
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID,
  customer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address JSONB,
  notes TEXT,
  tags TEXT[],
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: coupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  minimum_order_amount NUMERIC,
  maximum_discount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  user_limit INTEGER,
  max_uses INTEGER,
  first_order_only BOOLEAN DEFAULT false,
  applicable_products JSONB,
  applicable_categories JSONB,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID,
  customer_id UUID REFERENCES public.customers(id),
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  tracking_number TEXT,
  coupon_id UUID REFERENCES public.coupons(id),
  coupon_code TEXT,
  is_gift BOOLEAN DEFAULT false,
  gift_message TEXT,
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID,
  payment_verification_notes TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: order_items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: order_tracking
CREATE TABLE public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: customer_notes (needs live_chat_conversations, created later with FK)
CREATE TABLE public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  conversation_id UUID,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: coupon_usage
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID,
  order_id UUID REFERENCES public.orders(id),
  discount_applied NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: inventory_history
CREATE TABLE public.inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: wishlists
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- =====================
-- USER MANAGEMENT (10 tables)
-- =====================

-- TABLE: profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  gender TEXT,
  company_name TEXT,
  language_preference TEXT DEFAULT 'bn',
  notify_order_updates BOOLEAN DEFAULT true,
  notify_order_shipped BOOLEAN DEFAULT true,
  notify_order_delivered BOOLEAN DEFAULT true,
  notify_promotions BOOLEAN DEFAULT true,
  notify_new_arrivals BOOLEAN DEFAULT true,
  notify_price_drops BOOLEAN DEFAULT true,
  notify_account_activity BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- TABLE: user_addresses
CREATE TABLE public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  area TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'Bangladesh',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: user_sessions
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  ip_address TEXT,
  user_agent TEXT,
  is_current BOOLEAN DEFAULT false,
  last_active_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: login_activity
CREATE TABLE public.login_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  status TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  location TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: trusted_devices
CREATE TABLE public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: two_factor_auth
CREATE TABLE public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[],
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: password_history
CREATE TABLE public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: recovery_codes
CREATE TABLE public.recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: security_settings
CREATE TABLE public.security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  require_2fa BOOLEAN DEFAULT false,
  login_notification BOOLEAN DEFAULT true,
  session_timeout_minutes INTEGER DEFAULT 60,
  password_expires_days INTEGER,
  last_password_change TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- MESSAGING (10 tables)
-- =====================

-- TABLE: contact_messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  is_read BOOLEAN DEFAULT false,
  replied_at TIMESTAMPTZ,
  replied_by UUID,
  first_response_at TIMESTAMPTZ,
  response_time_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- TABLE: contact_message_replies
CREATE TABLE public.contact_message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  reply_subject TEXT,
  reply_content TEXT NOT NULL,
  recipient_email TEXT,
  replied_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: live_chat_conversations
CREATE TABLE public.live_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  customer_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_avatar TEXT,
  customer_notes TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  category TEXT,
  tags TEXT[],
  notes TEXT,
  assigned_to UUID,
  unread_count INTEGER DEFAULT 0,
  first_response_at TIMESTAMPTZ,
  response_time_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK to customer_notes for conversation_id
ALTER TABLE public.customer_notes 
ADD CONSTRAINT customer_notes_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.live_chat_conversations(id);

-- TABLE: live_chat_messages
CREATE TABLE public.live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.live_chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_name TEXT,
  sender_type TEXT NOT NULL,
  sender TEXT,
  content TEXT NOT NULL,
  attachments JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: support_tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  order_id UUID REFERENCES public.orders(id),
  assigned_to UUID,
  resolved_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  response_time_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: ticket_replies
CREATE TABLE public.ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID,
  sender_name TEXT,
  sender_type TEXT,
  message TEXT NOT NULL,
  attachments JSONB,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: canned_responses
CREATE TABLE public.canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  shortcut TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: quick_replies
CREATE TABLE public.quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  shortcut TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: conversation_tags
CREATE TABLE public.conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- SETTINGS & CONFIG (11 tables)
-- =====================

-- TABLE: store_settings
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: email_templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: payment_methods
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  instructions TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_manual BOOLEAN DEFAULT true,
  supports_verification BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  config JSONB,
  account_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: enabled_payment_methods
CREATE TABLE public.enabled_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_bn TEXT,
  description TEXT,
  instructions TEXT,
  logo_url TEXT,
  account_details JSONB,
  is_active BOOLEAN DEFAULT true,
  supports_verification BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: shipping_zones
CREATE TABLE public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  countries TEXT[],
  regions TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: shipping_rates
CREATE TABLE public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate_type TEXT,
  rate NUMERIC NOT NULL,
  min_order_amount NUMERIC,
  max_order_amount NUMERIC,
  min_weight NUMERIC,
  max_weight NUMERIC,
  min_days INTEGER,
  max_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: shipments
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  courier TEXT NOT NULL,
  tracking_number TEXT,
  consignment_id TEXT,
  status TEXT DEFAULT 'pending',
  courier_response JSONB,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: pathao_settings
CREATE TABLE public.pathao_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  default_store_id TEXT,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: steadfast_settings
CREATE TABLE public.steadfast_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT,
  secret_key TEXT,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: auto_discount_rules
CREATE TABLE public.auto_discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  min_purchase NUMERIC,
  max_discount NUMERIC,
  conditions JSONB,
  priority INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: auto_reply_settings
CREATE TABLE public.auto_reply_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT false,
  message TEXT,
  delay_seconds INTEGER DEFAULT 0,
  schedule JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- ANALYTICS & TRACKING (3 tables)
-- =====================

-- TABLE: analytics_events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: daily_stats
CREATE TABLE public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_revenue NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  average_order_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: abandoned_carts
CREATE TABLE public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  cart_items JSONB NOT NULL,
  cart_total NUMERIC NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  abandoned_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  recovered_order_id UUID,
  reminder_sent_count INTEGER DEFAULT 0,
  first_reminder_sent_at TIMESTAMPTZ,
  second_reminder_sent_at TIMESTAMPTZ,
  final_reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- SECURITY (7 tables)
-- =====================

-- TABLE: blocked_ips
CREATE TABLE public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  reason TEXT,
  blocked_by TEXT,
  blocked_until TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: blocked_login_attempts
CREATE TABLE public.blocked_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  ip_address TEXT,
  reason TEXT,
  blocked_until TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: failed_login_attempts
CREATE TABLE public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: account_lockouts
CREATE TABLE public.account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT,
  failed_attempts INTEGER DEFAULT 0,
  unlock_at TIMESTAMPTZ NOT NULL,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- TABLE: ip_rate_limits
CREATE TABLE public.ip_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: ip_rate_limit_settings
CREATE TABLE public.ip_rate_limit_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  endpoint TEXT,
  max_requests INTEGER DEFAULT 100,
  window_seconds INTEGER DEFAULT 60,
  time_window_seconds INTEGER DEFAULT 60,
  block_duration_seconds INTEGER DEFAULT 300,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: geo_blocking_rules
CREATE TABLE public.geo_blocking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT,
  is_blocked BOOLEAN DEFAULT false,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- =====================
-- OTHER (1 table)
-- =====================

-- TABLE: admin_presence
CREATE TABLE public.admin_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- INDEXES for performance
-- =====================

CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_live_chat_conversations_status ON public.live_chat_conversations(status);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);

-- =====================
-- Enable Realtime for important tables
-- =====================

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_presence;

-- =====================
-- RLS Policies
-- =====================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enabled_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathao_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steadfast_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reply_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_rate_limit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_blocking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_presence ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has admin/manager role
CREATE OR REPLACE FUNCTION public.has_admin_role(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
    AND role IN ('admin', 'manager')
  )
$$;

-- PUBLIC READ policies for store-facing tables
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Product variants are viewable by everyone" ON public.product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Approved reviews are viewable by everyone" ON public.product_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Active coupons are viewable by everyone" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Active payment methods are viewable by everyone" ON public.enabled_payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Active shipping zones are viewable by everyone" ON public.shipping_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Active shipping rates are viewable by everyone" ON public.shipping_rates FOR SELECT USING (is_active = true);
CREATE POLICY "Conversation tags are viewable by everyone" ON public.conversation_tags FOR SELECT USING (true);
CREATE POLICY "Quick replies are viewable by everyone" ON public.quick_replies FOR SELECT USING (true);

-- USER-SPECIFIC policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own addresses" ON public.user_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON public.user_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON public.user_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON public.user_addresses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wishlist" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their own wishlist" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from their own wishlist" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own security settings" ON public.security_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own security settings" ON public.security_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own security settings" ON public.security_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own 2FA settings" ON public.two_factor_auth FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own 2FA" ON public.two_factor_auth FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own recovery codes" ON public.recovery_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own recovery codes" ON public.recovery_codes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own trusted devices" ON public.trusted_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own trusted devices" ON public.trusted_devices FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.user_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own login activity" ON public.login_activity FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own support tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create support tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their ticket replies" ON public.ticket_replies FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);

-- ADMIN policies for all tables
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage product variants" ON public.product_variants FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage product inventory" ON public.product_inventory FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage product reviews" ON public.product_reviews FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage order tracking" ON public.order_tracking FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage customer notes" ON public.customer_notes FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage coupon usage" ON public.coupon_usage FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage inventory history" ON public.inventory_history FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage contact message replies" ON public.contact_message_replies FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage live chat" ON public.live_chat_conversations FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage live chat messages" ON public.live_chat_messages FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage support tickets" ON public.support_tickets FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage ticket replies" ON public.ticket_replies FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage canned responses" ON public.canned_responses FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage quick replies" ON public.quick_replies FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage conversation tags" ON public.conversation_tags FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage store settings" ON public.store_settings FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage enabled payment methods" ON public.enabled_payment_methods FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage shipping rates" ON public.shipping_rates FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage shipments" ON public.shipments FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage pathao settings" ON public.pathao_settings FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage steadfast settings" ON public.steadfast_settings FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage auto discount rules" ON public.auto_discount_rules FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage auto reply settings" ON public.auto_reply_settings FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage analytics events" ON public.analytics_events FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage daily stats" ON public.daily_stats FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage abandoned carts" ON public.abandoned_carts FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage blocked ips" ON public.blocked_ips FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage blocked login attempts" ON public.blocked_login_attempts FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage failed login attempts" ON public.failed_login_attempts FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage account lockouts" ON public.account_lockouts FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage ip rate limits" ON public.ip_rate_limits FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage ip rate limit settings" ON public.ip_rate_limit_settings FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage geo blocking rules" ON public.geo_blocking_rules FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage admin presence" ON public.admin_presence FOR ALL USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can view user addresses" ON public.user_addresses FOR SELECT USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can view wishlists" ON public.wishlists FOR SELECT USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can view user sessions" ON public.user_sessions FOR SELECT USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can view login activity" ON public.login_activity FOR SELECT USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can view trusted devices" ON public.trusted_devices FOR SELECT USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can view password history" ON public.password_history FOR SELECT USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can view recovery codes" ON public.recovery_codes FOR SELECT USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can view security settings" ON public.security_settings FOR SELECT USING (public.has_admin_role(auth.uid()));
CREATE POLICY "Admins can view 2FA settings" ON public.two_factor_auth FOR SELECT USING (public.has_admin_role(auth.uid()));

-- Public INSERT policies for store functionality
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit product reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can track analytics events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create abandoned carts" ON public.abandoned_carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can start live chat" ON public.live_chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can send live chat messages" ON public.live_chat_messages FOR INSERT WITH CHECK (true);

-- Store settings read policy for edge functions  
CREATE POLICY "Store settings readable for edge functions" ON public.store_settings FOR SELECT USING (true);

-- Order items viewable with order access
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);

-- Order tracking viewable with order access
CREATE POLICY "Users can view their order tracking" ON public.order_tracking FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);