import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, X, ShoppingBag, ArrowLeft, Truck, Tag, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StoreLayout } from "@/layouts/StoreLayout";
import { useCart } from "@/contexts/CartContext";
import { useCoupon } from "@/hooks/useCoupon";
import { useAutoDiscountRules } from "@/hooks/useAutoDiscountRules";

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const { appliedCoupon, loading: couponLoading, validateCoupon, removeCoupon } = useCoupon();
  const { calculateDiscount: calculateAutoDiscount, getActiveRules } = useAutoDiscountRules();
  const [couponCode, setCouponCode] = useState("");
  const navigate = useNavigate();

  const formatPrice = (price: number) => `৳${price.toLocaleString('en-BD')}`;
  
  // Calculate auto discount from rules
  const autoDiscount = calculateAutoDiscount(subtotal);
  const activeAutoRules = getActiveRules().filter(rule => 
    rule.rule_type === "cart_total" && rule.min_purchase && subtotal >= rule.min_purchase
  );
  
  // Use the higher discount between coupon and auto discount
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const discount = Math.max(couponDiscount, autoDiscount);
  const isAutoDiscountApplied = autoDiscount > couponDiscount && autoDiscount > 0;
  
  const shippingCost = subtotal >= 2000 ? 0 : 100;
  const total = subtotal - discount + shippingCost;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    await validateCoupon(couponCode, subtotal);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode("");
  };

  const handleProceedToCheckout = () => {
    // Pass coupon data or auto discount via state
    navigate("/checkout", {
      state: isAutoDiscountApplied ? {
        autoDiscount: autoDiscount,
        autoDiscountRuleName: activeAutoRules[0]?.name || "Auto Discount",
      } : appliedCoupon ? {
        couponId: appliedCoupon.coupon.id,
        couponCode: appliedCoupon.coupon.code,
        discountAmount: appliedCoupon.discountAmount,
      } : undefined,
    });
  };

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-store-muted flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
          </p>
          <Button size="lg" className="bg-store-primary hover:bg-store-primary/90" asChild>
            <Link to="/products">Start Shopping</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      {/* Page Header */}
      <section className="bg-gradient-to-r from-store-primary to-store-secondary py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-store-primary-foreground">
            Shopping Cart
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
              </p>
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear Cart
              </Button>
            </div>

            {items.map((item) => (
              <Card key={`${item.id}-${item.size}-${item.color}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link to={`/product/${item.id}`} className="flex-shrink-0">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <div>
                          <Link to={`/product/${item.id}`}>
                            <h3 className="font-medium text-foreground hover:text-store-primary transition-colors">
                              {item.name}
                            </h3>
                          </Link>
                          {(item.size || item.color) && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && ' • '}
                              {item.color && `Color: ${item.color}`}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => removeItem(item.id, item.size, item.color)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1 border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          {item.comparePrice && (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatPrice(item.comparePrice * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" asChild>
              <Link to="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coupon Code */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-store-accent/10 rounded-lg border border-store-accent">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-store-accent" />
                      <div>
                        <p className="font-medium text-sm">{appliedCoupon.coupon.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {appliedCoupon.coupon.discount_type === 'percentage'
                            ? `${appliedCoupon.coupon.discount_value}% off`
                            : `৳${appliedCoupon.coupon.discount_value} off`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-store-accent">
                      <span className="flex items-center gap-1">
                        {isAutoDiscountApplied && <Sparkles className="h-3 w-3" />}
                        {isAutoDiscountApplied ? "Auto Discount" : "Discount"}
                      </span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  {isAutoDiscountApplied && activeAutoRules.length > 0 && (
                    <p className="text-xs text-store-accent">
                      ✨ {activeAutoRules[0].name} applied!
                    </p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex items-center gap-2 text-xs text-store-primary">
                      <Truck className="h-3 w-3" />
                      <span>Add {formatPrice(2000 - subtotal)} more for free shipping</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-store-primary hover:bg-store-primary/90"
                  onClick={handleProceedToCheckout}
                >
                  Proceed to Checkout
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Taxes calculated at checkout
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
