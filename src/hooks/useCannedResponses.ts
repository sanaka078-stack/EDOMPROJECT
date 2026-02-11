import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut?: string;
  category?: string;
}

const CANNED_RESPONSES_KEY = "canned_responses";

export function useCannedResponses() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch canned responses from store_settings
  const fetchResponses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("setting_value")
        .eq("key", CANNED_RESPONSES_KEY)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data?.setting_value) {
        const parsed = JSON.parse(data.setting_value);
        setResponses(parsed);
      } else {
        // Set default canned responses
        const defaults: CannedResponse[] = [
          {
            id: "1",
            title: "স্বাগতম",
            content: "আসসালামু আলাইকুম! আপনাকে স্বাগতম। আমি কীভাবে সাহায্য করতে পারি?",
            shortcut: "/hello",
            category: "সাধারণ",
          },
          {
            id: "2",
            title: "অর্ডার স্ট্যাটাস",
            content: "আপনার অর্ডার নম্বর দিলে আমি অর্ডারের বর্তমান অবস্থা জানাতে পারব।",
            shortcut: "/order",
            category: "অর্ডার",
          },
          {
            id: "3",
            title: "ধন্যবাদ",
            content: "আপনাকে ধন্যবাদ! আর কোনো সাহায্য লাগলে জানাবেন।",
            shortcut: "/thanks",
            category: "সাধারণ",
          },
          {
            id: "4",
            title: "শিপিং তথ্য",
            content: "সাধারণত ঢাকার ভেতরে ১-২ দিন এবং ঢাকার বাইরে ৩-৫ দিনের মধ্যে ডেলিভারি করা হয়।",
            shortcut: "/shipping",
            category: "শিপিং",
          },
          {
            id: "5",
            title: "পেমেন্ট সমস্যা",
            content: "পেমেন্ট সংক্রান্ত সমস্যার জন্য দুঃখিত। আপনার ট্রানজেকশন আইডি দিলে আমি যাচাই করে দেখব।",
            shortcut: "/payment",
            category: "পেমেন্ট",
          },
        ];
        setResponses(defaults);
      }
    } catch (error) {
      console.error("Error fetching canned responses:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // Save canned responses
  const saveResponses = useCallback(async (newResponses: CannedResponse[]) => {
    try {
      const { error } = await supabase
        .from("store_settings")
        .upsert({
          key: CANNED_RESPONSES_KEY,
          setting_value: JSON.stringify(newResponses),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) throw error;
      setResponses(newResponses);
      return true;
    } catch (error) {
      console.error("Error saving canned responses:", error);
      toast.error("সেভ করতে সমস্যা হয়েছে");
      return false;
    }
  }, []);

  // Add new response
  const addResponse = useCallback(async (response: Omit<CannedResponse, "id">) => {
    const newResponse: CannedResponse = {
      ...response,
      id: Date.now().toString(),
    };
    const success = await saveResponses([...responses, newResponse]);
    if (success) {
      toast.success("নতুন উত্তর যোগ করা হয়েছে");
    }
    return success;
  }, [responses, saveResponses]);

  // Update response
  const updateResponse = useCallback(async (id: string, updates: Partial<CannedResponse>) => {
    const newResponses = responses.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    const success = await saveResponses(newResponses);
    if (success) {
      toast.success("আপডেট করা হয়েছে");
    }
    return success;
  }, [responses, saveResponses]);

  // Delete response
  const deleteResponse = useCallback(async (id: string) => {
    const newResponses = responses.filter((r) => r.id !== id);
    const success = await saveResponses(newResponses);
    if (success) {
      toast.success("মুছে ফেলা হয়েছে");
    }
    return success;
  }, [responses, saveResponses]);

  // Get response by shortcut
  const getByShortcut = useCallback((shortcut: string) => {
    return responses.find((r) => r.shortcut === shortcut);
  }, [responses]);

  // Get unique categories
  const categories = [...new Set(responses.map((r) => r.category).filter(Boolean))];

  return {
    responses,
    isLoading,
    categories,
    addResponse,
    updateResponse,
    deleteResponse,
    getByShortcut,
    refetch: fetchResponses,
  };
}
