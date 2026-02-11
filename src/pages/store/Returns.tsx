import { StoreLayout } from "@/layouts/StoreLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, RefreshCw, Package } from "lucide-react";

export default function Returns() {
  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
          Returns & Exchange
        </h1>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          We want you to be completely satisfied with your purchase. Here's everything you need to know about returns and exchanges.
        </p>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Return Policy Overview */}
          <Card className="bg-store-primary/5 border-store-primary/20">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-bold mb-4">7-Day Return Policy</h2>
              <p className="text-muted-foreground">
                You have 7 days from the delivery date to return or exchange your items. 
                Items must be unused, unwashed, and in original packaging with all tags attached.
              </p>
            </CardContent>
          </Card>

          {/* Eligible Items */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-store-accent" />
              Eligible for Return
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Unused items in original condition</li>
              <li>Items with original tags and packaging</li>
              <li>Wrong size or color received</li>
              <li>Defective or damaged products</li>
              <li>Items that don't match the description</li>
            </ul>
          </section>

          {/* Non-Eligible Items */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              Not Eligible for Return
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Items worn, washed, or altered</li>
              <li>Items without original tags</li>
              <li>Intimate wear and undergarments</li>
              <li>Sale items marked as final sale</li>
              <li>Items returned after 7 days</li>
            </ul>
          </section>

          {/* How to Return */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-store-primary" />
              How to Return
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-store-primary text-store-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    1
                  </div>
                  <h3 className="font-semibold mb-2">Contact Us</h3>
                  <p className="text-sm text-muted-foreground">
                    Email us at hello@ektaclothing.com with your order number and reason for return
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-store-primary text-store-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    2
                  </div>
                  <h3 className="font-semibold mb-2">Pack & Ship</h3>
                  <p className="text-sm text-muted-foreground">
                    Pack items securely in original packaging. We'll arrange pickup or provide shipping label
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-store-primary text-store-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    3
                  </div>
                  <h3 className="font-semibold mb-2">Get Refund</h3>
                  <p className="text-sm text-muted-foreground">
                    Refund processed within 5-7 business days after we receive and inspect items
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Exchange */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Package className="h-6 w-6 text-store-primary" />
              Exchange Policy
            </h2>
            <p className="text-muted-foreground mb-4">
              Want a different size or color? We offer free exchanges! Simply contact us within 7 days 
              of delivery and we'll arrange the exchange. If the new item costs more, you'll pay the 
              difference. If it costs less, we'll refund the difference.
            </p>
          </section>

          {/* Refund Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Refund Information</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Refunds are processed to the original payment method</li>
                <li>• bKash/Nagad refunds: 2-3 business days</li>
                <li>• Bank transfer refunds: 5-7 business days</li>
                <li>• Original shipping charges are non-refundable (except for defective items)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </StoreLayout>
  );
}
