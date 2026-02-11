import { jsPDF } from "jspdf";

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceData {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: InvoiceItem[];
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  store_name?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
}

// Colors matching the dark theme with gold accents
const COLORS = {
  primary: [212, 175, 55] as [number, number, number], // Gold
  dark: [26, 26, 26] as [number, number, number], // Dark background
  text: [255, 255, 255] as [number, number, number], // White text
  muted: [156, 163, 175] as [number, number, number], // Gray text
  success: [34, 197, 94] as [number, number, number], // Green
  border: [55, 55, 55] as [number, number, number], // Border color
};

export function generateInvoicePDF(data: InvoiceData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Helper functions
  const drawLine = (yPos: number, color = COLORS.border) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

  // ========== HEADER SECTION ==========
  // Background rectangle for header
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, 50, "F");

  // Store name / Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(data.store_name || "EKTA CLOTHING", margin, y + 10);

  // Invoice label
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  doc.text("INVOICE", pageWidth - margin, y + 5, { align: "right" });

  // Invoice number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`#INV-${data.order_number}`, pageWidth - margin, y + 12, { align: "right" });

  // Date
  const invoiceDate = new Date(data.created_at).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(invoiceDate, pageWidth - margin, y + 19, { align: "right" });

  y = 60;

  // ========== CUSTOMER & SHIPPING INFO ==========
  const colWidth = (pageWidth - margin * 2) / 2;

  // Bill To section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text("BILL TO", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  y += 7;
  doc.text(data.customer_name, margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  if (data.customer_phone) {
    doc.text(`Phone: ${data.customer_phone}`, margin, y);
    y += 5;
  }
  if (data.customer_email) {
    doc.text(`Email: ${data.customer_email}`, margin, y);
    y += 5;
  }

  // Ship To section
  let shipY = 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text("SHIP TO", margin + colWidth, shipY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  shipY += 7;
  doc.text(data.customer_name, margin + colWidth, shipY);
  shipY += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);

  // Split address into lines if too long
  const addressLines = doc.splitTextToSize(data.shipping_address || "N/A", colWidth - 10);
  addressLines.forEach((line: string) => {
    doc.text(line, margin + colWidth, shipY);
    shipY += 5;
  });

  y = Math.max(y, shipY) + 10;

  // ========== ITEMS TABLE ==========
  drawLine(y);
  y += 8;

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 5, pageWidth - margin * 2, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const col1 = margin + 2;
  const col2 = margin + 90;
  const col3 = margin + 115;
  const col4 = pageWidth - margin - 2;

  doc.text("ITEM", col1, y);
  doc.text("QTY", col2, y);
  doc.text("PRICE", col3, y);
  doc.text("TOTAL", col4, y, { align: "right" });

  y += 8;
  drawLine(y - 3);

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  data.items.forEach((item) => {
    // Handle long product names
    const productLines = doc.splitTextToSize(item.product_name, 80);
    
    doc.text(productLines[0], col1, y);
    doc.text(item.quantity.toString(), col2, y);
    doc.text(formatCurrency(item.unit_price), col3, y);
    doc.text(formatCurrency(item.total_price), col4, y, { align: "right" });

    // If product name has multiple lines
    if (productLines.length > 1) {
      for (let i = 1; i < productLines.length; i++) {
        y += 5;
        doc.text(productLines[i], col1, y);
      }
    }

    y += 8;

    // Light separator between items
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
  });

  y += 5;

  // ========== TOTALS SECTION ==========
  const totalsX = pageWidth - margin - 60;
  const valuesX = pageWidth - margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  // Subtotal
  doc.text("Subtotal:", totalsX, y);
  doc.setTextColor(60, 60, 60);
  doc.text(formatCurrency(data.subtotal), valuesX, y, { align: "right" });
  y += 7;

  // Shipping
  doc.setTextColor(100, 100, 100);
  doc.text("Shipping:", totalsX, y);
  doc.setTextColor(60, 60, 60);
  doc.text(formatCurrency(data.shipping_cost), valuesX, y, { align: "right" });
  y += 7;

  // Discount (if any)
  if (data.discount > 0) {
    doc.setTextColor(100, 100, 100);
    doc.text("Discount:", totalsX, y);
    doc.setTextColor(...COLORS.success);
    doc.text(`-${formatCurrency(data.discount)}`, valuesX, y, { align: "right" });
    y += 7;
  }

  // Total line
  y += 3;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1);
  doc.line(totalsX - 10, y, pageWidth - margin, y);
  y += 8;

  // Grand Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.text("TOTAL:", totalsX, y);
  doc.text(formatCurrency(data.total), valuesX, y, { align: "right" });

  y += 20;

  // ========== PAYMENT INFO ==========
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 25, 3, 3, "F");

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Payment Method:", margin + 5, y);
  doc.setTextColor(60, 60, 60);
  doc.text(data.payment_method || "N/A", margin + 45, y);

  doc.setTextColor(100, 100, 100);
  doc.text("Payment Status:", margin + 100, y);

  // Payment status badge
  const statusColor = data.payment_status === "paid" ? COLORS.success : COLORS.primary;
  doc.setTextColor(...statusColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.payment_status.toUpperCase(), margin + 140, y);

  y += 30;

  // ========== FOOTER ==========
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for shopping with us!", pageWidth / 2, y, { align: "center" });

  y += 6;
  doc.setFontSize(8);
  doc.text(
    data.store_email || "support@ektaclothing.com",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // ========== SAVE PDF ==========
  doc.save(`Invoice-${data.order_number}.pdf`);
}

// Helper to convert order data to invoice format
export function orderToInvoiceData(order: {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: any;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
}): InvoiceData {
  // Convert shipping address to string
  let addressString = "N/A";
  if (order.shipping_address) {
    if (typeof order.shipping_address === "string") {
      addressString = order.shipping_address;
    } else if (typeof order.shipping_address === "object") {
      const parts = [
        order.shipping_address.street,
        order.shipping_address.area,
        order.shipping_address.city,
      ].filter(Boolean);
      addressString = parts.join(", ");
    }
  }

  return {
    order_number: order.order_number,
    created_at: order.created_at,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    shipping_address: addressString,
    items: order.items,
    subtotal: order.subtotal,
    shipping_cost: order.shipping_cost,
    discount: order.discount,
    total: order.total,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
  };
}
