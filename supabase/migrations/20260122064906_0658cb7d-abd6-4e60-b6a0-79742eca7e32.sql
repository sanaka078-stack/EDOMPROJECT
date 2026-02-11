-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_price DECIMAL(10,2),
  category TEXT,
  sku TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_method TEXT,
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products policies (admins can manage, all authenticated can view)
CREATE POLICY "Authenticated users can view products"
ON public.products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

-- Customers policies
CREATE POLICY "Admins can view all customers"
ON public.customers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage customers"
ON public.customers FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

-- Orders policies
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage orders"
ON public.orders FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

-- Order items policies
CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage order items"
ON public.order_items FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

-- Enable realtime for dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- Insert sample data
INSERT INTO public.products (name, description, price, compare_price, category, sku, stock, status) VALUES
('Classic Cotton T-Shirt', 'Comfortable 100% cotton t-shirt', 599.00, 799.00, 'T-Shirts', 'TSH-001', 150, 'active'),
('Slim Fit Jeans', 'Modern slim fit denim jeans', 1499.00, 1999.00, 'Jeans', 'JNS-001', 80, 'active'),
('Summer Floral Dress', 'Light and breezy floral print dress', 1299.00, 1599.00, 'Dresses', 'DRS-001', 45, 'active'),
('Leather Belt', 'Genuine leather belt with classic buckle', 499.00, 699.00, 'Accessories', 'ACC-001', 200, 'active'),
('Denim Jacket', 'Classic blue denim jacket', 2499.00, 2999.00, 'Jackets', 'JKT-001', 35, 'active'),
('Cotton Polo Shirt', 'Premium cotton polo shirt', 899.00, 1199.00, 'Polo', 'POL-001', 120, 'active'),
('Chino Pants', 'Comfortable cotton chino pants', 1199.00, 1499.00, 'Pants', 'PNT-001', 95, 'active'),
('Sports Sneakers', 'Lightweight running sneakers', 1999.00, 2499.00, 'Footwear', 'SHO-001', 60, 'active');

INSERT INTO public.customers (name, email, phone, city, total_orders, total_spent, loyalty_tier) VALUES
('Rahim Ahmed', 'rahim@example.com', '01711234567', 'Dhaka', 12, 25600.00, 'gold'),
('Fatima Khan', 'fatima@example.com', '01812345678', 'Chittagong', 8, 18500.00, 'silver'),
('Karim Hossain', 'karim@example.com', '01912345678', 'Sylhet', 5, 9800.00, 'bronze'),
('Ayesha Begum', 'ayesha@example.com', '01612345678', 'Rajshahi', 15, 42000.00, 'platinum'),
('Nasir Uddin', 'nasir@example.com', '01512345678', 'Khulna', 3, 4500.00, 'bronze');

INSERT INTO public.orders (customer_id, status, subtotal, shipping_cost, discount, total, payment_status, payment_method) 
SELECT id, 'delivered', 2500.00, 60.00, 100.00, 2460.00, 'paid', 'bKash' FROM public.customers WHERE email = 'rahim@example.com';

INSERT INTO public.orders (customer_id, status, subtotal, shipping_cost, discount, total, payment_status, payment_method) 
SELECT id, 'processing', 1800.00, 60.00, 0.00, 1860.00, 'paid', 'Card' FROM public.customers WHERE email = 'fatima@example.com';

INSERT INTO public.orders (customer_id, status, subtotal, shipping_cost, discount, total, payment_status, payment_method) 
SELECT id, 'pending', 3200.00, 100.00, 200.00, 3100.00, 'pending', 'COD' FROM public.customers WHERE email = 'karim@example.com';

INSERT INTO public.orders (customer_id, status, subtotal, shipping_cost, discount, total, payment_status, payment_method) 
SELECT id, 'shipped', 4500.00, 0.00, 500.00, 4000.00, 'paid', 'Nagad' FROM public.customers WHERE email = 'ayesha@example.com';