import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaymentMethodDefinition, BankAccount } from "@/data/paymentMethodDefinitions";

export interface EnabledPaymentMethod {
  id: string;
  method_id: string;
  code: string;
  name: string;
  name_bn: string;
  icon: string;
  logo_url: string | null;
  qr_code_url: string | null;
  description: string;
  account_number: string | null;
  account_type: string | null;
  display_order: number;
  instructions?: string;
  instructions_bn?: string;
  // COD charge settings
  cod_charge_enabled: boolean;
  cod_charge_type: "fixed" | "percentage" | null;
  cod_charge_value: number;
  // Bank accounts
  bank_accounts: BankAccount[];
  type: "mobile" | "gateway" | "manual" | "custom";
}

export function useEnabledPaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<EnabledPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnabledMethods = async () => {
      try {
        const { data, error } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");

        if (error) throw error;

        // Merge with hardcoded definitions
        const methods: EnabledPaymentMethod[] = (data || []).map((config: any) => {
          const methodId = config.code || config.name;
          const definition = getPaymentMethodDefinition(methodId);
          
          // Parse bank accounts from account_details
          let bankAccounts: BankAccount[] = [];
          try {
            if (config.account_details) {
              const details = typeof config.account_details === 'string' 
                ? JSON.parse(config.account_details) 
                : config.account_details;
              if (details.bank_accounts) {
                bankAccounts = details.bank_accounts;
              }
            }
          } catch {
            bankAccounts = [];
          }
          
          // Parse COD charge settings from config
          let codChargeEnabled = false;
          let codChargeType: "fixed" | "percentage" | null = null;
          let codChargeValue = 0;
          try {
            if (config.config) {
              const cfg = typeof config.config === 'string' 
                ? JSON.parse(config.config) 
                : config.config;
              codChargeEnabled = cfg.cod_charge_enabled === true || cfg.cod_charge_enabled === "true";
              codChargeType = cfg.cod_charge_type || null;
              codChargeValue = parseFloat(cfg.cod_charge_value || "0") || 0;
            }
          } catch {
            // ignore
          }

          // Parse account details
          let accountNumber: string | null = null;
          let accountType: string | null = null;
          let qrCodeUrl: string | null = null;
          try {
            if (config.account_details) {
              const details = typeof config.account_details === 'string' 
                ? JSON.parse(config.account_details) 
                : config.account_details;
              accountNumber = details.account_number || null;
              accountType = details.account_type || null;
              qrCodeUrl = details.qr_code_url || null;
            }
          } catch {
            // ignore
          }
          
          return {
            id: config.id,
            method_id: methodId,
            code: config.code,
            name: definition?.name || config.name || methodId,
            name_bn: definition?.name_bn || config.name_bn || methodId,
            icon: definition?.icon || "💳",
            logo_url: config.logo_url,
            qr_code_url: qrCodeUrl,
            description: definition?.description || config.description || "Custom payment method",
            account_number: accountNumber,
            account_type: accountType,
            display_order: config.sort_order || 0,
            instructions: definition?.instructions || config.instructions,
            instructions_bn: definition?.instructions_bn,
            cod_charge_enabled: codChargeEnabled,
            cod_charge_type: codChargeType,
            cod_charge_value: codChargeValue,
            bank_accounts: bankAccounts,
            type: definition?.type || "custom",
          };
        });

        setPaymentMethods(methods);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        setPaymentMethods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnabledMethods();
  }, []);

  return { paymentMethods, loading };
}
