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
      pipeline_stage_deals: {
        Row: {
          closed_at: string | null
          created_at: string
          customer_name: string
          email: string | null
          id: string
          is_revenue: boolean | null
          phone_number: string | null
          pipeline_stage_id: string | null
          value: number
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          customer_name: string
          email?: string | null
          id?: string
          is_revenue?: boolean | null
          phone_number?: string | null
          pipeline_stage_id?: string | null
          value: number
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          customer_name?: string
          email?: string | null
          id?: string
          is_revenue?: boolean | null
          phone_number?: string | null
          pipeline_stage_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stage_deals_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          is_revenue: boolean
          name: string
          order: number
          pipeline_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_revenue?: boolean
          name: string
          order: number
          pipeline_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_revenue?: boolean
          name?: string
          order?: number
          pipeline_id?: string
        }
        Relationships: [
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
          created_at: string
          description: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_snapshots: {
        Row: {
          created_at: string
          id: string
          name: string
          price: string
          product_id: string | null
          quantity: number
          sale_id: string
          sku: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price: string
          product_id?: string | null
          quantity: number
          sale_id: string
          sku: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_snapshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_snapshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_low_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_snapshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_out_of_stock"
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
          created_at: string
          id: string
          is_active: boolean
          minimum_stock: number | null
          name: string
          price: number
          product_category_id: string | null
          sku: string
          stock: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          minimum_stock?: number | null
          name: string
          price: number
          product_category_id?: string | null
          sku: string
          stock: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          minimum_stock?: number | null
          name?: string
          price?: number
          product_category_id?: string | null
          sku?: string
          stock?: number
        }
        Relationships: [
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
          created_at: string
          id: string
          order_number: number
          subtotal: number
          total: number
        }
        Insert: {
          applied_tax?: number
          created_at?: string
          id?: string
          order_number?: number
          subtotal: number
          total: number
        }
        Update: {
          applied_tax?: number
          created_at?: string
          id?: string
          order_number?: number
          subtotal?: number
          total?: number
        }
        Relationships: []
      }
    }
    Views: {
      products_low_stock: {
        Row: {
          created_at: string | null
          id: string | null
          minimum_stock: number | null
          name: string | null
          price: number | null
          product_category_id: string | null
          sku: string | null
          stock: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          minimum_stock?: number | null
          name?: string | null
          price?: number | null
          product_category_id?: string | null
          sku?: string | null
          stock?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          minimum_stock?: number | null
          name?: string | null
          price?: number | null
          product_category_id?: string | null
          sku?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products_low_stock_total: {
        Row: {
          count: number | null
        }
        Relationships: []
      }
      products_out_of_stock: {
        Row: {
          created_at: string | null
          id: string | null
          minimum_stock: number | null
          name: string | null
          price: number | null
          product_category_id: string | null
          sku: string | null
          stock: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          minimum_stock?: number | null
          name?: string | null
          price?: number | null
          product_category_id?: string | null
          sku?: string | null
          stock?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          minimum_stock?: number | null
          name?: string | null
          price?: number | null
          product_category_id?: string | null
          sku?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products_out_of_stock_total: {
        Row: {
          count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      process_sale: {
        Args: { applied_tax: number; cart_items: Json }
        Returns: {
          applied_tax_result: number
          order_number: number
          subtotal: number
          total: number
        }[]
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
