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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      apartments: {
        Row: {
          address: string
          bathrooms: number
          bedrooms: number
          city: string
          code: string | null
          cover_url: string | null
          created_at: string
          daily_rate: number
          description: string | null
          host_id: string | null
          id: string
          is_active: boolean
          max_guests: number
          name: string
          property_owner_id: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address: string
          bathrooms?: number
          bedrooms?: number
          city: string
          code?: string | null
          cover_url?: string | null
          created_at?: string
          daily_rate?: number
          description?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean
          max_guests?: number
          name: string
          property_owner_id?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          bathrooms?: number
          bedrooms?: number
          city?: string
          code?: string | null
          cover_url?: string | null
          created_at?: string
          daily_rate?: number
          description?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean
          max_guests?: number
          name?: string
          property_owner_id?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_owners: {
        Row: {
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          name: string
          order_id: string
          quantity: number
          service_key: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_id: string
          quantity?: number
          service_key?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          quantity?: number
          service_key?: string | null
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
        ]
      }
      orders: {
        Row: {
          apartment_id: string | null
          category: Database["public"]["Enums"]["order_category"]
          created_at: string
          details: string | null
          id: string
          order_number: string
          reservation_id: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          apartment_id?: string | null
          category: Database["public"]["Enums"]["order_category"]
          created_at?: string
          details?: string | null
          id?: string
          order_number?: string
          reservation_id?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          apartment_id?: string | null
          category?: Database["public"]["Enums"]["order_category"]
          created_at?: string
          details?: string | null
          id?: string
          order_number?: string
          reservation_id?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          benefit: string | null
          contact: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          segment: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          benefit?: string | null
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          segment?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          benefit?: string | null
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          segment?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      pricing: {
        Row: {
          created_at: string
          id: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"] | null
          service_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"] | null
          service_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"] | null
          service_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_service_key_fkey"
            columns: ["service_key"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["key"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          address: string | null
          apartment_id: string
          check_in: string
          check_out: string
          created_at: string
          guest_id: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          reservation_code: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          apartment_id: string
          check_in: string
          check_out: string
          created_at?: string
          guest_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          reservation_code: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          apartment_id?: string
          check_in?: string
          check_out?: string
          created_at?: string
          guest_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          reservation_code?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          audience: string
          category: Database["public"]["Enums"]["order_category"]
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          price_by_property: boolean
          sort_order: number
          unit: string
          updated_at: string
        }
        Insert: {
          audience?: string
          category?: Database["public"]["Enums"]["order_category"]
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          price_by_property?: boolean
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          category?: Database["public"]["Enums"]["order_category"]
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          price_by_property?: boolean
          sort_order?: number
          unit?: string
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      link_reservation: {
        Args: { _code: string }
        Returns: {
          reservation_id: string
        }[]
      }
      register_admin_push_subscription: {
        Args: {
          _endpoint: string
          _p256dh: string
          _auth: string
          _user_agent?: string | null
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "guest" | "host" | "admin"
      order_category:
        | "kit"
        | "mercado"
        | "limpeza"
        | "organizacao"
        | "servico"
        | "manutencao"
        | "operacional"
      order_status:
        | "recebido"
        | "em_analise"
        | "confirmado"
        | "em_preparacao"
        | "em_entrega"
        | "concluido"
        | "cancelado"
      property_type: "S" | "D" | "T"
      reservation_status:
        | "pendente"
        | "confirmada"
        | "ativa"
        | "finalizada"
        | "cancelada"
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
      app_role: ["guest", "host", "admin"],
      order_category: [
        "kit",
        "mercado",
        "limpeza",
        "organizacao",
        "servico",
        "manutencao",
        "operacional",
      ],
      order_status: [
        "recebido",
        "em_analise",
        "confirmado",
        "em_preparacao",
        "em_entrega",
        "concluido",
        "cancelado",
      ],
      property_type: ["S", "D", "T"],
      reservation_status: [
        "pendente",
        "confirmada",
        "ativa",
        "finalizada",
        "cancelada",
      ],
    },
  },
} as const
