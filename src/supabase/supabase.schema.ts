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
      business_employee_oauth_connections: {
        Row: {
          access_token: string
          application_id: string
          business_employee_id: number
          business_id: number
          created_at: string
          id: number
          provider_email: string | null
          provider_user_id: string | null
          refresh_token: string | null
          scope: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          application_id: string
          business_employee_id: number
          business_id: number
          created_at?: string
          id?: number
          provider_email?: string | null
          provider_user_id?: string | null
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          application_id?: string
          business_employee_id?: number
          business_id?: number
          created_at?: string
          id?: number
          provider_email?: string | null
          provider_user_id?: string | null
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_employee_oauth_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_employee_oauth_connections_employee_id_fkey"
            columns: ["business_employee_id"]
            isOneToOne: false
            referencedRelation: "business_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      business_employees: {
        Row: {
          business_id: number
          created_at: string
          email: string
          employee_type: Database["public"]["Enums"]["business_employee_type"]
          id: number
          is_active: boolean
          user_id: string
        }
        Insert: {
          business_id: number
          created_at?: string
          email: string
          employee_type: Database["public"]["Enums"]["business_employee_type"]
          id?: number
          is_active?: boolean
          user_id: string
        }
        Update: {
          business_id?: number
          created_at?: string
          email?: string
          employee_type?: Database["public"]["Enums"]["business_employee_type"]
          id?: number
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
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
          business_employee_id: number | null
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
          business_employee_id?: number | null
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
          business_employee_id?: number | null
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
            foreignKeyName: "pipeline_stage_leads_business_employee_id_fkey"
            columns: ["business_employee_id"]
            isOneToOne: false
            referencedRelation: "business_employees"
            referencedColumns: ["id"]
          },
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
          description: string | null
          id: number
          is_active: boolean
          is_input: boolean
          is_revenue: boolean
          name: string
          pipeline_id: number
          position: number
          webhook_url: string | null
        }
        Insert: {
          business_id: number
          color: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_input?: boolean
          is_revenue?: boolean
          name: string
          pipeline_id: number
          position: number
          webhook_url?: string | null
        }
        Update: {
          business_id?: number
          color?: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_input?: boolean
          is_revenue?: boolean
          name?: string
          pipeline_id?: number
          position?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_business_employee: {
        Args: { p_business_id: number; p_user_id: string }
        Returns: undefined
      }
      add_business_employee: {
        Args: { p_business_id: number; p_user_email: string }
        Returns: undefined
      }
      create_new_business: {
        Args: {
          p_address: string
          p_description: string
          p_email: string
          p_name: string
          p_phone: string
        }
        Returns: undefined
      }
      deactivate_business_employee: {
        Args: { p_business_id: number; p_user_id: string }
        Returns: undefined
      }
      get_my_business_employee_id_by_business: {
        Args: { p_business_id: number }
        Returns: number
      }
      is_business_member: { Args: { p_business_id: number }; Returns: boolean }
      is_business_owner: { Args: { p_business_id: number }; Returns: boolean }
    }
    Enums: {
      business_employee_type: "owner" | "salesperson"
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
      business_employee_type: ["owner", "salesperson"],
    },
  },
} as const
