export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      dishes: {
        Row: {
          access: Database["public"]["Enums"]["dish_access"];
          base_servings: number;
          cover_url: string | null;
          created_at: string;
          difficulty: Database["public"]["Enums"]["dish_difficulty"];
          id: string;
          location_id: string;
          name: NonNullable<Json>;
          prep_minutes: number | null;
          published_at: string | null;
          search_vector: unknown;
          slug: string;
          status: Database["public"]["Enums"]["dish_status"];
          story: NonNullable<Json>;
          updated_at: string;
        };
        Insert: {
          access?: Database["public"]["Enums"]["dish_access"];
          base_servings?: number;
          cover_url?: string | null;
          created_at?: string;
          difficulty?: Database["public"]["Enums"]["dish_difficulty"];
          id?: string;
          location_id: string;
          name: NonNullable<Json>;
          prep_minutes?: number | null;
          published_at?: string | null;
          search_vector?: never;
          slug: string;
          status?: Database["public"]["Enums"]["dish_status"];
          story?: NonNullable<Json>;
          updated_at?: string;
        };
        Update: {
          access?: Database["public"]["Enums"]["dish_access"];
          base_servings?: number;
          cover_url?: string | null;
          created_at?: string;
          difficulty?: Database["public"]["Enums"]["dish_difficulty"];
          id?: string;
          location_id?: string;
          name?: NonNullable<Json>;
          prep_minutes?: number | null;
          published_at?: string | null;
          search_vector?: never;
          slug?: string;
          status?: Database["public"]["Enums"]["dish_status"];
          story?: NonNullable<Json>;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dishes_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          dish_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dish_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dish_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_dish_id_fkey";
            columns: ["dish_id"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredients: {
        Row: {
          dish_id: string;
          id: string;
          name: NonNullable<Json>;
          note: Json | null;
          position: number;
          qty_metric: number | null;
          qty_us: number | null;
          unit_metric: string | null;
          unit_us: string | null;
        };
        Insert: {
          dish_id: string;
          id?: string;
          name: NonNullable<Json>;
          note?: Json | null;
          position: number;
          qty_metric?: number | null;
          qty_us?: number | null;
          unit_metric?: string | null;
          unit_us?: string | null;
        };
        Update: {
          dish_id?: string;
          id?: string;
          name?: NonNullable<Json>;
          note?: Json | null;
          position?: number;
          qty_metric?: number | null;
          qty_us?: number | null;
          unit_metric?: string | null;
          unit_us?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ingredients_dish_id_fkey";
            columns: ["dish_id"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          created_at: string;
          id: string;
          iso_code: string | null;
          lat: number;
          lng: number;
          name: NonNullable<Json>;
          parent_id: string | null;
          search_vector: unknown;
          slug: string;
          type: Database["public"]["Enums"]["location_type"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          iso_code?: string | null;
          lat: number;
          lng: number;
          name: NonNullable<Json>;
          parent_id?: string | null;
          search_vector?: never;
          slug: string;
          type: Database["public"]["Enums"]["location_type"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          iso_code?: string | null;
          lat?: number;
          lng?: number;
          name?: NonNullable<Json>;
          parent_id?: string | null;
          search_vector?: never;
          slug?: string;
          type?: Database["public"]["Enums"]["location_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          country: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          locale: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          country?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          locale?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          country?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          locale?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      steps: {
        Row: {
          dish_id: string;
          id: string;
          media_url: string | null;
          position: number;
          text: NonNullable<Json>;
          timer_seconds: number | null;
          title: Json | null;
        };
        Insert: {
          dish_id: string;
          id?: string;
          media_url?: string | null;
          position: number;
          text: NonNullable<Json>;
          timer_seconds?: number | null;
          title?: Json | null;
        };
        Update: {
          dish_id?: string;
          id?: string;
          media_url?: string | null;
          position?: number;
          text?: NonNullable<Json>;
          timer_seconds?: number | null;
          title?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "steps_dish_id_fkey";
            columns: ["dish_id"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          created_at: string;
          currency: string;
          current_period_end: string;
          id: string;
          plan: Database["public"]["Enums"]["subscription_plan"];
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_customer_id: string | null;
          provider_subscription_id: string;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency: string;
          current_period_end: string;
          id?: string;
          plan: Database["public"]["Enums"]["subscription_plan"];
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_customer_id?: string | null;
          provider_subscription_id: string;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          current_period_end?: string;
          id?: string;
          plan?: Database["public"]["Enums"]["subscription_plan"];
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_customer_id?: string | null;
          provider_subscription_id?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      videos: {
        Row: {
          created_at: string;
          dish_id: string;
          duration_s: number | null;
          id: string;
          kind: Database["public"]["Enums"]["video_kind"];
          mux_asset_id: string | null;
          mux_playback_id: string | null;
          mux_upload_id: string | null;
          status: Database["public"]["Enums"]["video_status"];
          subtitles: NonNullable<Json>;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dish_id: string;
          duration_s?: number | null;
          id?: string;
          kind: Database["public"]["Enums"]["video_kind"];
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          mux_upload_id?: string | null;
          status?: Database["public"]["Enums"]["video_status"];
          subtitles?: NonNullable<Json>;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dish_id?: string;
          duration_s?: number | null;
          id?: string;
          kind?: Database["public"]["Enums"]["video_kind"];
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          mux_upload_id?: string | null;
          status?: Database["public"]["Enums"]["video_status"];
          subtitles?: NonNullable<Json>;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "videos_dish_id_fkey";
            columns: ["dish_id"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_replace_ingredients: {
        Args: { p_dish_id: string; p_items: Json };
        Returns: undefined;
      };
      admin_replace_steps: {
        Args: { p_dish_id: string; p_items: Json };
        Returns: undefined;
      };
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      f_unaccent: { Args: { "": string }; Returns: string };
      has_access: { Args: { p_dish_id: string }; Returns: boolean };
      has_active_subscription: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      i18n_search_text: { Args: { value: Json }; Returns: string };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_dish_visible: { Args: { p_dish_id: string }; Returns: boolean };
      is_i18n_text: {
        Args: { required?: boolean; value: Json };
        Returns: boolean;
      };
    };
    Enums: {
      dish_access: "free" | "premium";
      dish_difficulty: "easy" | "medium" | "hard";
      dish_status: "draft" | "published";
      location_type: "continent" | "country" | "city" | "neighborhood";
      payment_provider: "stripe" | "mercadopago";
      subscription_plan: "monthly" | "annual";
      subscription_status:
        | "incomplete"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "expired";
      user_role: "user" | "admin";
      video_kind: "teaser" | "full";
      video_status: "waiting" | "preparing" | "ready" | "errored";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      dish_access: ["free", "premium"],
      dish_difficulty: ["easy", "medium", "hard"],
      dish_status: ["draft", "published"],
      location_type: ["continent", "country", "city", "neighborhood"],
      payment_provider: ["stripe", "mercadopago"],
      subscription_plan: ["monthly", "annual"],
      subscription_status: [
        "incomplete",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "expired",
      ],
      user_role: ["user", "admin"],
      video_kind: ["teaser", "full"],
      video_status: ["waiting", "preparing", "ready", "errored"],
    },
  },
} as const;
