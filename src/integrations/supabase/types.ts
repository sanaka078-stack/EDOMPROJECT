export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          abandoned_at: string | null
          cart_items: Json
          cart_total: number
          created_at: string
          customer_email: string | null
          customer_name: string | null
          final_reminder_sent_at: string | null
          first_reminder_sent_at: string | null
          id: string
          last_activity_at: string
          recovered_at: string | null
          recovered_order_id: string | null
          reminder_sent_count: number | null
          second_reminder_sent_at: string | null
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          abandoned_at?: string | null
          cart_items: Json
          cart_total: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          final_reminder_sent_at?: string | null
          first_reminder_sent_at?: string | null
          id?: string
          last_activity_at?: string
          recovered_at?: string | null
          recovered_order_id?: string | null
          reminder_sent_count?: number | null
          second_reminder_sent_at?: string | null
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          abandoned_at?: string | null
          cart_items?: Json
          cart_total?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          final_reminder_sent_at?: string | null
          first_reminder_sent_at?: string | null
          id?: string
          last_activity_at?: string
          recovered_at?: string | null
          recovered_order_id?: string | null
          reminder_sent_count?: number | null
          second_reminder_sent_at?: string | null
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      account_lockouts: {
        Row: {
          created_at: string
          email: string
          failed_attempts: number | null
          id: string
          is_unlocked: boolean
          reason: string | null
          unlock_at: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failed_attempts?: number | null
          id?: string
          is_unlocked?: boolean
          reason?: string | null
          unlock_at: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failed_attempts?: number | null
          id?: string
          is_unlocked?: boolean
          reason?: string | null
          unlock_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_presence: {
        Row: {
          created_at: string
          id: string
          is_online: boolean | null
          last_seen_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auto_discount_rules: {
        Row: {
          conditions: Json | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_purchase: number | null
          name: string
          priority: number | null
          rule_type: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          name: string
          priority?: number | null
          rule_type: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          name?: string
          priority?: number | null
          rule_type?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      auto_reply_settings: {
        Row: {
          created_at: string
          delay_seconds: number | null
          id: string
          is_enabled: boolean | null
          message: string | null
          schedule: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delay_seconds?: number | null
          id?: string
          is_enabled?: boolean | null
          message?: string | null
          schedule?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delay_seconds?: number | null
          id?: string
          is_enabled?: boolean | null
          message?: string | null
          schedule?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_by: string | null
          blocked_until: string | null
          created_at: string
          created_by: string | null
          id: string
          ip_address: string
          is_permanent: boolean | null
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ip_address: string
          is_permanent?: boolean | null
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ip_address?: string
          is_permanent?: boolean | null
          reason?: string | null
        }
        Relationships: []
      }
      blocked_login_attempts: {
        Row: {
          blocked_until: string | null
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          is_permanent: boolean | null
          reason: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          is_permanent?: boolean | null
          reason?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          is_permanent?: boolean | null
          reason?: string | null
        }
        Relationships: []
      }
      canned_responses: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          shortcut: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          shortcut?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          shortcut?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_message_replies: {
        Row: {
          created_at: string
          id: string
          message_id: string
          recipient_email: string | null
          replied_by: string | null
          reply_content: string
          reply_subject: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          recipient_email?: string | null
          replied_by?: string | null
          reply_content: string
          reply_subject?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          recipient_email?: string | null
          replied_by?: string | null
          reply_content?: string
          reply_subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_message_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          first_response_at: string | null
          id: string
          is_read: boolean | null
          last_name: string | null
          message: string
          name: string | null
          phone: string | null
          replied_at: string | null
          replied_by: string | null
          response_time_seconds: number | null
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          first_response_at?: string | null
          id?: string
          is_read?: boolean | null
          last_name?: string | null
          message: string
          name?: string | null
          phone?: string | null
          replied_at?: string | null
          replied_by?: string | null
          response_time_seconds?: number | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          first_response_at?: string | null
          id?: string
          is_read?: boolean | null
          last_name?: string | null
          message?: string
          name?: string | null
          phone?: string | null
          replied_at?: string | null
          replied_by?: string | null
          response_time_seconds?: number | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          discount_applied: number | null
          id: string
          order_id: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_applied?: number | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_applied?: number | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_categories: Json | null
          applicable_products: Json | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          first_order_only: boolean | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          maximum_discount: number | null
          minimum_order_amount: number | null
          starts_at: string | null
          title: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number | null
          user_limit: number | null
        }
        Insert: {
          applicable_categories?: Json | null
          applicable_products?: Json | null
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          first_order_only?: boolean | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          maximum_discount?: number | null
          minimum_order_amount?: number | null
          starts_at?: string | null
          title?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          user_limit?: number | null
        }
        Update: {
          applicable_categories?: Json | null
          applicable_products?: Json | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          first_order_only?: boolean | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          maximum_discount?: number | null
          minimum_order_amount?: number | null
          starts_at?: string | null
          title?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          user_limit?: number | null
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "live_chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: Json | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          average_order_value: number | null
          conversion_rate: number | null
          created_at: string
          date: string
          id: string
          new_customers: number | null
          page_views: number | null
          total_orders: number | null
          total_revenue: number | null
          unique_visitors: number | null
          updated_at: string
        }
        Insert: {
          average_order_value?: number | null
          conversion_rate?: number | null
          created_at?: string
          date: string
          id?: string
          new_customers?: number | null
          page_views?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          unique_visitors?: number | null
          updated_at?: string
        }
        Update: {
          average_order_value?: number | null
          conversion_rate?: number | null
          created_at?: string
          date?: string
          id?: string
          new_customers?: number | null
          page_views?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          unique_visitors?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      database_backups: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          file_format: string
          file_path: string
          file_size: number | null
          id: string
          started_at: string | null
          status: string
          tables_included: string[]
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_format: string
          file_path: string
          file_size?: number | null
          id?: string
          started_at?: string | null
          status?: string
          tables_included: string[]
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_format?: string
          file_path?: string
          file_size?: number | null
          id?: string
          started_at?: string | null
          status?: string
          tables_included?: string[]
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string | null
          body_text: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          slug: string | null
          subject: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          slug?: string | null
          subject: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string | null
          subject?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      enabled_payment_methods: {
        Row: {
          account_details: Json | null
          code: string
          created_at: string
          description: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          logo_url: string | null
          method_id: string
          name: string
          name_bn: string | null
          sort_order: number | null
          supports_verification: boolean | null
          updated_at: string
        }
        Insert: {
          account_details?: Json | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          method_id: string
          name: string
          name_bn?: string | null
          sort_order?: number | null
          supports_verification?: boolean | null
          updated_at?: string
        }
        Update: {
          account_details?: Json | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          method_id?: string
          name?: string
          name_bn?: string | null
          sort_order?: number | null
          supports_verification?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempt_count: number | null
          created_at: string
          email: string
          id: string
          ip_address: string | null
          last_attempt_at: string | null
          reason: string | null
          user_agent: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          last_attempt_at?: string | null
          reason?: string | null
          user_agent?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          last_attempt_at?: string | null
          reason?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      geo_blocking_rules: {
        Row: {
          country_code: string
          country_name: string | null
          created_at: string
          created_by: string | null
          id: string
          is_blocked: boolean | null
          reason: string | null
          updated_at: string | null
        }
        Insert: {
          country_code: string
          country_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_blocked?: boolean | null
          reason?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_blocked?: boolean | null
          reason?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          quantity_change: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_rate_limit_settings: {
        Row: {
          block_duration_seconds: number | null
          created_at: string
          endpoint: string | null
          id: string
          is_enabled: boolean | null
          max_requests: number | null
          setting_key: string
          time_window_seconds: number | null
          updated_at: string
          window_seconds: number | null
        }
        Insert: {
          block_duration_seconds?: number | null
          created_at?: string
          endpoint?: string | null
          id?: string
          is_enabled?: boolean | null
          max_requests?: number | null
          setting_key: string
          time_window_seconds?: number | null
          updated_at?: string
          window_seconds?: number | null
        }
        Update: {
          block_duration_seconds?: number | null
          created_at?: string
          endpoint?: string | null
          id?: string
          is_enabled?: boolean | null
          max_requests?: number | null
          setting_key?: string
          time_window_seconds?: number | null
          updated_at?: string
          window_seconds?: number | null
        }
        Relationships: []
      }
      ip_rate_limits: {
        Row: {
          blocked_until: string | null
          created_at: string
          endpoint: string | null
          id: string
          ip_address: string
          is_blocked: boolean | null
          request_count: number | null
          updated_at: string
          window_start: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          ip_address: string
          is_blocked?: boolean | null
          request_count?: number | null
          updated_at?: string
          window_start?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          ip_address?: string
          is_blocked?: boolean | null
          request_count?: number | null
          updated_at?: string
          window_start?: string | null
        }
        Relationships: []
      }
      live_chat_conversations: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          customer_avatar: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          first_response_at: string | null
          id: string
          notes: string | null
          priority: string | null
          response_time_seconds: number | null
          status: string
          subject: string | null
          tags: string[] | null
          unread_count: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          customer_avatar?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          first_response_at?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          response_time_seconds?: number | null
          status?: string
          subject?: string | null
          tags?: string[] | null
          unread_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          customer_avatar?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          first_response_at?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          response_time_seconds?: number | null
          status?: string
          subject?: string | null
          tags?: string[] | null
          unread_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      live_chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender: string | null
          sender_id: string | null
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_type: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "live_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      login_activity: {
        Row: {
          created_at: string
          device_info: Json | null
          email: string | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          location: string | null
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          status: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tracking: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          discount_amount: number | null
          gift_message: string | null
          id: string
          is_gift: boolean | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          payment_verification_notes: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string
          subtotal: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          gift_message?: string | null
          id?: string
          is_gift?: boolean | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          payment_verification_notes?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          gift_message?: string | null
          id?: string
          is_gift?: boolean | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          payment_verification_notes?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      pathao_settings: {
        Row: {
          access_token: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string
          default_store_id: string | null
          id: string
          is_enabled: boolean | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          default_store_id?: string | null
          id?: string
          is_enabled?: boolean | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          default_store_id?: string | null
          id?: string
          is_enabled?: boolean | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_details: Json | null
          code: string
          config: Json | null
          created_at: string
          description: string | null
          display_name: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          is_manual: boolean | null
          logo_url: string | null
          name: string
          sort_order: number | null
          supports_verification: boolean | null
          updated_at: string
        }
        Insert: {
          account_details?: Json | null
          code: string
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_manual?: boolean | null
          logo_url?: string | null
          name: string
          sort_order?: number | null
          supports_verification?: boolean | null
          updated_at?: string
        }
        Update: {
          account_details?: Json | null
          code?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_manual?: boolean | null
          logo_url?: string | null
          name?: string
          sort_order?: number | null
          supports_verification?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      product_inventory: {
        Row: {
          created_at: string
          id: string
          low_stock_threshold: number | null
          product_id: string
          quantity: number | null
          sku: string | null
          updated_at: string
          variant_id: string | null
          warehouse_location: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          product_id: string
          quantity?: number | null
          sku?: string | null
          updated_at?: string
          variant_id?: string | null
          warehouse_location?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          product_id?: string
          quantity?: number | null
          sku?: string | null
          updated_at?: string
          variant_id?: string | null
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          content: string | null
          created_at: string
          customer_name: string | null
          id: string
          is_approved: boolean | null
          is_verified: boolean | null
          product_id: string
          rating: number
          review_text: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          product_id: string
          rating: number
          review_text?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          product_id?: string
          rating?: number
          review_text?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          options: Json | null
          price: number | null
          product_id: string
          quantity: number | null
          sku: string | null
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          options?: Json | null
          price?: number | null
          product_id: string
          quantity?: number | null
          sku?: string | null
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          options?: Json | null
          price?: number | null
          product_id?: string
          quantity?: number | null
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          description: string | null
          dimensions: Json | null
          id: string
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          name: string
          price: number
          quantity: number
          sku: string | null
          slug: string
          tags: string[] | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          price?: number
          quantity?: number
          sku?: string | null
          slug: string
          tags?: string[] | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          quantity?: number
          sku?: string | null
          slug?: string
          tags?: string[] | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          language_preference: string | null
          notify_account_activity: boolean | null
          notify_new_arrivals: boolean | null
          notify_order_delivered: boolean | null
          notify_order_shipped: boolean | null
          notify_order_updates: boolean | null
          notify_price_drops: boolean | null
          notify_promotions: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          language_preference?: string | null
          notify_account_activity?: boolean | null
          notify_new_arrivals?: boolean | null
          notify_order_delivered?: boolean | null
          notify_order_shipped?: boolean | null
          notify_order_updates?: boolean | null
          notify_price_drops?: boolean | null
          notify_promotions?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          language_preference?: string | null
          notify_account_activity?: boolean | null
          notify_new_arrivals?: boolean | null
          notify_order_delivered?: boolean | null
          notify_order_shipped?: boolean | null
          notify_order_updates?: boolean | null
          notify_price_drops?: boolean | null
          notify_promotions?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quick_replies: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          shortcut: string | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          shortcut?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          shortcut?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      recovery_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          created_at: string
          id: string
          last_password_change: string | null
          login_notification: boolean | null
          password_expires_days: number | null
          require_2fa: boolean | null
          session_timeout_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_password_change?: string | null
          login_notification?: boolean | null
          password_expires_days?: number | null
          require_2fa?: boolean | null
          session_timeout_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_password_change?: string | null
          login_notification?: boolean | null
          password_expires_days?: number | null
          require_2fa?: boolean | null
          session_timeout_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          consignment_id: string | null
          courier: string
          courier_response: Json | null
          created_at: string
          delivered_at: string | null
          id: string
          order_id: string
          shipped_at: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          consignment_id?: string | null
          courier: string
          courier_response?: Json | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id: string
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          consignment_id?: string | null
          courier?: string
          courier_response?: Json | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id?: string
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          max_days: number | null
          max_order_amount: number | null
          max_weight: number | null
          min_days: number | null
          min_order_amount: number | null
          min_weight: number | null
          name: string
          rate: number
          rate_type: string | null
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_days?: number | null
          max_order_amount?: number | null
          max_weight?: number | null
          min_days?: number | null
          min_order_amount?: number | null
          min_weight?: number | null
          name: string
          rate: number
          rate_type?: string | null
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_days?: number | null
          max_order_amount?: number | null
          max_weight?: number | null
          min_days?: number | null
          min_order_amount?: number | null
          min_weight?: number | null
          name?: string
          rate?: number
          rate_type?: string | null
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          countries: string[] | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          regions: string[] | null
          updated_at: string
        }
        Insert: {
          countries?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          regions?: string[] | null
          updated_at?: string
        }
        Update: {
          countries?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          regions?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      steadfast_settings: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          is_enabled: boolean | null
          secret_key: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret_key?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          setting_value: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          setting_value?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          setting_value?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          description: string
          first_response_at: string | null
          id: string
          order_id: string | null
          priority: string | null
          resolved_at: string | null
          response_time_seconds: number | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          description: string
          first_response_at?: string | null
          id?: string
          order_id?: string | null
          priority?: string | null
          resolved_at?: string | null
          response_time_seconds?: number | null
          status?: string | null
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          description?: string
          first_response_at?: string | null
          id?: string
          order_id?: string | null
          priority?: string | null
          resolved_at?: string | null
          response_time_seconds?: number | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal: boolean | null
          message: string
          sender_name: string | null
          sender_type: string | null
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message: string
          sender_name?: string | null
          sender_type?: string | null
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message?: string
          sender_name?: string | null
          sender_type?: string | null
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_id: string
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          last_used_at: string | null
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          last_used_at?: string | null
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          last_used_at?: string | null
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      two_factor_auth: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean | null
          secret: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          area: string | null
          city: string
          country: string | null
          created_at: string
          full_name: string
          id: string
          is_default: boolean | null
          label: string | null
          phone: string
          postal_code: string | null
          street_address: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string | null
          city: string
          country?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          phone: string
          postal_code?: string | null
          street_address: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string | null
          city?: string
          country?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          phone?: string
          postal_code?: string | null
          street_address?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          is_current: boolean | null
          last_active_at: string | null
          last_activity_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          is_current?: boolean | null
          last_active_at?: string | null
          last_activity_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          is_current?: boolean | null
          last_active_at?: string | null
          last_activity_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_db_functions: {
        Args: never
        Returns: {
          data_type: string
          routine_definition: string
          routine_name: string
          routine_type: string
        }[]
      }
      get_db_triggers: {
        Args: never
        Returns: {
          action_statement: string
          action_timing: string
          event_manipulation: string
          event_object_table: string
          trigger_name: string
        }[]
      }
      get_enum_types: {
        Args: never
        Returns: {
          enumlabel: string
          typname: string
        }[]
      }
      get_rls_policies: {
        Args: never
        Returns: {
          cmd: string
          permissive: string
          policyname: string
          qual: string
          roles: string[]
          schemaname: string
          tablename: string
          with_check: string
        }[]
      }
      get_table_columns: {
        Args: never
        Returns: {
          character_maximum_length: number
          column_default: string
          column_name: string
          data_type: string
          is_nullable: string
          table_name: string
          udt_name: string
        }[]
      }
      get_table_constraints: {
        Args: never
        Returns: {
          column_name: string
          constraint_name: string
          constraint_type: string
          foreign_column_name: string
          foreign_table_name: string
          table_name: string
        }[]
      }
      get_table_indexes: {
        Args: never
        Returns: {
          indexdef: string
          indexname: string
          tablename: string
        }[]
      }
      has_admin_role: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "support" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "support", "user"],
    },
  },
} as const
