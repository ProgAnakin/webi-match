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
      admin_access_log: {
        Row: {
          id: string
          client_id: string
          user_agent: string | null
          ip_address: string | null
          success: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          user_agent?: string | null
          ip_address?: string | null
          success: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          user_agent?: string | null
          ip_address?: string | null
          success?: boolean
          created_at?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      cooldown_check_log: {
        Row: {
          id: string
          session_key: string
          created_at: string
        }
        Insert: {
          id?: string
          session_key: string
          created_at?: string
        }
        Update: {
          id?: string
          session_key?: string
          created_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          id: string
          email: string
          success: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          success: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          success?: boolean
          created_at?: string
        }
        Relationships: []
      }
      manager_audit_log: {
        Row: {
          id: string
          user_id: string | null
          user_email: string | null
          product_id: string
          new_active: boolean
          store_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          product_id: string
          new_active: boolean
          store_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          product_id?: string
          new_active?: boolean
          store_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      store_roles: {
        Row: {
          user_id: string
          role: string
          store_id: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          role: string
          store_id?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          role?: string
          store_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      product_settings: {
        Row: {
          product_id: string
          store_id: string
          active: boolean
          price_override: string | null
          image_url: string | null
          video_url: string | null
          discount_percent: number | null
          updated_at: string
          faq_q1: string | null
          faq_a1: string | null
          faq_q2: string | null
          faq_a2: string | null
          faq_q3: string | null
          faq_a3: string | null
        }
        Insert: {
          product_id: string
          store_id?: string
          active?: boolean
          price_override?: string | null
          image_url?: string | null
          video_url?: string | null
          discount_percent?: number | null
          updated_at?: string
          faq_q1?: string | null
          faq_a1?: string | null
          faq_q2?: string | null
          faq_a2?: string | null
          faq_q3?: string | null
          faq_a3?: string | null
        }
        Update: {
          product_id?: string
          store_id?: string
          active?: boolean
          price_override?: string | null
          image_url?: string | null
          video_url?: string | null
          discount_percent?: number | null
          updated_at?: string
          faq_q1?: string | null
          faq_a1?: string | null
          faq_q2?: string | null
          faq_a2?: string | null
          faq_q3?: string | null
          faq_a3?: string | null
        }
        Relationships: []
      }
      quiz_funnel_events: {
        Row: {
          id: string
          funnel_key: string
          event_type: string
          store_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          funnel_key: string
          event_type: string
          store_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          funnel_key?: string
          event_type?: string
          store_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          id: string
          email: string
          nome: string | null
          cognome: string | null
          answers: Json
          matched_product_id: string
          match_percent: number
          email_sent: boolean
          store_id: string | null
          product_name: string | null
          product_price: string | null
          product_image: string | null
          product_video: string | null
          discount_code: string | null
          discount_percent: number | null
          code_redeemed: boolean
          code_redeemed_at: string | null
          nome_enc: string | null
          cognome_enc: string | null
          email_hash: string | null
          email_opened_at: string | null
          email_clicked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          nome?: string | null
          cognome?: string | null
          answers?: Json
          matched_product_id: string
          match_percent: number
          email_sent?: boolean
          store_id?: string | null
          product_name?: string | null
          product_price?: string | null
          product_image?: string | null
          product_video?: string | null
          discount_code?: string | null
          discount_percent?: number | null
          code_redeemed?: boolean
          code_redeemed_at?: string | null
          nome_enc?: string | null
          cognome_enc?: string | null
          email_hash?: string | null
          email_opened_at?: string | null
          email_clicked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string | null
          cognome?: string | null
          answers?: Json
          matched_product_id?: string
          match_percent?: number
          email_sent?: boolean
          store_id?: string | null
          product_name?: string | null
          product_price?: string | null
          product_image?: string | null
          product_video?: string | null
          discount_code?: string | null
          discount_percent?: number | null
          code_redeemed?: boolean
          code_redeemed_at?: string | null
          nome_enc?: string | null
          cognome_enc?: string | null
          email_hash?: string | null
          email_opened_at?: string | null
          email_clicked_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_cooldown: {
        Args: { p_email: string }
        Returns: { in_cooldown: boolean; hours_remaining: number }[]
      }
      check_login_rate_limit: {
        Args: { p_email: string }
        Returns: { locked: boolean; locked_seconds: number }
      }
      record_login_attempt: {
        Args: { p_email: string; p_success: boolean }
        Returns: void
      }
      verify_staff_pin: {
        Args: {
          pin_input: string
          client_id?: string
          user_agent?: string
          ip_address?: string
        }
        Returns: { valid: boolean; locked_seconds: number }
      }
      get_my_store_role: {
        Args: Record<string, never>
        Returns: { role: string; store_id: string | null }[]
      }
      encrypt_session_pii: {
        Args: {
          p_session_id: string
          p_nome: string
          p_cognome: string
          p_email: string
          p_key: string
        }
        Returns: void
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
