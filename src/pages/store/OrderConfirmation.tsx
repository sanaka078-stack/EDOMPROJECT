import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, Package, ArrowRight, MapPin, CreditCard, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StoreLayout } from "@/layouts/StoreLayout";
import { useAuth } from "@/contexts/AuthContext";

interface OrderState {
  orderNumber: string;
  paymentMethod?: {
    method_id: string;
    name: string;
    name_bn?: string | null;
    icon?: string | null;
    logo_url?: string | null;
    account_number?: string | null;
    account_type?: string | null;
  };
  transactionId?: string;
  total?: number;
}

export default function OrderConfirmation() {
  const location = useLocation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const orderState = location.state as OrderState | undefined;
  const orderNumber = orderState?.orderNumber || `ORD-${Date.now().toString().slice(-8)}`;
  const paymentMethod = orderState?.paymentMethod;
  const transactionId = orderState?.transactionId;
  const total = orderState?.total;

  const formatPrice = (price: number) => `৳${price.toLocaleString('en-BD')}`;

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getPaymentStatusMessage = () => {
    if (paymentMethod?.method_id === 'cod') {
      return 'ডেলিভারির সময় পেমেন্ট করবেন';
    }
    if (['bkash', 'nagad', 'rocket', 'upay'].includes(paymentMethod?.method_id || '')) {
      return transactionId ? `TrxID: ${transactionId} - পেমেন্ট ভেরিফিকেশন পেন্ডিং` : 'পেমেন্ট ভেরিফিকেশন পেন্ডিং';
    }
    return 'Processing';
  };

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          Thank You for Your Order!
        </h1>
        <p className="text-muted-foreground mb-2">
          Your order has been placed successfully.
        </p>
        <div className="flex items-center justify-center gap-2 mb-8">
          <p className="text-foreground font-medium">
            Order Number: <span className="text-store-primary font-mono">{orderNumber}</span>
          </p>
          <button
            onClick={handleCopyOrderNumber}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
            title="Copy order number"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Payment Method Card */}
        {paymentMethod && (
          <Card className="mb-6 text-left">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {paymentMethod.logo_url ? (
                    <img 
                      src={paymentMethod.logo_url} 
                      alt={paymentMethod.name}
                      className="h-12 w-12 object-contain rounded-lg border border-border p-1"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      {paymentMethod.icon ? (
                        <span className="text-2xl">{paymentMethod.icon}</span>
                      ) : (
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    Payment Method
                  </h3>
                  <div className="mt-1">
                    <p className="text-foreground font-medium">
                      {paymentMethod.name}
                      {paymentMethod.name_bn && (
                        <span className="text-muted-foreground ml-1">({paymentMethod.name_bn})</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getPaymentStatusMessage()}
                    </p>
                    {total && (
                      <p className="text-sm font-medium text-store-primary mt-1">
                        Total: {formatPrice(total)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Payment instructions for mobile payments */}
              {['bkash', 'nagad', 'rocket', 'upay'].includes(paymentMethod.method_id) && paymentMethod.account_number && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    আপনার পেমেন্ট ভেরিফাই হলে আমরা আপনাকে জানাব।
                  </p>
                  <div className="mt-2 p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Sent to</p>
                    <p className="font-mono font-medium">{paymentMethod.account_number}</p>
                    {paymentMethod.account_type && (
                      <p className="text-xs text-muted-foreground capitalize">
                        ({paymentMethod.account_type} Account)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 text-left">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Package className="h-6 w-6 text-store-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">What's Next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• You will receive an order confirmation email shortly</li>
                  <li>• We'll notify you when your order ships</li>
                  <li>• Estimated delivery: 3-5 business days</li>
                  <li>• Track your order in your account dashboard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg"
            className="bg-store-primary hover:bg-store-primary/90"
            asChild
          >
            <Link to={`/track/${orderNumber}`}>
              <MapPin className="mr-2 h-4 w-4" />
              Track Order
            </Link>
          </Button>
          <Button 
            size="lg"
            variant="outline"
            asChild
          >
            <Link to="/products">
              Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {user && (
          <p className="text-sm text-muted-foreground mt-6">
            You can also view all your orders in your{" "}
            <Link to="/account" className="text-store-primary hover:underline">
              account dashboard
            </Link>
            .
          </p>
        )}
      </div>
    </StoreLayout>
  );
}
