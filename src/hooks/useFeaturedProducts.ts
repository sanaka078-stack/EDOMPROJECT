import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  category: string | null;
  created_at: string;
}

export function useFeaturedProducts(limit: number = 4) {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [limit]);

  const fetchFeaturedProducts = async () => {
    setLoading(true);

    // First try to get featured products
    let { data, error } = await supabase
      .from("products")
      .select("id, name, price, compare_at_price, images, category, created_at")
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(limit);

    // If no featured products, fall back to newest products
    if (!error && (!data || data.length === 0)) {
      const fallback = await supabase
        .from("products")
        .select("id, name, price, compare_at_price, images, category, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      data = fallback.data;
      error = fallback.error;
    }

    if (!error && data) {
      setProducts(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
          images: p.images || [],
          category: p.category,
          created_at: p.created_at,
        }))
      );
    }

    setLoading(false);
  };

  // Check if product is new (created within last 30 days)
  const isNewProduct = (createdAt: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) > thirtyDaysAgo;
  };

  return { products, loading, isNewProduct, refetch: fetchFeaturedProducts };
}
