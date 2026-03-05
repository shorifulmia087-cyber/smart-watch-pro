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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      courier_settings: {
        Row: {
          api_key: string | null
          api_secret: string | null
          created_at: string
          id: string
          is_active: boolean
          is_sandbox: boolean
          production_api_key: string | null
          production_api_secret: string | null
          provider: string
          sandbox_api_key: string | null
          sandbox_api_secret: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          production_api_key?: string | null
          production_api_secret?: string | null
          provider: string
          sandbox_api_key?: string | null
          sandbox_api_secret?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          production_api_key?: string | null
          production_api_secret?: string | null
          provider?: string
          sandbox_api_key?: string | null
          sandbox_api_secret?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          courier_booked: boolean
          courier_provider: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          delivery_charge: number
          delivery_location: string
          id: string
          payment_method: string
          phone: string
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          tracking_id: string | null
          trx_id: string | null
          watch_model: string
        }
        Insert: {
          address: string
          courier_booked?: boolean
          courier_provider?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          delivery_charge?: number
          delivery_location?: string
          id?: string
          payment_method: string
          phone: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          tracking_id?: string | null
          trx_id?: string | null
          watch_model: string
        }
        Update: {
          address?: string
          courier_booked?: boolean
          courier_provider?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          delivery_charge?: number
          delivery_location?: string
          id?: string
          payment_method?: string
          phone?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          tracking_id?: string | null
          trx_id?: string | null
          watch_model?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description_list: string[]
          discount_percent: number
          features: Json
          id: string
          image_urls: string[]
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          price: number
          product_type: string
          sort_order: number
          sourcing_cost: number
          stock_status: string
          subtitle: string | null
          thumbnail_url: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description_list?: string[]
          discount_percent?: number
          features?: Json
          id?: string
          image_urls?: string[]
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          price: number
          product_type?: string
          sort_order?: number
          sourcing_cost?: number
          stock_status?: string
          subtitle?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description_list?: string[]
          discount_percent?: number
          features?: Json
          id?: string
          image_urls?: string[]
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          price?: number
          product_type?: string
          sort_order?: number
          sourcing_cost?: number
          stock_status?: string
          subtitle?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      review_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          announcement_text: string
          bkash_number: string
          brand_name: string
          brand_tagline: string
          collection_section_title: string
          countdown_hours: number
          delivery_charge_inside: number
          delivery_charge_outside: number
          discount_percent: number
          features_section_title: string
          footer_cta_subtitle: string
          footer_cta_title: string
          footer_text: string
          hero_subtitle: string
          id: string
          logo_url: string | null
          nagad_number: string
          online_payment_enabled: boolean
          primary_color: string
          product_type: string
          rocket_number: string
          timer_enabled: boolean
          updated_at: string
          video_section_title: string
          whatsapp_number: string
        }
        Insert: {
          announcement_text?: string
          bkash_number?: string
          brand_name?: string
          brand_tagline?: string
          collection_section_title?: string
          countdown_hours?: number
          delivery_charge_inside?: number
          delivery_charge_outside?: number
          discount_percent?: number
          features_section_title?: string
          footer_cta_subtitle?: string
          footer_cta_title?: string
          footer_text?: string
          hero_subtitle?: string
          id?: string
          logo_url?: string | null
          nagad_number?: string
          online_payment_enabled?: boolean
          primary_color?: string
          product_type?: string
          rocket_number?: string
          timer_enabled?: boolean
          updated_at?: string
          video_section_title?: string
          whatsapp_number?: string
        }
        Update: {
          announcement_text?: string
          bkash_number?: string
          brand_name?: string
          brand_tagline?: string
          collection_section_title?: string
          countdown_hours?: number
          delivery_charge_inside?: number
          delivery_charge_outside?: number
          discount_percent?: number
          features_section_title?: string
          footer_cta_subtitle?: string
          footer_cta_title?: string
          footer_text?: string
          hero_subtitle?: string
          id?: string
          logo_url?: string | null
          nagad_number?: string
          online_payment_enabled?: boolean
          primary_color?: string
          product_type?: string
          rocket_number?: string
          timer_enabled?: boolean
          updated_at?: string
          video_section_title?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "completed"
        | "cancelled"
        | "returned"
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
      app_role: ["admin", "user"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "completed",
        "cancelled",
        "returned",
      ],
    },
  },
} as const
