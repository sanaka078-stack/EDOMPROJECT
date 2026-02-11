import { StoreLayout } from "@/layouts/StoreLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, MapPin, Package } from "lucide-react";

export default function ShippingInfo() {
  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
          Shipping Information
        </h1>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Everything you need to know about our shipping policies and delivery times.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-store-primary/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-store-primary" />
                </div>
                <CardTitle>Delivery Options</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-3">
                <h4 className="font-semibold">Express Delivery</h4>
                <p className="text-sm text-muted-foreground">1-2 business days • ৳80</p>
              </div>
              <div className="border-b pb-3">
                <h4 className="font-semibold">Standard Delivery</h4>
                <p className="text-sm text-muted-foreground">3-5 business days • ৳60</p>
              </div>
              <div>
                <h4 className="font-semibold">Free Shipping</h4>
                <p className="text-sm text-muted-foreground">5-7 business days • Orders over ৳2000</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-store-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-store-primary" />
                </div>
                <CardTitle>Delivery Areas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-3">
                <h4 className="font-semibold">Inside Dhaka</h4>
                <p className="text-sm text-muted-foreground">All areas covered with express option available</p>
              </div>
              <div className="border-b pb-3">
                <h4 className="font-semibold">Outside Dhaka</h4>
                <p className="text-sm text-muted-foreground">All 64 districts covered via courier partners</p>
              </div>
              <div>
                <h4 className="font-semibold">Remote Areas</h4>
                <p className="text-sm text-muted-foreground">May take additional 1-2 days</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-store-primary" />
              Processing Time
            </h2>
            <p className="text-muted-foreground">
              Orders placed before 2 PM are processed the same day. Orders placed after 2 PM or on holidays 
              will be processed the next business day. You'll receive a confirmation email with tracking 
              details once your order ships.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Package className="h-6 w-6 text-store-primary" />
              Order Tracking
            </h2>
            <p className="text-muted-foreground">
              Once your order ships, you'll receive an SMS and email with your tracking number. 
              You can track your order status anytime using our Track Order page. Our delivery 
              partners will also contact you before delivery.
            </p>
          </section>

          <section className="bg-store-primary/5 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Important Notes</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Delivery times are estimates and may vary during peak seasons</li>
              <li>Cash on Delivery (COD) is available for all orders</li>
              <li>Please ensure someone is available to receive the package</li>
              <li>Signature may be required upon delivery</li>
            </ul>
          </section>
        </div>
      </div>
    </StoreLayout>
  );
}
