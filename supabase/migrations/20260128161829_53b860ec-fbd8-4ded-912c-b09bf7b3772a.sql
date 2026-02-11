-- Create categories table with hierarchical support
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view active categories, admins can manage all
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (status = 'active' OR has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial categories based on existing product categories
INSERT INTO public.categories (name, slug, description, status) VALUES
  ('T-Shirts', 't-shirts', 'Casual and formal t-shirts', 'active'),
  ('Pants', 'pants', 'Jeans, trousers, and casual pants', 'active'),
  ('Jeans', 'jeans', 'Denim jeans in various styles', 'active'),
  ('Polo', 'polo', 'Classic polo shirts', 'active'),
  ('Accessories', 'accessories', 'Bags, belts, and accessories', 'active');