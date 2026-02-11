import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { CreditCard, Truck, Mail, ChevronLeft, ShieldCheck, Tag, X, Smartphone, MapPin, Loader2, Building, Save, Clock, Sparkles, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoreLayout } from "@/layouts/StoreLayout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCoupon } from "@/hooks/useCoupon";
import { useShippingData } from "@/hooks/useShippingData";
import { useEnabledPaymentMethods } from "@/hooks/useEnabledPaymentMethods";
import { useAutoDiscountRules } from "@/hooks/useAutoDiscountRules";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ManualPaymentInstructions } from "@/components/checkout/ManualPaymentInstructions";
import { BankTransferInstructions } from "@/components/checkout/BankTransferInstructions";
import { SavedAddressSelector } from "@/components/checkout/SavedAddressSelector";

interface CouponState {
  couponId?: string;
  couponCode?: string;
  discountAmount?: number;
  autoDiscount?: number;
  autoDiscountRuleName?: string;
}

interface SavedAddress {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  street_address: string;
  area: string | null;
  city: string;
  postal_code: string | null;
  is_default: boolean | null;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, subtotal, clearCart, markCartRecovered } = useCart();
  const { user } = useAuth();
  const { appliedCoupon, validateCoupon, removeCoupon, incrementCouponUsage, loading: couponLoading } = useCoupon();
  const { zonesWithRates, loading: shippingLoading } = useShippingData();
  const { paymentMethods: enabledPaymentMethods, loading: paymentMethodsLoading } = useEnabledPaymentMethods();

  // Get coupon from cart page or allow applying here
  const [couponCode, setCouponCode] = useState("");
  const couponState = location.state as CouponState | undefined;

  // Initialize with coupon from cart if available
  useEffect(() => {
    if (couponState?.couponCode && !appliedCoupon) {
      validateCoupon(couponState.couponCode, subtotal);
    }
  }, []);

  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });
  
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedRateId, setSelectedRateId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [transactionId, setTransactionId] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Saved address selection state
  const [useSavedShippingAddress, setUseSavedShippingAddress] = useState(true);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<SavedAddress | null>(null);
  
  // Billing address state
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<SavedAddress | null>(null);
  const [useSavedBillingAddress, setUseSavedBillingAddress] = useState(true);
  const [hasBillingAddresses, setHasBillingAddresses] = useState(false);
  
  // Save address option
  const [saveShippingAddress, setSaveShippingAddress] = useState(false);
  const [shippingAddressLabel, setShippingAddressLabel] = useState("Home");
  
  // Save billing address option
  const [saveBillingAddress, setSaveBillingAddress] = useState(false);
  const [billingAddressLabel, setBillingAddressLabel] = useState("Office");
  const [billingFormData, setBillingFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  // Get selected zone and its rates
  const selectedZone = useMemo(() => {
    return zonesWithRates.find(z => z.id === selectedZoneId);
  }, [zonesWithRates, selectedZoneId]);

  const availableRates = useMemo(() => {
    return selectedZone?.rates?.filter(r => r.is_active) || [];
  }, [selectedZone]);

  const selectedRate = useMemo(() => {
    return availableRates.find(r => r.id === selectedRateId);
  }, [availableRates, selectedRateId]);

  // Calculate shipping cost based on selected rate
  const shippingCost = useMemo(() => {
    if (!selectedRate) return 0;
    
    // Check for free shipping threshold (using max_order_amount as free above threshold)
    if (selectedRate.max_order_amount && subtotal >= selectedRate.max_order_amount) {
      return 0;
    }
    
    return selectedRate.rate;
  }, [selectedRate, subtotal]);

  // Auto-select first rate when zone changes
  useEffect(() => {
    if (availableRates.length > 0 && !selectedRateId) {
      setSelectedRateId(availableRates[0].id);
    } else if (availableRates.length > 0 && !availableRates.find(r => r.id === selectedRateId)) {
      setSelectedRateId(availableRates[0].id);
    }
  }, [availableRates, selectedRateId]);

  // Auto-select first payment method when loaded
  useEffect(() => {
    if (enabledPaymentMethods.length > 0) {
      const currentMethodExists = enabledPaymentMethods.find(m => m.method_id === paymentMethod);
      if (!currentMethodExists) {
        setPaymentMethod(enabledPaymentMethods[0].method_id);
      }
    }
  }, [enabledPaymentMethods]);

  // Auto-select zone based on city input (simple matching)
  useEffect(() => {
    if (formData.city && zonesWithRates.length > 0) {
      const cityLower = formData.city.toLowerCase();
      
      // Try to match city to a zone
      const matchedZone = zonesWithRates.find(zone => {
        const zoneName = zone.name.toLowerCase();
        const regions = zone.regions.map(r => r.toLowerCase());
        
        return zoneName.includes(cityLower) || 
               cityLower.includes(zoneName.replace(' সিটি', '').replace(' city', '')) ||
               regions.some(r => r.includes(cityLower) || cityLower.includes(r));
      });
      
      if (matchedZone && matchedZone.id !== selectedZoneId) {
        setSelectedZoneId(matchedZone.id);
      } else if (!matchedZone && !selectedZoneId) {
        // Default to "সারাদেশ" or last zone if no match
        const defaultZone = zonesWithRates.find(z => 
          z.name.includes('সারাদেশ') || z.name.toLowerCase().includes('all')
        ) || zonesWithRates[zonesWithRates.length - 1];
        if (defaultZone) {
          setSelectedZoneId(defaultZone.id);
        }
      }
    }
  }, [formData.city, zonesWithRates, selectedZoneId]);

  // Calculate auto discount from rules
  const { calculateDiscount: calculateAutoDiscount, getActiveRules } = useAutoDiscountRules();
  const autoDiscount = couponState?.autoDiscount || calculateAutoDiscount(subtotal);
  const activeAutoRules = getActiveRules().filter(rule => 
    rule.rule_type === "cart_total" && rule.min_purchase && subtotal >= rule.min_purchase
  );
  
  // Use the higher discount between coupon and auto discount
  const couponDiscount = appliedCoupon?.discountAmount || couponState?.discountAmount || 0;
  const discount = Math.max(couponDiscount, autoDiscount);
  const isAutoDiscountApplied = autoDiscount > couponDiscount && autoDiscount > 0;
  
  // Calculate COD charge
  const codCharge = useMemo(() => {
    const selectedMethod = enabledPaymentMethods.find(m => m.method_id === paymentMethod);
    if (!selectedMethod || selectedMethod.method_id !== 'cod' || !selectedMethod.cod_charge_enabled) {
      return 0;
    }
    if (selectedMethod.cod_charge_type === 'percentage') {
      return Math.round((subtotal * selectedMethod.cod_charge_value) / 100);
    }
    return selectedMethod.cod_charge_value;
  }, [enabledPaymentMethods, paymentMethod, subtotal]);
  
  const total = subtotal - discount + shippingCost + codCharge;

  const formatPrice = (price: number) => `৳${price.toLocaleString('en-BD')}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate shipping phone number format (Bangladesh format)
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
      toast.error("Please enter a valid Bangladeshi phone number");
      return;
    }

    // Validate shipping field lengths
    if (formData.firstName.length > 50) {
      toast.error("First name must be less than 50 characters");
      return;
    }
    if (formData.lastName.length > 50) {
      toast.error("Last name must be less than 50 characters");
      return;
    }
    if (formData.address.length > 200) {
      toast.error("Address must be less than 200 characters");
      return;
    }
    if (formData.city.length > 50) {
      toast.error("City must be less than 50 characters");
      return;
    }
    if (formData.postalCode && formData.postalCode.length > 10) {
      toast.error("Postal code must be less than 10 characters");
      return;
    }

    if (!formData.email) {
      toast.error("Please provide an email address");
      return;
    }

    if (!selectedZoneId || !selectedRateId) {
      toast.error("শিপিং জোন ও ডেলিভারি অপশন সিলেক্ট করুন");
      return;
    }

    // Validate billing address if using a new one
    if (!billingAddressSameAsShipping && !useSavedBillingAddress) {
      if (!billingFormData.firstName || !billingFormData.lastName || !billingFormData.phone || !billingFormData.address || !billingFormData.city) {
        toast.error("Please fill in all required billing address fields");
        return;
      }
      
      // Validate phone number format (Bangladesh format)
      const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
      if (!phoneRegex.test(billingFormData.phone.replace(/[\s-]/g, ''))) {
        toast.error("Please enter a valid Bangladeshi phone number for billing");
        return;
      }
      
      // Validate field lengths
      if (billingFormData.firstName.length > 50) {
        toast.error("Billing first name must be less than 50 characters");
        return;
      }
      if (billingFormData.lastName.length > 50) {
        toast.error("Billing last name must be less than 50 characters");
        return;
      }
      if (billingFormData.address.length > 200) {
        toast.error("Billing address must be less than 200 characters");
        return;
      }
      if (billingFormData.city.length > 50) {
        toast.error("Billing city must be less than 50 characters");
        return;
      }
      if (billingFormData.postalCode && billingFormData.postalCode.length > 10) {
        toast.error("Billing postal code must be less than 10 characters");
        return;
      }
    }

    // Require transaction ID for mobile payment methods and bank transfer
    if (['bkash', 'nagad', 'rocket', 'upay', 'bank_transfer'].includes(paymentMethod) && !transactionId.trim()) {
      toast.error(paymentMethod === 'bank_transfer' ? "Transaction Reference দিন" : "Transaction ID দিন");
      return;
    }

    setProcessing(true);

    try {
      let customerId: string | null = null;

      // If user is logged in, find or create customer record
      if (user) {
        // Check if customer exists for this user
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
          
          // Update customer info
          await supabase
            .from('customers')
            .update({
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            address: JSON.stringify({
              street: formData.address,
              city: formData.city,
              postal_code: formData.postalCode || null,
            }),
          } as any)
            .eq('id', customerId);
        } else {
          // Create new customer record
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers' as any)
            .insert([{
              user_id: user.id,
              email: formData.email,
              full_name: `${formData.firstName} ${formData.lastName}`,
              phone: formData.phone,
              address: JSON.stringify({
                street: formData.address,
                city: formData.city,
                postal_code: formData.postalCode || null,
              }),
            }] as any)
            .select('id')
            .single();

          if (customerError) throw customerError;
          customerId = (newCustomer as any)?.id || null;
        }
      }

      // Generate order number
      const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      const couponCodeUsed = appliedCoupon?.coupon.code || couponState?.couponCode || null;

      // Build notes with transaction ID if applicable
      const orderNotes = ['bkash', 'nagad', 'rocket'].includes(paymentMethod) && transactionId
        ? `${formData.notes ? formData.notes + ' | ' : ''}${paymentMethod.toUpperCase()} TrxID: ${transactionId}`
        : formData.notes || null;

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          user_id: user?.id || null,
          order_number: orderNumber,
          subtotal: subtotal,
          shipping_cost: shippingCost,
          discount_amount: discount,
          total_amount: total,
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
          shipping_address: {
            name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            email: formData.email,
            street: formData.address,
            city: formData.city,
            postal_code: formData.postalCode || null,
          },
          notes: orderNotes ? `${orderNotes}${couponCodeUsed ? ` | Coupon: ${couponCodeUsed}` : ''}` : (couponCodeUsed ? `Coupon: ${couponCodeUsed}` : null),
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name + (item.size ? ` (${item.size})` : '') + (item.color ? ` - ${item.color}` : ''),
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update customer stats if logged in
      if (customerId) {
        const { data: customerStats } = await supabase
          .from('customers')
          .select('total_orders, total_spent')
          .eq('id', customerId)
          .single();

        if (customerStats) {
          await supabase
            .from('customers')
            .update({
              total_orders: (customerStats.total_orders || 0) + 1,
              total_spent: (customerStats.total_spent || 0) + total,
            })
            .eq('id', customerId);
        }
      }

      // Increment coupon usage if one was applied
      if (appliedCoupon?.coupon.id || couponState?.couponId) {
        const couponId = appliedCoupon?.coupon.id || couponState?.couponId;
        if (couponId) {
          await incrementCouponUsage(couponId);
        }
      }

      // Send order confirmation email
      try {
        const paymentMethodNames: Record<string, string> = {
          cod: "Cash on Delivery",
          bkash: "bKash",
          nagad: "Nagad",
          rocket: "Rocket",
          upay: "Upay",
          bank_transfer: "Bank Transfer",
          paypal: "PayPal",
          payoneer: "Payoneer",
          sslcommerz: "SSLCommerz",
          aamarpay: "aamarPay",
        };
        
        await supabase.functions.invoke("send-order-confirmation", {
          body: {
            customerEmail: formData.email,
            customerName: `${formData.firstName} ${formData.lastName}`,
            orderNumber: order.order_number,
            items: items.map((item) => ({
              name: item.name + (item.size ? ` (${item.size})` : "") + (item.color ? ` - ${item.color}` : ""),
              quantity: item.quantity,
              price: item.price * item.quantity,
            })),
            subtotal,
            shippingCost,
            total,
            shippingAddress: `${formData.address}, ${formData.city}${formData.postalCode ? `, ${formData.postalCode}` : ""}`,
            paymentMethod: paymentMethodNames[paymentMethod] || paymentMethod,
          },
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the order if email fails
      }

      toast.success("Order placed successfully!");

      // Save the new shipping address if user opted in
      if (user && saveShippingAddress && !useSavedShippingAddress) {
        try {
          const { error } = await supabase
            .from('user_addresses')
            .insert({
              user_id: user.id,
              label: shippingAddressLabel,
              full_name: `${formData.firstName} ${formData.lastName}`,
              phone: formData.phone,
              street_address: formData.address,
              city: formData.city,
              postal_code: formData.postalCode || null,
              is_default: false,
            });
          if (!error) {
            toast.success(`Shipping address saved as "${shippingAddressLabel}"`);
          }
        } catch (saveAddressError) {
          console.error("Failed to save address:", saveAddressError);
          // Don't fail the order if saving address fails
        }
      }
      
      // Save the new billing address if user opted in
      if (user && saveBillingAddress && !billingAddressSameAsShipping && !useSavedBillingAddress) {
        try {
          const { error } = await supabase
            .from('user_addresses')
            .insert({
              user_id: user.id,
              label: billingAddressLabel,
              full_name: `${billingFormData.firstName} ${billingFormData.lastName}`,
              phone: billingFormData.phone,
              street_address: billingFormData.address,
              city: billingFormData.city,
              postal_code: billingFormData.postalCode || null,
              is_default: false,
            });
          if (!error) {
            toast.success(`Billing address saved as "${billingAddressLabel}"`);
          }
        } catch (saveAddressError) {
          console.error("Failed to save billing address:", saveAddressError);
          // Don't fail the order if saving address fails
        }
      }
      
      // Mark abandoned cart as recovered before clearing
      await markCartRecovered(order.id);
      clearCart();
      
      // Get selected payment method details for confirmation page
      const selectedPaymentMethod = enabledPaymentMethods.find(m => m.method_id === paymentMethod);
      
      // Navigate to confirmation with order details
      navigate("/order-confirmation", { 
        state: { 
          orderNumber: order.order_number,
          paymentMethod: selectedPaymentMethod ? {
            method_id: selectedPaymentMethod.method_id,
            name: selectedPaymentMethod.name,
            name_bn: selectedPaymentMethod.name_bn,
            icon: selectedPaymentMethod.icon,
            logo_url: selectedPaymentMethod.logo_url,
            account_number: selectedPaymentMethod.account_number,
            account_type: selectedPaymentMethod.account_type,
          } : null,
          transactionId: transactionId || null,
          total: total,
        } 
      });
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some products before checking out.</p>
          <Button asChild>
            <Link to="/products">Shop Now</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      {/* Page Header */}
      <section className="bg-gradient-to-r from-store-primary to-store-secondary py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-store-primary-foreground"
              asChild
            >
              <Link to="/cart">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="font-display text-2xl font-bold text-store-primary-foreground">
              Checkout
            </h1>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-store-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  {!user && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="createAccount"
                        checked={createAccount}
                        onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
                      />
                      <Label htmlFor="createAccount" className="text-sm font-normal cursor-pointer">
                        Create an account for faster checkout next time
                      </Label>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-store-primary" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Saved Address Selector - Only show for logged in users */}
                  {user && (
                    <>
                      <SavedAddressSelector
                        userId={user.id}
                        type="shipping"
                        onSelectAddress={(address) => {
                          if (address) {
                            setSelectedSavedAddress({
                              id: address.id,
                              label: address.label,
                              full_name: address.full_name,
                              phone: address.phone,
                              street_address: address.street_address,
                              area: address.area,
                              city: address.city,
                              postal_code: address.postal_code,
                              is_default: address.is_default,
                            });
                            setUseSavedShippingAddress(true);
                            // Parse name into first and last
                            const nameParts = address.full_name.split(" ");
                            const firstName = nameParts[0] || "";
                            const lastName = nameParts.slice(1).join(" ") || "";
                            
                            setFormData(prev => ({
                              ...prev,
                              firstName,
                              lastName,
                              phone: address.phone,
                              address: address.street_address + (address.area ? `, ${address.area}` : ""),
                              city: address.city,
                              postalCode: address.postal_code || "",
                            }));
                          } else {
                            setSelectedSavedAddress(null);
                          }
                        }}
                        onUseNewAddress={() => {
                          setUseSavedShippingAddress(false);
                          setSelectedSavedAddress(null);
                          setFormData(prev => ({
                            ...prev,
                            firstName: "",
                            lastName: "",
                            phone: "",
                            address: "",
                            city: "",
                            postalCode: "",
                          }));
                        }}
                      />
                      <Separator />
                    </>
                  )}

                  {/* Manual address form - always visible but pre-filled when saved address is selected */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value.slice(0, 50) }))}
                        maxLength={50}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">{formData.firstName.length}/50</p>
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value.slice(0, 50) }))}
                        maxLength={50}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">{formData.lastName.length}/50</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9+\s-]/g, '').slice(0, 15);
                        setFormData(prev => ({ ...prev, phone: value }));
                      }}
                      placeholder="+880 1XXX-XXXXXX"
                      maxLength={15}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Format: +880 1XXX-XXXXXX or 01XXX-XXXXXX</p>
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value.slice(0, 200) }))}
                      placeholder="House/Flat No, Street, Area"
                      maxLength={200}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">{formData.address.length}/200</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value.slice(0, 50) }))}
                        maxLength={50}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">{formData.city.length}/50</p>
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                          setFormData(prev => ({ ...prev, postalCode: value }));
                        }}
                        maxLength={10}
                        placeholder="1205"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Input
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value.slice(0, 500) }))}
                      placeholder="Special instructions for delivery"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{formData.notes.length}/500</p>
                  </div>

                  {/* Shipping Zone & Rate Selection */}
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-store-primary" />
                      Shipping Zone & Rate
                    </div>
                    
                    {shippingLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading shipping options...
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="shippingZone">Shipping Zone *</Label>
                          <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your area" />
                            </SelectTrigger>
                            <SelectContent>
                              {zonesWithRates.filter(z => z.is_active).map((zone) => (
                                <SelectItem key={zone.id} value={zone.id}>
                                  {zone.name} ({zone.regions.join(', ')})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedZone && availableRates.length > 0 && (
                          <div>
                            <Label>Delivery Option *</Label>
                            <RadioGroup value={selectedRateId} onValueChange={setSelectedRateId} className="mt-2">
                              {availableRates.map((rate) => {
                                const isFree = rate.max_order_amount && subtotal >= rate.max_order_amount;
                                const displayPrice = isFree ? 0 : rate.rate;
                                
                                return (
                                  <label 
                                    key={rate.id} 
                                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-store-primary transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <RadioGroupItem value={rate.id} />
                                      <div>
                                        <p className="font-medium text-sm">{rate.name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {rate.min_days ?? 1}-{rate.max_days ?? 3} days
                                          {rate.min_weight && rate.max_weight 
                                            ? ` • ${rate.min_weight}-${rate.max_weight}kg`
                                            : ''}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {isFree ? (
                                        <span className="text-green-600 font-medium text-sm">Free</span>
                                      ) : (
                                        <span className="font-medium text-sm">৳{displayPrice}</span>
                                      )}
                                      {rate.max_order_amount && !isFree && (
                                        <p className="text-xs text-muted-foreground">
                                          ৳{rate.max_order_amount}+ free
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </RadioGroup>
                          </div>
                        )}
                        
                        {selectedZone && availableRates.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            এই জোনে কোনো শিপিং অপশন নেই
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Save Address Option - Only show for logged-in users using new address */}
                  {user && !useSavedShippingAddress && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="saveShippingAddress"
                            checked={saveShippingAddress}
                            onCheckedChange={(checked) => setSaveShippingAddress(checked as boolean)}
                          />
                          <Label htmlFor="saveShippingAddress" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                            <Save className="h-4 w-4 text-store-primary" />
                            Save this address for future orders
                          </Label>
                        </div>
                        {saveShippingAddress && (
                          <div className="ml-6">
                            <Label htmlFor="addressLabel" className="text-xs text-muted-foreground">Address Label</Label>
                            <Select value={shippingAddressLabel} onValueChange={setShippingAddressLabel}>
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Home">Home</SelectItem>
                                <SelectItem value="Office">Office</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Billing Address Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-store-primary" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="billingAddressSameAsShipping"
                      checked={billingAddressSameAsShipping}
                      onCheckedChange={(checked) => setBillingAddressSameAsShipping(checked as boolean)}
                    />
                    <Label htmlFor="billingAddressSameAsShipping" className="text-sm font-normal cursor-pointer">
                      Same as shipping address
                    </Label>
                  </div>

                  {!billingAddressSameAsShipping && user && (
                    <>
                      <Separator />
                      <SavedAddressSelector
                        userId={user.id}
                        type="billing"
                        onSelectAddress={(address) => {
                          if (address) {
                            setSelectedBillingAddress({
                              id: address.id,
                              label: address.label,
                              full_name: address.full_name,
                              phone: address.phone,
                              street_address: address.street_address,
                              area: address.area,
                              city: address.city,
                              postal_code: address.postal_code,
                              is_default: address.is_default,
                            });
                            setUseSavedBillingAddress(true);
                            setHasBillingAddresses(true);
                            // Pre-fill billing form with saved address
                            const nameParts = address.full_name.split(' ');
                            setBillingFormData({
                              firstName: nameParts[0] || "",
                              lastName: nameParts.slice(1).join(' ') || "",
                              phone: address.phone,
                              address: address.street_address,
                              city: address.city,
                              postalCode: address.postal_code || "",
                            });
                          } else {
                            setSelectedBillingAddress(null);
                          }
                        }}
                        onUseNewAddress={() => {
                          setUseSavedBillingAddress(false);
                          setSelectedBillingAddress(null);
                          setBillingFormData({
                            firstName: "",
                            lastName: "",
                            phone: "",
                            address: "",
                            city: "",
                            postalCode: "",
                          });
                        }}
                      />
                      
                      {/* Billing Address Form - show when using new address */}
                      {!useSavedBillingAddress && (
                        <>
                          <Separator className="my-4" />
                          <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="billingFirstName">First Name *</Label>
                                <Input
                                  id="billingFirstName"
                                  value={billingFormData.firstName}
                                  onChange={(e) => setBillingFormData(prev => ({ ...prev, firstName: e.target.value.slice(0, 50) }))}
                                  maxLength={50}
                                  required={!billingAddressSameAsShipping}
                                />
                                <p className="text-xs text-muted-foreground mt-1">{billingFormData.firstName.length}/50</p>
                              </div>
                              <div>
                                <Label htmlFor="billingLastName">Last Name *</Label>
                                <Input
                                  id="billingLastName"
                                  value={billingFormData.lastName}
                                  onChange={(e) => setBillingFormData(prev => ({ ...prev, lastName: e.target.value.slice(0, 50) }))}
                                  maxLength={50}
                                  required={!billingAddressSameAsShipping}
                                />
                                <p className="text-xs text-muted-foreground mt-1">{billingFormData.lastName.length}/50</p>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="billingPhone">Phone Number *</Label>
                              <Input
                                id="billingPhone"
                                type="tel"
                                value={billingFormData.phone}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9+\s-]/g, '').slice(0, 15);
                                  setBillingFormData(prev => ({ ...prev, phone: value }));
                                }}
                                placeholder="+880 1XXX-XXXXXX"
                                maxLength={15}
                                required={!billingAddressSameAsShipping}
                              />
                              <p className="text-xs text-muted-foreground mt-1">Format: +880 1XXX-XXXXXX or 01XXX-XXXXXX</p>
                            </div>
                            <div>
                              <Label htmlFor="billingAddress">Address *</Label>
                              <Input
                                id="billingAddress"
                                value={billingFormData.address}
                                onChange={(e) => setBillingFormData(prev => ({ ...prev, address: e.target.value.slice(0, 200) }))}
                                placeholder="House/Flat No, Street, Area"
                                maxLength={200}
                                required={!billingAddressSameAsShipping}
                              />
                              <p className="text-xs text-muted-foreground mt-1">{billingFormData.address.length}/200</p>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="billingCity">City *</Label>
                                <Input
                                  id="billingCity"
                                  value={billingFormData.city}
                                  onChange={(e) => setBillingFormData(prev => ({ ...prev, city: e.target.value.slice(0, 50) }))}
                                  maxLength={50}
                                  required={!billingAddressSameAsShipping}
                                />
                                <p className="text-xs text-muted-foreground mt-1">{billingFormData.city.length}/50</p>
                              </div>
                              <div>
                                <Label htmlFor="billingPostalCode">Postal Code</Label>
                                <Input
                                  id="billingPostalCode"
                                  value={billingFormData.postalCode}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                    setBillingFormData(prev => ({ ...prev, postalCode: value }));
                                  }}
                                  maxLength={10}
                                  placeholder="1205"
                                />
                              </div>
                            </div>
                            
                            {/* Save Billing Address Option */}
                            <Separator className="my-4" />
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="saveBillingAddress"
                                  checked={saveBillingAddress}
                                  onCheckedChange={(checked) => setSaveBillingAddress(checked as boolean)}
                                />
                                <Label htmlFor="saveBillingAddress" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                                  <Save className="h-4 w-4 text-store-primary" />
                                  Save this billing address for future orders
                                </Label>
                              </div>
                              {saveBillingAddress && (
                                <div className="ml-6">
                                  <Label htmlFor="billingAddressLabel" className="text-xs text-muted-foreground">Address Label</Label>
                                  <Select value={billingAddressLabel} onValueChange={setBillingAddressLabel}>
                                    <SelectTrigger className="w-full mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Home">Home</SelectItem>
                                      <SelectItem value="Office">Office</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {!billingAddressSameAsShipping && !user && (
                    <p className="text-sm text-muted-foreground">
                      <Link to="/login" className="text-store-primary hover:underline">Log in</Link> to use saved billing addresses, or the shipping address will be used for billing.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-store-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentMethodsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : enabledPaymentMethods.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No payment methods available
                    </p>
                  ) : (
                    <>
                      <RadioGroup value={paymentMethod} onValueChange={(value) => {
                        setPaymentMethod(value);
                        setTransactionId(""); // Reset transaction ID when changing method
                      }}>
                        <div className="space-y-3">
                          {enabledPaymentMethods.map((method) => {
                            // Calculate COD charge for display
                            let methodCodCharge = 0;
                            if (method.method_id === 'cod' && method.cod_charge_enabled) {
                              if (method.cod_charge_type === 'percentage') {
                                methodCodCharge = Math.round((subtotal * method.cod_charge_value) / 100);
                              } else {
                                methodCodCharge = method.cod_charge_value;
                              }
                            }
                            
                            return (
                              <label 
                                key={method.id} 
                                className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-store-primary transition-colors"
                              >
                                <RadioGroupItem value={method.method_id} id={method.method_id} />
                                <div className="flex-1 flex items-center gap-3">
                                  {method.logo_url ? (
                                    <img 
                                      src={method.logo_url} 
                                      alt={method.name} 
                                      className="h-8 w-8 object-contain rounded"
                                    />
                                  ) : method.icon ? (
                                    <span className="text-2xl">{method.icon}</span>
                                  ) : method.type === 'manual' ? (
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-medium">
                                        {method.name}
                                        {method.name_bn && <span className="text-muted-foreground ml-1">({method.name_bn})</span>}
                                      </p>
                                      {methodCodCharge > 0 && (
                                        <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded">
                                          +{formatPrice(methodCodCharge)}
                                        </span>
                                      )}
                                    </div>
                                    {method.description && (
                                      <p className="text-sm text-muted-foreground">{method.description}</p>
                                    )}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </RadioGroup>
                      
                      {/* Show payment instructions based on method type */}
                      {(() => {
                        const selectedMethod = enabledPaymentMethods.find(m => m.method_id === paymentMethod);
                        
                        // Mobile payment methods
                        if (selectedMethod && ['bkash', 'nagad', 'rocket', 'upay'].includes(selectedMethod.method_id)) {
                          return (
                            <ManualPaymentInstructions
                              paymentMethod={selectedMethod}
                              transactionId={transactionId}
                              onTransactionIdChange={setTransactionId}
                            />
                          );
                        }
                        
                        // Bank transfer
                        if (selectedMethod && selectedMethod.method_id === 'bank_transfer') {
                          return (
                            <BankTransferInstructions
                              paymentMethod={selectedMethod}
                              transactionId={transactionId}
                              onTransactionIdChange={setTransactionId}
                            />
                          );
                        }
                        
                        // COD with charge info
                        if (selectedMethod && selectedMethod.method_id === 'cod' && selectedMethod.cod_charge_enabled && codCharge > 0) {
                          return (
                            <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium text-warning">COD চার্জ প্রযোজ্য</p>
                                  <p className="text-sm text-warning/80 mt-1">
                                    Cash on Delivery তে অতিরিক্ত {formatPrice(codCharge)} চার্জ যোগ হবে
                                    {selectedMethod.cod_charge_type === 'percentage' && ` (${selectedMethod.cod_charge_value}%)`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // Gateway methods - coming soon notice
                        if (selectedMethod && ['paypal', 'payoneer', 'sslcommerz', 'aamarpay'].includes(selectedMethod.method_id)) {
                          return (
                            <div className="mt-4 p-4 bg-muted rounded-lg border">
                              <p className="text-sm text-muted-foreground text-center">
                                আপনাকে পেমেন্ট সম্পন্ন করতে {selectedMethod.name} এ নিয়ে যাওয়া হবে
                              </p>
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          {(item.size || item.color) && (
                            <p className="text-xs text-muted-foreground">
                              {item.size} {item.color && `/ ${item.color}`}
                            </p>
                          )}
                          <p className="text-sm">
                            {formatPrice(item.price)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Coupon */}
                  {(appliedCoupon || couponState) ? (
                    <div className="flex items-center justify-between p-3 bg-store-accent/10 rounded-lg border border-store-accent">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-store-accent" />
                        <span className="font-medium text-sm">{appliedCoupon?.coupon.code || couponState?.couponCode}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-destructive h-6 px-2">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="h-9"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => validateCoupon(couponCode, subtotal)}
                        disabled={couponLoading || !couponCode.trim()}
                      >
                        Apply
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
                        <span>Discount</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Shipping
                        {selectedZone && selectedRate && (
                          <span className="block text-xs">
                            {selectedZone.name} • {selectedRate.name}
                          </span>
                        )}
                      </span>
                      <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                        {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                      </span>
                    </div>
                    {codCharge > 0 && (
                      <div className="flex justify-between text-sm text-warning">
                        <span>COD Charge</span>
                        <span>+{formatPrice(codCharge)}</span>
                      </div>
                    )}
                    {selectedRate?.max_order_amount && subtotal < selectedRate.max_order_amount && (
                      <p className="text-xs text-muted-foreground">
                        Order ৳{(selectedRate.max_order_amount - subtotal).toLocaleString()} more for free delivery!
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>

                  <Button 
                    type="submit"
                    size="lg" 
                    className="w-full bg-store-primary hover:bg-store-primary/90"
                    disabled={processing || !selectedZoneId || !selectedRateId}
                  >
                    {processing ? "Processing..." : `Place Order • ${formatPrice(total)}`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Secure checkout</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}
