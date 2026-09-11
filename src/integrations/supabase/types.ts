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
      organizations: {
        Row: { id: string; name: string; slug: string; created_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string }
        Update: { id?: string; name?: string; slug?: string; created_at?: string }
        Relationships: []
      }
      organization_memberships: {
        Row: { id: string; organization_id: string; user_id: string; role: Database["public"]["Enums"]["app_role"]; created_at: string }
        Insert: { id?: string; organization_id: string; user_id: string; role: Database["public"]["Enums"]["app_role"]; created_at?: string }
        Update: { id?: string; organization_id?: string; user_id?: string; role?: Database["public"]["Enums"]["app_role"]; created_at?: string }
        Relationships: []
      }
      role_permissions: {
        Row: { role: Database["public"]["Enums"]["app_role"]; permission_code: string; created_at: string }
        Insert: { role: Database["public"]["Enums"]["app_role"]; permission_code: string; created_at?: string }
        Update: { role?: Database["public"]["Enums"]["app_role"]; permission_code?: string; created_at?: string }
        Relationships: []
      }
      alerts: {
        Row: {
          dataset_id: string
          description: string | null
          detected_at: string
          entity_key: string | null
          evidence: Json
          id: string
          severity: string
          state_id: string | null
          status: string
          title: string
        }
        Insert: {
          dataset_id: string
          description?: string | null
          detected_at?: string
          entity_key?: string | null
          evidence?: Json
          id?: string
          severity: string
          state_id?: string | null
          status?: string
          title: string
        }
        Update: {
          dataset_id?: string
          description?: string | null
          detected_at?: string
          entity_key?: string | null
          evidence?: Json
          id?: string
          severity?: string
          state_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "network_states"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_email: string | null
          after_values: Json | null
          before_values: Json | null
          created_at: string
          detail: Json
          id: number
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_email?: string | null
          after_values?: Json | null
          before_values?: Json | null
          created_at?: string
          detail?: Json
          id?: number
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_email?: string | null
          after_values?: Json | null
          before_values?: Json | null
          created_at?: string
          detail?: Json
          id?: number
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      datasets: {
        Row: {
          created_at: string
          description: string | null
          entity_count: number
          flow_count: number
          id: string
          license: string | null
          name: string
          owner_id: string | null
          processing_status: string
          provenance: string | null
          source_format: string
          source_url: string | null
          state_count: number
          time_end: string | null
          time_start: string | null
          validation_status: string
          window_size_seconds: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_count?: number
          flow_count?: number
          id?: string
          license?: string | null
          name: string
          owner_id?: string | null
          processing_status?: string
          provenance?: string | null
          source_format: string
          source_url?: string | null
          state_count?: number
          time_end?: string | null
          time_start?: string | null
          validation_status?: string
          window_size_seconds?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_count?: number
          flow_count?: number
          id?: string
          license?: string | null
          name?: string
          owner_id?: string | null
          processing_status?: string
          provenance?: string | null
          source_format?: string
          source_url?: string | null
          state_count?: number
          time_end?: string | null
          time_start?: string | null
          validation_status?: string
          window_size_seconds?: number
        }
        Relationships: []
      }
      graph_edges: {
        Row: {
          byte_count: number
          dataset_id: string
          first_seen: string | null
          id: number
          last_seen: string | null
          metadata: Json
          packet_count: number
          relationship: string
          source_key: string
          target_key: string
          weight: number
        }
        Insert: {
          byte_count?: number
          dataset_id: string
          first_seen?: string | null
          id?: number
          last_seen?: string | null
          metadata?: Json
          packet_count?: number
          relationship: string
          source_key: string
          target_key: string
          weight?: number
        }
        Update: {
          byte_count?: number
          dataset_id?: string
          first_seen?: string | null
          id?: number
          last_seen?: string | null
          metadata?: Json
          packet_count?: number
          relationship?: string
          source_key?: string
          target_key?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "graph_edges_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      model_versions: {
        Row: {
          created_at: string
          id: string
          metrics: Json
          name: string
          notes: string | null
          stage: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          metrics?: Json
          name: string
          notes?: string | null
          stage?: string
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json
          name?: string
          notes?: string | null
          stage?: string
          version?: string
        }
        Relationships: []
      }
      network_entities: {
        Row: {
          byte_count: number
          connection_count: number
          dataset_id: string
          entity_key: string
          entity_type: string
          first_seen: string | null
          id: string
          label: string
          last_seen: string | null
          metadata: Json
          packet_count: number
          risk_score: number
        }
        Insert: {
          byte_count?: number
          connection_count?: number
          dataset_id: string
          entity_key: string
          entity_type: string
          first_seen?: string | null
          id?: string
          label: string
          last_seen?: string | null
          metadata?: Json
          packet_count?: number
          risk_score?: number
        }
        Update: {
          byte_count?: number
          connection_count?: number
          dataset_id?: string
          entity_key?: string
          entity_type?: string
          first_seen?: string | null
          id?: string
          label?: string
          last_seen?: string | null
          metadata?: Json
          packet_count?: number
          risk_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "network_entities_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      network_features: {
        Row: {
          created_at: string
          dataset_id: string
          entity_key: string | null
          features: Json
          id: number
          scope: string
          state_id: string | null
        }
        Insert: {
          created_at?: string
          dataset_id: string
          entity_key?: string | null
          features?: Json
          id?: number
          scope?: string
          state_id?: string | null
        }
        Update: {
          created_at?: string
          dataset_id?: string
          entity_key?: string | null
          features?: Json
          id?: number
          scope?: string
          state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_features_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_features_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "network_states"
            referencedColumns: ["id"]
          },
        ]
      }
      network_flows: {
        Row: {
          byte_count: number
          dataset_id: string
          derived: Json
          dst_ip: unknown
          dst_port: number | null
          duration_ms: number
          flow_id: string
          iat_mean: number | null
          iat_std: number | null
          id: number
          packet_count: number
          protocol: string
          retransmission_count: number
          src_ip: unknown
          src_port: number | null
          tcp_flags: Json
          timestamp: string
          ttl: number | null
        }
        Insert: {
          byte_count?: number
          dataset_id: string
          derived?: Json
          dst_ip: unknown
          dst_port?: number | null
          duration_ms?: number
          flow_id: string
          iat_mean?: number | null
          iat_std?: number | null
          id?: number
          packet_count?: number
          protocol: string
          retransmission_count?: number
          src_ip: unknown
          src_port?: number | null
          tcp_flags?: Json
          timestamp: string
          ttl?: number | null
        }
        Update: {
          byte_count?: number
          dataset_id?: string
          derived?: Json
          dst_ip?: unknown
          dst_port?: number | null
          duration_ms?: number
          flow_id?: string
          iat_mean?: number | null
          iat_std?: number | null
          id?: number
          packet_count?: number
          protocol?: string
          retransmission_count?: number
          src_ip?: unknown
          src_port?: number | null
          tcp_flags?: Json
          timestamp?: string
          ttl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "network_flows_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      network_states: {
        Row: {
          active_connections: number
          active_hosts: number
          anomaly_score: number
          byte_rate: number
          dataset_id: string
          graph_statistics: Json
          iat_mean: number
          iat_variance: number
          id: string
          packet_rate: number
          protocol_distribution: Json
          retransmission_rate: number
          rst_ratio: number
          state_index: number
          syn_ratio: number
          timestamp_end: string
          timestamp_start: string
          unique_ports: number
          window_size_seconds: number
        }
        Insert: {
          active_connections?: number
          active_hosts?: number
          anomaly_score?: number
          byte_rate?: number
          dataset_id: string
          graph_statistics?: Json
          iat_mean?: number
          iat_variance?: number
          id?: string
          packet_rate?: number
          protocol_distribution?: Json
          retransmission_rate?: number
          rst_ratio?: number
          state_index: number
          syn_ratio?: number
          timestamp_end: string
          timestamp_start: string
          unique_ports?: number
          window_size_seconds: number
        }
        Update: {
          active_connections?: number
          active_hosts?: number
          anomaly_score?: number
          byte_rate?: number
          dataset_id?: string
          graph_statistics?: Json
          iat_mean?: number
          iat_variance?: number
          id?: string
          packet_rate?: number
          protocol_distribution?: Json
          retransmission_rate?: number
          rst_ratio?: number
          state_index?: number
          syn_ratio?: number
          timestamp_end?: string
          timestamp_start?: string
          unique_ports?: number
          window_size_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "network_states_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          created_at: string
          dataset_id: string | null
          error_message: string | null
          file_format: string
          filename: string
          id: string
          owner_id: string | null
          progress: number
          size_bytes: number
          stats: Json
          status: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dataset_id?: string | null
          error_message?: string | null
          file_format: string
          filename: string
          id?: string
          owner_id?: string | null
          progress?: number
          size_bytes?: number
          stats?: Json
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dataset_id?: string | null
          error_message?: string | null
          file_format?: string
          filename?: string
          id?: string
          owner_id?: string | null
          progress?: number
          size_bytes?: number
          stats?: Json
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      can_access_admin: {
        Args: {
          _permission_code: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "viewer" | "researcher" | "SUPER_ADMIN" | "SECURITY_MANAGER" | "SOC_ANALYST" | "NETWORK_SECURITY_ADMIN"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "analyst", "viewer", "researcher", "SUPER_ADMIN", "SECURITY_MANAGER", "SOC_ANALYST", "NETWORK_SECURITY_ADMIN"],
    },
  },
} as const
