import { Tables, Database } from "./supabase.schema";

export type Pipeline = Tables<'pipelines'>;
export type PipelineStage = Tables<'pipeline_stages'>;
export type PipelineStageDeal = Tables<'pipeline_stage_deals'>;
export type ProductCategory = Tables<'product_categories'>;
export type Product = Tables<'products'>;
export type ProductWithCategory = Product & {
  product_categories: Pick<ProductCategory, 'name'> | null;
};
export type ProductSnapshot = Tables<'product_snapshots'>;
export type ProductSnapshotCartItem = Omit<ProductSnapshot, 'id' | 'sale_id' | 'created_at'>;

export type Sale = Tables<'sales'>;

export type ProductLowStock = Database['public']['Views']['products_low_stock']['Row'];
export type ProductLowStockTotal = Database['public']['Views']['products_low_stock_total']['Row'];
export type ProductOutOfStock = Database['public']['Views']['products_out_of_stock']['Row'];
export type ProductOutOfStockTotal = Database['public']['Views']['products_out_of_stock_total']['Row'];