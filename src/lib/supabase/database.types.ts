// Tự sinh từ schema Supabase (mcp generate_typescript_types). Không sửa tay —
// chạy lại lệnh sinh type khi schema đổi.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          brand_id: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          brand_id?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          brand_id?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      inventory_levels: {
        Row: {
          bar_stock: number
          expiry_date: string | null
          kho_stock: number
          material_id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          bar_stock?: number
          expiry_date?: string | null
          kho_stock?: number
          material_id: string
          store_id: string
          updated_at?: string
        }
        Update: {
          bar_stock?: number
          expiry_date?: string | null
          kho_stock?: number
          material_id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_levels_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          brand_id: string
          code: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          brand_id: string
          code: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          brand_id?: string
          code?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      material_prices: {
        Row: {
          material_id: string
          unit_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          material_id: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          material_id?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_prices_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_prices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          brand_id: string
          category_id: string
          convert_factor: number
          created_at: string
          id: string
          is_active: boolean
          min_stock: number
          name: string
          unit_bar_id: string
          unit_kho_id: string
        }
        Insert: {
          brand_id: string
          category_id: string
          convert_factor?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_stock?: number
          name: string
          unit_bar_id: string
          unit_kho_id: string
        }
        Update: {
          brand_id?: string
          category_id?: string
          convert_factor?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_stock?: number
          name?: string
          unit_bar_id?: string
          unit_kho_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_unit_bar_id_fkey"
            columns: ["unit_bar_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_unit_kho_id_fkey"
            columns: ["unit_kho_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          brand_id: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          address?: string | null
          brand_id: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          address?: string | null
          brand_id?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number | null
          bar_quantity: number | null
          bar_stock_after: number | null
          bar_stock_before: number | null
          bar_unit_code: string | null
          created_at: string
          created_by: string
          id: string
          material_id: string
          note: string | null
          quantity: number
          stock_after: number
          stock_before: number
          store_id: string
          type: Database["public"]["Enums"]["transaction_type"]
          unit_code: string
          unit_price: number | null
        }
        Insert: {
          amount?: number | null
          bar_quantity?: number | null
          bar_stock_after?: number | null
          bar_stock_before?: number | null
          bar_unit_code?: string | null
          created_at?: string
          created_by: string
          id?: string
          material_id: string
          note?: string | null
          quantity: number
          stock_after: number
          stock_before: number
          store_id: string
          type: Database["public"]["Enums"]["transaction_type"]
          unit_code: string
          unit_price?: number | null
        }
        Update: {
          amount?: number | null
          bar_quantity?: number | null
          bar_stock_after?: number | null
          bar_stock_before?: number | null
          bar_unit_code?: string | null
          created_at?: string
          created_by?: string
          id?: string
          material_id?: string
          note?: string | null
          quantity?: number
          stock_after?: number
          stock_before?: number
          store_id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          unit_code?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          base_factor: number
          code: string
          dimension: Database["public"]["Enums"]["unit_dimension"]
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          base_factor?: number
          code: string
          dimension: Database["public"]["Enums"]["unit_dimension"]
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          base_factor?: number
          code?: string
          dimension?: Database["public"]["Enums"]["unit_dimension"]
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      user_brands: {
        Row: {
          brand_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_brands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stores: {
        Row: {
          created_at: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          p_brand_id?: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_store_id?: string
          p_target_user: string
        }
        Returns: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
      }
      auth_accessible_store_ids: { Args: Record<string, never>; Returns: string[] }
      auth_can_view_price: { Args: Record<string, never>; Returns: boolean }
      auth_is_admin: { Args: Record<string, never>; Returns: boolean }
      auth_is_approved: { Args: Record<string, never>; Returns: boolean }
      auth_managed_brand_ids: { Args: Record<string, never>; Returns: string[] }
      auth_readable_brand_ids: { Args: Record<string, never>; Returns: string[] }
      auth_role: {
        Args: Record<string, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      record_bar_count: {
        Args: {
          p_counted: number
          p_material_id: string
          p_note?: string
          p_store_id: string
        }
        Returns: Database["public"]["Tables"]["transactions"]["Row"]
      }
      record_issue_to_bar: {
        Args: {
          p_material_id: string
          p_note?: string
          p_quantity: number
          p_store_id: string
        }
        Returns: Database["public"]["Tables"]["transactions"]["Row"]
      }
      record_receipt: {
        Args: {
          p_expiry_date?: string
          p_material_id: string
          p_note?: string
          p_quantity: number
          p_store_id: string
          p_unit_price: number
        }
        Returns: Database["public"]["Tables"]["transactions"]["Row"]
      }
      record_warehouse_count: {
        Args: {
          p_counted: number
          p_material_id: string
          p_note?: string
          p_store_id: string
        }
        Returns: Database["public"]["Tables"]["transactions"]["Row"]
      }
    }
    Enums: {
      transaction_type:
        | "receipt"
        | "issue_to_bar"
        | "warehouse_count"
        | "bar_count"
      unit_dimension: "weight" | "volume" | "count"
      user_role: "admin" | "brand_manager" | "store_manager" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
