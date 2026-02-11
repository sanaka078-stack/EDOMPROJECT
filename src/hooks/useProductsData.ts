import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  quantity: number;
  category: string | null;
  category_id: string | null;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  description: string | null;
  barcode: string | null;
  weight: number | null;
  dimensions: any | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function useProductsData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productsList = ((data as any[]) || []).map((row: any): Product => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        sku: row.sku,
        price: row.price,
        compare_at_price: row.compare_at_price,
        cost_price: row.cost_price,
        quantity: row.quantity,
        category: row.category,
        category_id: row.category_id,
        images: row.images || [],
        is_active: row.is_active ?? true,
        is_featured: row.is_featured ?? false,
        description: row.description,
        barcode: row.barcode,
        weight: row.weight,
        dimensions: row.dimensions,
        tags: row.tags || [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      setProducts(productsList);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(productsList.map(p => p.category).filter(Boolean) as string[])];
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (product: Partial<Product>) => {
    try {
      const slug = product.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
      
      const { data, error } = await supabase
        .from('products' as any)
        .insert([{
          name: product.name || 'Unnamed Product',
          slug: slug + '-' + Date.now(),
          sku: product.sku,
          price: product.price || 0,
          compare_at_price: product.compare_at_price,
          cost_price: product.cost_price,
          quantity: product.quantity || 0,
          category: product.category,
          category_id: product.category_id,
          images: product.images || [],
          is_active: product.is_active ?? true,
          is_featured: product.is_featured ?? false,
          description: product.description,
          barcode: product.barcode,
          weight: product.weight,
          dimensions: product.dimensions,
          tags: product.tags || [],
        }])
        .select()
        .single();

      if (error) throw error;

      const newProduct = data as unknown as Product;
      setProducts(prev => [newProduct, ...prev]);
      toast.success('Product created successfully!');
      return newProduct;
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products' as any)
        .update({
          name: updates.name,
          sku: updates.sku,
          price: updates.price,
          compare_at_price: updates.compare_at_price,
          cost_price: updates.cost_price,
          quantity: updates.quantity,
          category: updates.category,
          category_id: updates.category_id,
          images: updates.images,
          is_active: updates.is_active,
          is_featured: updates.is_featured,
          description: updates.description,
          barcode: updates.barcode,
          weight: updates.weight,
          dimensions: updates.dimensions,
          tags: updates.tags,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct = data as unknown as Product;
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      toast.success('Product updated successfully!');
      return updatedProduct;
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
      throw error;
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('products' as any)
        .delete()
        .in('id', ids);

      if (error) throw error;

      setProducts(prev => prev.filter(p => !ids.includes(p.id)));
      toast.success(`${ids.length} products deleted`);
    } catch (error: any) {
      console.error('Error deleting products:', error);
      toast.error(error.message || 'Failed to delete products');
      throw error;
    }
  };

  const bulkImport = async (productsToImport: Partial<Product>[]) => {
    try {
      const { data, error } = await supabase
        .from('products' as any)
        .insert(productsToImport.map((p, idx) => ({
          name: p.name || 'Unnamed Product',
          slug: (p.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'product') + '-' + Date.now() + '-' + idx,
          sku: p.sku,
          price: p.price || 0,
          compare_at_price: p.compare_at_price,
          quantity: p.quantity || 0,
          category: p.category,
          images: p.images || [],
          is_active: p.is_active ?? true,
          description: p.description,
        })))
        .select();

      if (error) throw error;

      const importedProducts = ((data as any[]) || []) as Product[];
      setProducts(prev => [...importedProducts, ...prev]);
      toast.success(`${importedProducts.length} products imported successfully!`);
      return importedProducts;
    } catch (error: any) {
      console.error('Error importing products:', error);
      toast.error(error.message || 'Failed to import products');
      throw error;
    }
  };

  useEffect(() => {
    fetchProducts();

    // Set up realtime subscription
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    products,
    loading,
    categories,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkDelete,
    bulkImport,
    refetch: fetchProducts,
  };
}
