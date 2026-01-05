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
      businesses: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          email: string | null
          id: number
          is_active: boolean
          name: string
          owner_id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          name: string
          owner_id: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          name?: string
          owner_id?: string
          phone?: string | null
        }
        Relationships: []
      }
      pipeline_stage_leads: {
        Row: {
          business_id: number
          closed_at: string | null
          created_at: string
          customer_name: string
          email: string | null
          id: number
          is_active: boolean
          is_revenue: boolean | null
          phone_number: string | null
          pipeline_stage_id: number | null
          value: number
          whatsapp_conversation_id: string | null
        }
        Insert: {
          business_id: number
          closed_at?: string | null
          created_at?: string
          customer_name: string
          email?: string | null
          id?: number
          is_active?: boolean
          is_revenue?: boolean | null
          phone_number?: string | null
          pipeline_stage_id?: number | null
          value: number
          whatsapp_conversation_id?: string | null
        }
        Update: {
          business_id?: number
          closed_at?: string | null
          created_at?: string
          customer_name?: string
          email?: string | null
          id?: number
          is_active?: boolean
          is_revenue?: boolean | null
          phone_number?: string | null
          pipeline_stage_id?: number | null
          value?: number
          whatsapp_conversation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stage_leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stage_leads_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          business_id: number
          color: string
          created_at: string
          id: number
          is_active: boolean
          is_input: boolean
          is_revenue: boolean
          name: string
          order: number
          pipeline_id: number
          webhook_url: string | null
        }
        Insert: {
          business_id: number
          color: string
          created_at?: string
          id?: number
          is_active?: boolean
          is_input?: boolean
          is_revenue?: boolean
          name: string
          order: number
          pipeline_id: number
          webhook_url?: string | null
        }
        Update: {
          business_id?: number
          color?: string
          created_at?: string
          id?: number
          is_active?: boolean
          is_input?: boolean
          is_revenue?: boolean
          name?: string
          order?: number
          pipeline_id?: number
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          business_id: number
          created_at: string
          description: string
          id: number
          is_active: boolean
          name: string
          whatsapp_is_enabled: boolean
          whatsapp_number: string | null
          whatsapp_phone_number_id: string | null
        }
        Insert: {
          business_id: number
          created_at?: string
          description: string
          id?: number
          is_active?: boolean
          name: string
          whatsapp_is_enabled?: boolean
          whatsapp_number?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Update: {
          business_id?: number
          created_at?: string
          description?: string
          id?: number
          is_active?: boolean
          name?: string
          whatsapp_is_enabled?: boolean
          whatsapp_number?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          business_id: number
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
        }
        Insert: {
          business_id: number
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
        }
        Update: {
          business_id?: number
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_snapshots: {
        Row: {
          business_id: number
          created_at: string
          id: number
          is_active: boolean
          name: string
          price: string
          product_id: number | null
          quantity: number
          sale_id: number
          sku: string
        }
        Insert: {
          business_id: number
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          price: string
          product_id?: number | null
          quantity: number
          sale_id: number
          sku: string
        }
        Update: {
          business_id?: number
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          price?: string
          product_id?: number | null
          quantity?: number
          sale_id?: number
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_snapshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_snapshots_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: number
          created_at: string
          id: number
          is_active: boolean
          minimum_stock: number | null
          name: string
          price: number
          product_category_id: number | null
          sku: string
          stock: number
        }
        Insert: {
          business_id: number
          created_at?: string
          id?: number
          is_active?: boolean
          minimum_stock?: number | null
          name: string
          price: number
          product_category_id?: number | null
          sku: string
          stock?: number
        }
        Update: {
          business_id?: number
          created_at?: string
          id?: number
          is_active?: boolean
          minimum_stock?: number | null
          name?: string
          price?: number
          product_category_id?: number | null
          sku?: string
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          applied_tax: number
          business_id: number
          created_at: string
          id: number
          is_active: boolean
          is_open: boolean
          lead_id: number | null
          order_number: number
          subtotal: number
          total: number
        }
        Insert: {
          applied_tax?: number
          business_id: number
          created_at?: string
          id?: number
          is_active?: boolean
          is_open?: boolean
          lead_id?: number | null
          order_number: number
          subtotal?: number
          total?: number
        }
        Update: {
          applied_tax?: number
          business_id?: number
          created_at?: string
          id?: number
          is_active?: boolean
          is_open?: boolean
          lead_id?: number | null
          order_number?: number
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stage_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          key: string
          key_index: number
          last_rotated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          key: string
          key_index: number
          last_rotated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          key?: string
          key_index?: number
          last_rotated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_api_keys_view: {
        Row: {
          created_at: string | null
          id: number | null
          is_active: boolean | null
          key: string | null
          key_index: number | null
          last_rotated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number | null
          is_active?: boolean | null
          key?: never
          key_index?: number | null
          last_rotated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number | null
          is_active?: boolean | null
          key?: never
          key_index?: number | null
          last_rotated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_secure_key: { Args: never; Returns: string }
      generate_user_api_keys: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      get_products_low_stock: {
        Args: { p_business_id: number }
        Returns: {
          business_id: number
          created_at: string
          id: number
          is_active: boolean
          minimum_stock: number
          name: string
          price: number
          product_category_id: number
          sku: string
          stock: number
        }[]
      }
      get_products_low_stock_total: {
        Args: { p_business_id: number }
        Returns: number
      }
      get_products_out_of_stock: {
        Args: { p_business_id: number }
        Returns: {
          business_id: number
          created_at: string
          id: number
          is_active: boolean
          minimum_stock: number
          name: string
          price: number
          product_category_id: number
          sku: string
          stock: number
        }[]
      }
      get_products_out_of_stock_total: {
        Args: { p_business_id: number }
        Returns: number
      }
      get_user_api_key: { Args: { p_key_index: number }; Returns: string }
      initialize_api_keys: { Args: never; Returns: boolean }
      process_sale: {
        Args: { applied_tax: number; cart_items: Json; p_business_id: number }
        Returns: {
          applied_tax_result: number
          order_number: number
          subtotal: number
          total: number
        }[]
      }
      rotate_user_api_key:
        | { Args: { p_key_index: number }; Returns: string }
        | { Args: { p_key_index: number; p_user_id: string }; Returns: string }
      validate_user_business_access: {
        Args: { p_business_id: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
