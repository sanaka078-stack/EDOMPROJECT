import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Coupon {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_amount: number | null;
  maximum_discount: number | null;
  max_uses: number | null;
  used_count: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean | null;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
}

export function useCoupon() {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCoupon = async (code: string, subtotal: number): Promise<AppliedCoupon | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setError('Invalid coupon code');
        toast.error('Invalid coupon code');
        return null;
      }

      const coupon = data;

      // Check if coupon has started
      if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
        setError('This coupon is not yet active');
        toast.error('This coupon is not yet active');
        return null;
      }

      // Check if coupon has expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setError('This coupon has expired');
        toast.error('This coupon has expired');
        return null;
      }

      // Check usage limit
      if (coupon.max_uses && (coupon.used_count || 0) >= coupon.max_uses) {
        setError('This coupon has reached its usage limit');
        toast.error('This coupon has reached its usage limit');
        return null;
      }

      // Check minimum order amount
      if (coupon.minimum_order_amount && subtotal < coupon.minimum_order_amount) {
        setError(`Minimum order of ৳${Number(coupon.minimum_order_amount).toLocaleString()} required`);
        toast.error(`Minimum order of ৳${Number(coupon.minimum_order_amount).toLocaleString()} required`);
        return null;
      }

      // Calculate discount
      let discountAmount: number;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (subtotal * coupon.discount_value) / 100;
        // Apply maximum discount cap if set
        if (coupon.maximum_discount && discountAmount > coupon.maximum_discount) {
          discountAmount = coupon.maximum_discount;
        }
      } else {
        discountAmount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);

      const applied: AppliedCoupon = {
        coupon: coupon as Coupon,
        discountAmount,
      };

      setAppliedCoupon(applied);
      toast.success(`Coupon applied! You save ৳${discountAmount.toLocaleString()}`);
      return applied;
    } catch (err) {
      console.error('Error validating coupon:', err);
      setError('Failed to validate coupon');
      toast.error('Failed to validate coupon');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setError(null);
    toast.info('Coupon removed');
  };

  const incrementCouponUsage = async (couponId: string) => {
    try {
      const { data: current } = await supabase
        .from('coupons')
        .select('used_count')
        .eq('id', couponId)
        .single();

      if (current) {
        await supabase
          .from('coupons')
          .update({ used_count: (current.used_count || 0) + 1 })
          .eq('id', couponId);
      }
    } catch (error) {
      console.error('Error incrementing coupon usage:', error);
    }
  };

  return {
    appliedCoupon,
    loading,
    error,
    validateCoupon,
    removeCoupon,
    incrementCouponUsage,
  };
}
