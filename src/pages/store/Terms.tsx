import { StoreLayout } from "@/layouts/StoreLayout";

export default function Terms() {
  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
          Terms of Service
        </h1>
        <p className="text-muted-foreground text-center mb-12">
          Last updated: January 2024
        </p>

        <div className="max-w-3xl mx-auto">
          <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using Ekta Clothing's website, you accept and agree to be bound 
              by these Terms of Service. If you do not agree to these terms, please do not use our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4">2. Products and Pricing</h2>
            <p className="text-muted-foreground mb-2">
              All products are subject to availability. We reserve the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Limit quantities available for purchase</li>
              <li>Discontinue products at any time</li>
              <li>Correct pricing errors</li>
              <li>Refuse orders in cases of suspected fraud</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Prices are displayed in Bangladeshi Taka (৳) and include applicable taxes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4">3. Orders and Payment</h2>
            <p className="text-muted-foreground">
              When you place an order, you agree to provide accurate and complete information. 
              Payment must be made at the time of order unless Cash on Delivery is selected. 
              We accept bKash, Nagad, Rocket, bank transfers, and COD.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4">4. Shipping and Delivery</h2>
            <p className="text-muted-foreground">
              We will make every effort to deliver your order within the estimated timeframe. 
              However, delivery dates are not guaranteed. Risk of loss passes to you upon delivery. 
              Please refer to our Shipping Information page for details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4">5. Returns and Refunds</h2>
            <p className="text-muted-foreground">
              We accept returns within 7 days of delivery for eligible items. Please review our 
              Returns & Exchange policy for complete details on eligibility and procedures.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4">6. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content on this website, including images, text, logos, and designs, is the 
              property of Ekta Clothing and is protected by copyright laws. You may not use, 
              reproduce, or distribute any content without our written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4">7. User Accounts</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities under your account. Notify us immediately of any unauthorized use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Ekta Clothing shall not be liable for any indirect, incidental, or consequential 
              damages arising from your use of our website or products. Our liability is limited 
              to the amount paid for the specific product in question.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Changes will be effective 
              immediately upon posting. Your continued use of the website constitutes acceptance 
              of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-xl font-bold mb-4">10. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us at:<br />
              Email: hello@ektaclothing.com<br />
              Phone: +880 1XXX-XXXXXX<br />
              Address: 123 Fashion Street, Dhanmondi, Dhaka 1205
            </p>
          </section>
        </div>
      </div>
    </StoreLayout>
  );
}
