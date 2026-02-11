// Payment method definitions - HARDCODED in code
// Only configuration data (account_number, api_key, etc.) goes to database

export interface PaymentMethodDefinition {
  method_id: string;
  name: string;
  name_bn: string;
  icon: string;
  description: string;
  description_bn: string;
  type: "mobile" | "gateway" | "manual" | "custom";
  configFields: ConfigField[];
  instructions?: string;
  instructions_bn?: string;
}

export interface ConfigField {
  key: string;
  label: string;
  label_bn: string;
  type: "text" | "password" | "select" | "image" | "switch" | "number" | "bank_accounts";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  dependsOn?: string; // Show this field only when dependsOn field is truthy
}

export interface BankAccount {
  id: string;
  bank_name: string;
  branch_name: string;
  account_name: string;
  account_number: string;
  routing_number?: string;
  swift_code?: string;
}

export const PAYMENT_METHOD_DEFINITIONS: PaymentMethodDefinition[] = [
  // Mobile Payments
  {
    method_id: "bkash",
    name: "bKash",
    name_bn: "বিকাশ",
    icon: "📱",
    description: "Pay with bKash mobile wallet",
    description_bn: "বিকাশ মোবাইল ওয়ালেটে পেমেন্ট করুন",
    type: "mobile",
    instructions: "Send payment to the bKash number shown and enter transaction ID",
    instructions_bn: "প্রদর্শিত বিকাশ নম্বরে টাকা পাঠান এবং ট্রান্সেকশন আইডি দিন",
    configFields: [
      {
        key: "account_number",
        label: "Account Number",
        label_bn: "একাউন্ট নম্বর",
        type: "text",
        placeholder: "01XXXXXXXXX",
        required: true,
      },
      {
        key: "account_type",
        label: "Account Type",
        label_bn: "একাউন্ট টাইপ",
        type: "select",
        options: [
          { value: "personal", label: "Personal" },
          { value: "agent", label: "Agent" },
          { value: "merchant", label: "Merchant" },
        ],
        required: true,
      },
      {
        key: "qr_code_url",
        label: "Payment QR Code",
        label_bn: "পেমেন্ট QR কোড",
        type: "image",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "nagad",
    name: "Nagad",
    name_bn: "নগদ",
    icon: "📱",
    description: "Pay with Nagad mobile wallet",
    description_bn: "নগদ মোবাইল ওয়ালেটে পেমেন্ট করুন",
    type: "mobile",
    instructions: "Send payment to the Nagad number shown and enter transaction ID",
    instructions_bn: "প্রদর্শিত নগদ নম্বরে টাকা পাঠান এবং ট্রান্সেকশন আইডি দিন",
    configFields: [
      {
        key: "account_number",
        label: "Account Number",
        label_bn: "একাউন্ট নম্বর",
        type: "text",
        placeholder: "01XXXXXXXXX",
        required: true,
      },
      {
        key: "account_type",
        label: "Account Type",
        label_bn: "একাউন্ট টাইপ",
        type: "select",
        options: [
          { value: "personal", label: "Personal" },
          { value: "agent", label: "Agent" },
          { value: "merchant", label: "Merchant" },
        ],
        required: true,
      },
      {
        key: "qr_code_url",
        label: "Payment QR Code",
        label_bn: "পেমেন্ট QR কোড",
        type: "image",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "rocket",
    name: "Rocket",
    name_bn: "রকেট",
    icon: "🚀",
    description: "Pay with Rocket (DBBL) mobile wallet",
    description_bn: "রকেট (ডাচ-বাংলা) মোবাইল ওয়ালেটে পেমেন্ট করুন",
    type: "mobile",
    instructions: "Send payment to the Rocket number shown and enter transaction ID",
    instructions_bn: "প্রদর্শিত রকেট নম্বরে টাকা পাঠান এবং ট্রান্সেকশন আইডি দিন",
    configFields: [
      {
        key: "account_number",
        label: "Account Number",
        label_bn: "একাউন্ট নম্বর",
        type: "text",
        placeholder: "01XXXXXXXXX",
        required: true,
      },
      {
        key: "account_type",
        label: "Account Type",
        label_bn: "একাউন্ট টাইপ",
        type: "select",
        options: [
          { value: "personal", label: "Personal" },
          { value: "agent", label: "Agent" },
          { value: "merchant", label: "Merchant" },
        ],
        required: true,
      },
      {
        key: "qr_code_url",
        label: "Payment QR Code",
        label_bn: "পেমেন্ট QR কোড",
        type: "image",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "upay",
    name: "Upay",
    name_bn: "উপায়",
    icon: "💸",
    description: "Pay with Upay mobile wallet",
    description_bn: "উপায় মোবাইল ওয়ালেটে পেমেন্ট করুন",
    type: "mobile",
    instructions: "Send payment to the Upay number shown and enter transaction ID",
    instructions_bn: "প্রদর্শিত উপায় নম্বরে টাকা পাঠান এবং ট্রান্সেকশন আইডি দিন",
    configFields: [
      {
        key: "account_number",
        label: "Account Number",
        label_bn: "একাউন্ট নম্বর",
        type: "text",
        placeholder: "01XXXXXXXXX",
        required: true,
      },
      {
        key: "account_type",
        label: "Account Type",
        label_bn: "একাউন্ট টাইপ",
        type: "select",
        options: [
          { value: "personal", label: "Personal" },
          { value: "agent", label: "Agent" },
          { value: "merchant", label: "Merchant" },
        ],
        required: true,
      },
      {
        key: "qr_code_url",
        label: "Payment QR Code",
        label_bn: "পেমেন্ট QR কোড",
        type: "image",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  // Payment Gateways
  {
    method_id: "sslcommerz",
    name: "SSLCommerz",
    name_bn: "এসএসএল কমার্জ",
    icon: "💳",
    description: "Pay with credit/debit card via SSLCommerz",
    description_bn: "SSLCommerz এর মাধ্যমে ক্রেডিট/ডেবিট কার্ডে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Store ID / Merchant ID",
        label_bn: "স্টোর আইডি / মার্চেন্ট আইডি",
        type: "text",
        placeholder: "your_store_id",
        required: true,
      },
      {
        key: "api_key",
        label: "Store Password / API Key",
        label_bn: "স্টোর পাসওয়ার্ড / API কী",
        type: "password",
        required: true,
      },
      {
        key: "secret_key",
        label: "Secret Key",
        label_bn: "সিক্রেট কী",
        type: "password",
        required: true,
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "aamarpay",
    name: "aamarPay",
    name_bn: "আমার পে",
    icon: "💳",
    description: "Pay with aamarPay payment gateway",
    description_bn: "aamarPay পেমেন্ট গেটওয়ে দিয়ে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Store ID",
        label_bn: "স্টোর আইডি",
        type: "text",
        placeholder: "your_store_id",
        required: true,
      },
      {
        key: "api_key",
        label: "Signature Key",
        label_bn: "সিগনেচার কী",
        type: "password",
        required: true,
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "paypal",
    name: "PayPal",
    name_bn: "পেপাল",
    icon: "🅿️",
    description: "Pay with PayPal",
    description_bn: "পেপাল দিয়ে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Client ID",
        label_bn: "ক্লায়েন্ট আইডি",
        type: "text",
        placeholder: "your_client_id",
        required: true,
      },
      {
        key: "secret_key",
        label: "Client Secret",
        label_bn: "ক্লায়েন্ট সিক্রেট",
        type: "password",
        required: true,
      },
      {
        key: "test_mode",
        label: "Environment",
        label_bn: "এনভায়রনমেন্ট",
        type: "select",
        options: [
          { value: "sandbox", label: "Sandbox (Test)" },
          { value: "live", label: "Live (Production)" },
        ],
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "payoneer",
    name: "Payoneer",
    name_bn: "পেওনিয়ার",
    icon: "💳",
    description: "Pay with Payoneer card",
    description_bn: "পেওনিয়ার কার্ড দিয়ে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Partner ID",
        label_bn: "পার্টনার আইডি",
        type: "text",
        placeholder: "your_partner_id",
        required: true,
      },
      {
        key: "api_key",
        label: "API Username",
        label_bn: "API ইউজারনেম",
        type: "text",
        required: true,
      },
      {
        key: "secret_key",
        label: "API Password",
        label_bn: "API পাসওয়ার্ড",
        type: "password",
        required: true,
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  // Bank Transfer
  {
    method_id: "bank_transfer",
    name: "Bank Transfer",
    name_bn: "ব্যাংক ট্রান্সফার",
    icon: "🏦",
    description: "Pay via bank transfer",
    description_bn: "ব্যাংক ট্রান্সফারের মাধ্যমে পেমেন্ট করুন",
    type: "manual",
    instructions: "Transfer to our bank account and enter transaction reference",
    instructions_bn: "আমাদের ব্যাংক একাউন্টে টাকা ট্রান্সফার করুন এবং ট্রান্সেকশন রেফারেন্স দিন",
    configFields: [
      {
        key: "bank_accounts",
        label: "Bank Accounts",
        label_bn: "ব্যাংক একাউন্ট",
        type: "bank_accounts",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  // Manual Payment
  {
    method_id: "cod",
    name: "Cash on Delivery",
    name_bn: "ক্যাশ অন ডেলিভারি",
    icon: "💵",
    description: "Pay when you receive your order",
    description_bn: "অর্ডার গ্রহণের সময় টাকা দিন",
    type: "manual",
    instructions: "Pay the delivery person when you receive your order",
    instructions_bn: "ডেলিভারি ম্যানকে অর্ডার গ্রহণের সময় টাকা দিন",
    configFields: [
      {
        key: "cod_charge_enabled",
        label: "Enable COD Charge",
        label_bn: "COD চার্জ সক্রিয় করুন",
        type: "switch",
      },
      {
        key: "cod_charge_type",
        label: "Charge Type",
        label_bn: "চার্জের ধরন",
        type: "select",
        options: [
          { value: "fixed", label: "Fixed Amount" },
          { value: "percentage", label: "Percentage" },
        ],
        dependsOn: "cod_charge_enabled",
      },
      {
        key: "cod_charge_value",
        label: "Charge Amount",
        label_bn: "চার্জের পরিমাণ",
        type: "number",
        placeholder: "0",
        dependsOn: "cod_charge_enabled",
      },
    ],
  },
];

// System method IDs that cannot be deleted
export const SYSTEM_METHOD_IDS = ["bkash", "nagad", "rocket", "upay", "sslcommerz", "aamarpay", "paypal", "payoneer", "bank_transfer", "cod"];

// Get definition by method_id
export function getPaymentMethodDefinition(methodId: string): PaymentMethodDefinition | undefined {
  return PAYMENT_METHOD_DEFINITIONS.find((d) => d.method_id === methodId);
}

// Get methods by type
export function getPaymentMethodsByType(type: PaymentMethodDefinition["type"]): PaymentMethodDefinition[] {
  return PAYMENT_METHOD_DEFINITIONS.filter((d) => d.type === type);
}
