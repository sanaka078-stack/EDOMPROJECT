import { StoreLayout } from "@/layouts/StoreLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I track my order?",
    answer: "You can track your order by visiting our Track Order page and entering your order number. You'll receive tracking updates via email and SMS once your order is shipped."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept bKash, Nagad, Rocket, bank transfers, and Cash on Delivery (COD). All online payments are secure and encrypted."
  },
  {
    question: "How long does delivery take?",
    answer: "Delivery times vary by location. Inside Dhaka: 1-2 business days. Outside Dhaka: 3-5 business days. Express delivery options are available at checkout."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 7-day return policy for unused items in original packaging. Please visit our Returns & Exchange page for detailed instructions."
  },
  {
    question: "How do I find my size?",
    answer: "Check our Size Guide page for detailed measurements. If you're between sizes, we recommend going up a size for a comfortable fit."
  },
  {
    question: "Can I cancel my order?",
    answer: "Orders can be cancelled within 2 hours of placement. After that, please wait for delivery and initiate a return if needed."
  },
  {
    question: "Do you offer international shipping?",
    answer: "Currently, we only ship within Bangladesh. We're working on expanding to international markets soon!"
  },
  {
    question: "How can I contact customer support?",
    answer: "You can reach us via email at hello@ektaclothing.com, call us at +880 1XXX-XXXXXX, or use the contact form on our Contact page."
  },
  {
    question: "Are the product colors accurate?",
    answer: "We try our best to display accurate colors, but slight variations may occur due to screen settings. If you have any concerns, feel free to contact us before ordering."
  },
  {
    question: "Do you have a physical store?",
    answer: "Yes! Visit us at 123 Fashion Street, Dhanmondi, Dhaka 1205. Our store is open Saturday to Thursday, 10AM - 8PM."
  }
];

export default function FAQ() {
  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Find answers to common questions about our products, shipping, returns, and more.
        </p>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </StoreLayout>
  );
}
