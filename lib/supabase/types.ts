// Minimal placeholder comment retained. The concrete Database type is defined below.

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
    PostgrestVersion: "13.0.5"
  }
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at: string | null
          id: string
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code: string
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id?: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid: string | null
          web_authn_credential: Json | null
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorizations: {
        Row: {
          approved_at: string | null
          authorization_code: string | null
          authorization_id: string
          client_id: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string
          expires_at: string
          id: string
          redirect_uri: string
          resource: string | null
          response_type: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state: string | null
          status: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id: string
          client_id: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id: string
          redirect_uri: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id?: string
          client_id?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope?: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_clients: {
        Row: {
          client_name: string | null
          client_secret_hash: string | null
          client_type: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri: string | null
          created_at: string
          deleted_at: string | null
          grant_types: string
          id: string
          logo_uri: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types: string
          id: string
          logo_uri?: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types?: string
          id?: string
          logo_uri?: string | null
          redirect_uris?: string
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at?: string
        }
        Relationships: []
      }
      oauth_consents: {
        Row: {
          client_id: string
          granted_at: string
          id: string
          revoked_at: string | null
          scopes: string
          user_id: string
        }
        Insert: {
          client_id: string
          granted_at?: string
          id: string
          revoked_at?: string | null
          scopes: string
          user_id: string
        }
        Update: {
          client_id?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          scopes?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown | null
          not_after: string | null
          oauth_client_id: string | null
          refreshed_at: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown | null
          not_after?: string | null
          oauth_client_id?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown | null
          not_after?: string | null
          oauth_client_id?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_oauth_client_id_fkey"
            columns: ["oauth_client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          disabled: boolean | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disabled?: boolean | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disabled?: boolean | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean
          is_sso_user: boolean
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      jwt: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired"
      oauth_client_type: "public" | "confidential"
      oauth_registration_type: "dynamic" | "manual"
      oauth_response_type: "code"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      billing_reports: {
        Row: {
          company_id: string | null
          customer_id: string | null
          end_date: string
          generated_at: string | null
          generated_by: string | null
          id: string
          report_data: Json | null
          start_date: string
          total_amount: number | null
          total_chemicals_cost: number | null
          total_services: number | null
          total_tests: number | null
        }
        Insert: {
          company_id?: string | null
          customer_id?: string | null
          end_date: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          report_data?: Json | null
          start_date: string
          total_amount?: number | null
          total_chemicals_cost?: number | null
          total_services?: number | null
          total_tests?: number | null
        }
        Update: {
          company_id?: string | null
          customer_id?: string | null
          end_date?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          report_data?: Json | null
          start_date?: string
          total_amount?: number | null
          total_chemicals_cost?: number | null
          total_services?: number | null
          total_tests?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "billing_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_source: string | null
          check_in_date: string
          check_out_date: string
          created_at: string | null
          guest_name: string | null
          id: string
          notes: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_source?: string | null
          check_in_date: string
          check_out_date: string
          created_at?: string | null
          guest_name?: string | null
          id?: string
          notes?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_source?: string | null
          check_in_date?: string
          check_out_date?: string
          created_at?: string | null
          guest_name?: string | null
          id?: string
          notes?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      chemical_additions: {
        Row: {
          chemical_type: string
          cost: number | null
          created_at: string | null
          id: string
          quantity: number
          service_id: string | null
          unit_of_measure: string | null
        }
        Insert: {
          chemical_type: string
          cost?: number | null
          created_at?: string | null
          id?: string
          quantity: number
          service_id?: string | null
          unit_of_measure?: string | null
        }
        Update: {
          chemical_type?: string
          cost?: number | null
          created_at?: string | null
          id?: string
          quantity?: number
          service_id?: string | null
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chemical_additions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_additions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_additions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_additions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "technician_today_services"
            referencedColumns: ["service_id"]
          },
        ]
      }
      chemical_reference: {
        Row: {
          category: string | null
          cause: string | null
          chemical_name: string | null
          created_at: string | null
          display_order: number | null
          dosage_amount_imperial: number | null
          dosage_amount_metric: number | null
          dosage_description_imperial: string | null
          dosage_description_metric: string | null
          dosage_per_volume_gallons: number | null
          dosage_per_volume_litres: number | null
          dosage_unit_imperial: string | null
          dosage_unit_metric: string | null
          id: string
          is_active: boolean | null
          jurisdiction_code: string | null
          pool_type: string | null
          problem_title: string
          problem_type: string
          retest_time_minutes: number | null
          safety_warning: string | null
          solution: string | null
          steps: string | null
          target_max: number | null
          target_min: number | null
          target_unit: string | null
        }
        Insert: {
          category?: string | null
          cause?: string | null
          chemical_name?: string | null
          created_at?: string | null
          display_order?: number | null
          dosage_amount_imperial?: number | null
          dosage_amount_metric?: number | null
          dosage_description_imperial?: string | null
          dosage_description_metric?: string | null
          dosage_per_volume_gallons?: number | null
          dosage_per_volume_litres?: number | null
          dosage_unit_imperial?: string | null
          dosage_unit_metric?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_code?: string | null
          pool_type?: string | null
          problem_title: string
          problem_type: string
          retest_time_minutes?: number | null
          safety_warning?: string | null
          solution?: string | null
          steps?: string | null
          target_max?: number | null
          target_min?: number | null
          target_unit?: string | null
        }
        Update: {
          category?: string | null
          cause?: string | null
          chemical_name?: string | null
          created_at?: string | null
          display_order?: number | null
          dosage_amount_imperial?: number | null
          dosage_amount_metric?: number | null
          dosage_description_imperial?: string | null
          dosage_description_metric?: string | null
          dosage_per_volume_gallons?: number | null
          dosage_per_volume_litres?: number | null
          dosage_unit_imperial?: string | null
          dosage_unit_metric?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction_code?: string | null
          pool_type?: string | null
          problem_title?: string
          problem_type?: string
          retest_time_minutes?: number | null
          safety_warning?: string | null
          solution?: string | null
          steps?: string | null
          target_max?: number | null
          target_min?: number | null
          target_unit?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          city: string | null
          compliance_jurisdiction: string | null
          created_at: string | null
          currency: string | null
          date_format: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string | null
          state: string | null
          subscription_status: string | null
          subscription_tier: string | null
          timezone: string | null
          unit_system: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          city?: string | null
          compliance_jurisdiction?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          unit_system?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          city?: string | null
          compliance_jurisdiction?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          unit_system?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_chemical_prices: {
        Row: {
          chemical_code: string
          company_id: string
          created_at: string | null
          effective_at: string
          id: string
          price_per_unit: number
          property_id: string | null
          unit: string
        }
        Insert: {
          chemical_code: string
          company_id: string
          created_at?: string | null
          effective_at?: string
          id?: string
          price_per_unit: number
          property_id?: string | null
          unit: string
        }
        Update: {
          chemical_code?: string
          company_id?: string
          created_at?: string | null
          effective_at?: string
          id?: string
          price_per_unit?: number
          property_id?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_chemical_prices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_chemical_prices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_chemical_prices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_chemical_prices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "company_chemical_prices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_chemical_prices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_chemical_prices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
        ]
      }
      compliance_jurisdictions: {
        Row: {
          code: string
          created_at: string | null
          guidelines_url: string | null
          id: string
          is_active: boolean | null
          name: string
          regulatory_body: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          guidelines_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          regulatory_body?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          guidelines_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          regulatory_body?: string | null
        }
        Relationships: []
      }
      compliance_requirements: {
        Row: {
          alkalinity_max: number | null
          alkalinity_min: number | null
          bromine_max: number | null
          bromine_min: number | null
          combined_chlorine_ideal: number | null
          combined_chlorine_max: number | null
          created_at: string | null
          cyanuric_acid_ideal: number | null
          cyanuric_acid_max: number | null
          diarrhea_exclusion_days: number | null
          ecoli_max: number | null
          free_chlorine_max: number | null
          free_chlorine_min: number | null
          hcc_max: number | null
          id: string
          jurisdiction_id: string | null
          operational_tests_per_day: number | null
          operational_water_balance_days: number | null
          ph_max: number | null
          ph_min: number | null
          pool_type: string
          pseudomonas_max: number | null
          record_retention_days: number | null
          risk_category: Database["public"]["Enums"]["risk_category"]
          total_chlorine_max: number | null
          turbidity_ideal: number | null
          turbidity_max: number | null
          verification_chemical_days: number | null
          verification_microbiological_days: number | null
        }
        Insert: {
          alkalinity_max?: number | null
          alkalinity_min?: number | null
          bromine_max?: number | null
          bromine_min?: number | null
          combined_chlorine_ideal?: number | null
          combined_chlorine_max?: number | null
          created_at?: string | null
          cyanuric_acid_ideal?: number | null
          cyanuric_acid_max?: number | null
          diarrhea_exclusion_days?: number | null
          ecoli_max?: number | null
          free_chlorine_max?: number | null
          free_chlorine_min?: number | null
          hcc_max?: number | null
          id?: string
          jurisdiction_id?: string | null
          operational_tests_per_day?: number | null
          operational_water_balance_days?: number | null
          ph_max?: number | null
          ph_min?: number | null
          pool_type: string
          pseudomonas_max?: number | null
          record_retention_days?: number | null
          risk_category: Database["public"]["Enums"]["risk_category"]
          total_chlorine_max?: number | null
          turbidity_ideal?: number | null
          turbidity_max?: number | null
          verification_chemical_days?: number | null
          verification_microbiological_days?: number | null
        }
        Update: {
          alkalinity_max?: number | null
          alkalinity_min?: number | null
          bromine_max?: number | null
          bromine_min?: number | null
          combined_chlorine_ideal?: number | null
          combined_chlorine_max?: number | null
          created_at?: string | null
          cyanuric_acid_ideal?: number | null
          cyanuric_acid_max?: number | null
          diarrhea_exclusion_days?: number | null
          ecoli_max?: number | null
          free_chlorine_max?: number | null
          free_chlorine_min?: number | null
          hcc_max?: number | null
          id?: string
          jurisdiction_id?: string | null
          operational_tests_per_day?: number | null
          operational_water_balance_days?: number | null
          ph_max?: number | null
          ph_min?: number | null
          pool_type?: string
          pseudomonas_max?: number | null
          record_retention_days?: number | null
          risk_category?: Database["public"]["Enums"]["risk_category"]
          total_chlorine_max?: number | null
          turbidity_ideal?: number | null
          turbidity_max?: number | null
          verification_chemical_days?: number | null
          verification_microbiological_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_requirements_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "compliance_jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_violations: {
        Row: {
          actual_value: number | null
          created_at: string | null
          id: string
          lab_test_id: string | null
          parameter_name: string | null
          required_max: number | null
          required_min: number | null
          requirement_id: string | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          service_id: string | null
          severity: string | null
          violation_type: string
          water_test_id: string | null
        }
        Insert: {
          actual_value?: number | null
          created_at?: string | null
          id?: string
          lab_test_id?: string | null
          parameter_name?: string | null
          required_max?: number | null
          required_min?: number | null
          requirement_id?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          service_id?: string | null
          severity?: string | null
          violation_type: string
          water_test_id?: string | null
        }
        Update: {
          actual_value?: number | null
          created_at?: string | null
          id?: string
          lab_test_id?: string | null
          parameter_name?: string | null
          required_max?: number | null
          required_min?: number | null
          requirement_id?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          service_id?: string | null
          severity?: string | null
          violation_type?: string
          water_test_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_violations_lab_test_id_fkey"
            columns: ["lab_test_id"]
            isOneToOne: false
            referencedRelation: "lab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "compliance_violations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "technician_today_services"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "compliance_violations_water_test_id_fkey"
            columns: ["water_test_id"]
            isOneToOne: false
            referencedRelation: "services_optimized"
            referencedColumns: ["water_test_id"]
          },
          {
            foreignKeyName: "compliance_violations_water_test_id_fkey"
            columns: ["water_test_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["water_test_id"]
          },
          {
            foreignKeyName: "compliance_violations_water_test_id_fkey"
            columns: ["water_test_id"]
            isOneToOne: false
            referencedRelation: "water_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_schedules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string | null
          schedule_config: Json
          schedule_type: string
          service_types: Json
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          schedule_config: Json
          schedule_type: string
          service_types: Json
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          schedule_config?: Json
          schedule_type?: string
          service_types?: Json
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "custom_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_access: {
        Row: {
          access_code: string
          can_add_bookings: boolean | null
          can_view_costs: boolean | null
          created_at: string | null
          customer_id: string | null
          id: string
          last_login: string | null
        }
        Insert: {
          access_code: string
          can_add_bookings?: boolean | null
          can_view_costs?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          last_login?: string | null
        }
        Update: {
          access_code?: string
          can_add_bookings?: boolean | null
          can_view_costs?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          last_login?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_access_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_access_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_user_links: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_user_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_user_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          billing_email: string | null
          city: string | null
          company_id: string | null
          created_at: string | null
          customer_type: Database["public"]["Enums"]["customer_type"]
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          billing_email?: string | null
          city?: string | null
          company_id?: string | null
          created_at?: string | null
          customer_type: Database["public"]["Enums"]["customer_type"]
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          billing_email?: string | null
          city?: string | null
          company_id?: string | null
          created_at?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"]
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
        ]
      }
      equipment: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string | null
          equipment_name: string | null
          equipment_type: string
          has_inlet_outlet: boolean | null
          id: string
          install_date: string | null
          is_active: boolean | null
          maintenance_frequency: string | null
          maintenance_scheduled: boolean | null
          maintenance_times: string[] | null
          measurement_config: Json | null
          measurement_thresholds: Json | null
          measurement_type: string | null
          model: string | null
          name: string | null
          notes: string | null
          plant_room_id: string | null
          property_id: string | null
          serial_number: string | null
          unit_id: string | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          equipment_name?: string | null
          equipment_type: string
          has_inlet_outlet?: boolean | null
          id?: string
          install_date?: string | null
          is_active?: boolean | null
          maintenance_frequency?: string | null
          maintenance_scheduled?: boolean | null
          maintenance_times?: string[] | null
          measurement_config?: Json | null
          measurement_thresholds?: Json | null
          measurement_type?: string | null
          model?: string | null
          name?: string | null
          notes?: string | null
          plant_room_id?: string | null
          property_id?: string | null
          serial_number?: string | null
          unit_id?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          equipment_name?: string | null
          equipment_type?: string
          has_inlet_outlet?: boolean | null
          id?: string
          install_date?: string | null
          is_active?: boolean | null
          maintenance_frequency?: string | null
          maintenance_scheduled?: boolean | null
          maintenance_times?: string[] | null
          measurement_config?: Json | null
          measurement_thresholds?: Json | null
          measurement_type?: string | null
          model?: string | null
          name?: string | null
          notes?: string | null
          plant_room_id?: string | null
          property_id?: string | null
          serial_number?: string | null
          unit_id?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_plant_room_id_fkey"
            columns: ["plant_room_id"]
            isOneToOne: false
            referencedRelation: "plant_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "equipment_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "equipment_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "equipment_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_checks: {
        Row: {
          balance_tank_level: number | null
          created_at: string | null
          equipment_id: string | null
          id: string
          inlet_pressure: number | null
          issue_description: string | null
          issue_resolved: boolean | null
          notes: string | null
          outlet_pressure: number | null
          plant_room_check_id: string | null
          readings: Json | null
          service_id: string | null
          setpoint: number | null
          status: string | null
        }
        Insert: {
          balance_tank_level?: number | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          inlet_pressure?: number | null
          issue_description?: string | null
          issue_resolved?: boolean | null
          notes?: string | null
          outlet_pressure?: number | null
          plant_room_check_id?: string | null
          readings?: Json | null
          service_id?: string | null
          setpoint?: number | null
          status?: string | null
        }
        Update: {
          balance_tank_level?: number | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          inlet_pressure?: number | null
          issue_description?: string | null
          issue_resolved?: boolean | null
          notes?: string | null
          outlet_pressure?: number | null
          plant_room_check_id?: string | null
          readings?: Json | null
          service_id?: string | null
          setpoint?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_checks_equipment_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checks_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checks_prc_fkey"
            columns: ["plant_room_check_id"]
            isOneToOne: false
            referencedRelation: "plant_room_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "technician_today_services"
            referencedColumns: ["service_id"]
          },
        ]
      }
      equipment_maintenance_logs: {
        Row: {
          actions: Json | null
          created_at: string | null
          equipment_id: string
          id: string
          maintenance_date: string
          maintenance_time: string
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          actions?: Json | null
          created_at?: string | null
          equipment_id: string
          id?: string
          maintenance_date?: string
          maintenance_time?: string
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          actions?: Json | null
          created_at?: string | null
          equipment_id?: string
          id?: string
          maintenance_date?: string
          maintenance_time?: string
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string | null
          external_contact: Json | null
          id: string
          job_type: string
          labor_minutes: number | null
          materials: Json | null
          notes: string | null
          plant_room_id: string | null
          price_cents: number | null
          property_id: string | null
          scheduled_at: string | null
          status: string
          title: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          external_contact?: Json | null
          id?: string
          job_type: string
          labor_minutes?: number | null
          materials?: Json | null
          notes?: string | null
          plant_room_id?: string | null
          price_cents?: number | null
          property_id?: string | null
          scheduled_at?: string | null
          status?: string
          title: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          external_contact?: Json | null
          id?: string
          job_type?: string
          labor_minutes?: number | null
          materials?: Json | null
          notes?: string | null
          plant_room_id?: string | null
          price_cents?: number | null
          property_id?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_plant_room_id_fkey"
            columns: ["plant_room_id"]
            isOneToOne: false
            referencedRelation: "plant_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "jobs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "jobs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_tests: {
        Row: {
          alert_sent: boolean | null
          certificate_url: string | null
          chloramines_pass: boolean | null
          chloramines_result: number | null
          chloramines_unit: string | null
          created_at: string | null
          created_by: string | null
          ecoli_pass: boolean | null
          ecoli_result: number | null
          ecoli_unit: string | null
          hcc_pass: boolean | null
          hcc_result: number | null
          hcc_unit: string | null
          id: string
          lab_name: string
          lab_reference: string | null
          nata_accredited: boolean | null
          next_test_due: string | null
          notes: string | null
          overall_pass: boolean | null
          ozone_pass: boolean | null
          ozone_result: number | null
          property_id: string | null
          pseudomonas_pass: boolean | null
          pseudomonas_result: number | null
          pseudomonas_unit: string | null
          sample_collection_date: string | null
          test_date: string
          test_type: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          alert_sent?: boolean | null
          certificate_url?: string | null
          chloramines_pass?: boolean | null
          chloramines_result?: number | null
          chloramines_unit?: string | null
          created_at?: string | null
          created_by?: string | null
          ecoli_pass?: boolean | null
          ecoli_result?: number | null
          ecoli_unit?: string | null
          hcc_pass?: boolean | null
          hcc_result?: number | null
          hcc_unit?: string | null
          id?: string
          lab_name: string
          lab_reference?: string | null
          nata_accredited?: boolean | null
          next_test_due?: string | null
          notes?: string | null
          overall_pass?: boolean | null
          ozone_pass?: boolean | null
          ozone_result?: number | null
          property_id?: string | null
          pseudomonas_pass?: boolean | null
          pseudomonas_result?: number | null
          pseudomonas_unit?: string | null
          sample_collection_date?: string | null
          test_date: string
          test_type?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_sent?: boolean | null
          certificate_url?: string | null
          chloramines_pass?: boolean | null
          chloramines_result?: number | null
          chloramines_unit?: string | null
          created_at?: string | null
          created_by?: string | null
          ecoli_pass?: boolean | null
          ecoli_result?: number | null
          ecoli_unit?: string | null
          hcc_pass?: boolean | null
          hcc_result?: number | null
          hcc_unit?: string | null
          id?: string
          lab_name?: string
          lab_reference?: string | null
          nata_accredited?: boolean | null
          next_test_due?: string | null
          notes?: string | null
          overall_pass?: boolean | null
          ozone_pass?: boolean | null
          ozone_result?: number | null
          property_id?: string | null
          pseudomonas_pass?: boolean | null
          pseudomonas_result?: number | null
          pseudomonas_unit?: string | null
          sample_collection_date?: string | null
          test_date?: string
          test_type?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_tests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "lab_tests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "lab_tests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "lab_tests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "lab_tests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tasks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          notes: string | null
          service_id: string | null
          task_type: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          service_id?: string | null
          task_type: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          service_id?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tasks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tasks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tasks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tasks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "technician_today_services"
            referencedColumns: ["service_id"]
          },
        ]
      }
      plant_room_checks: {
        Row: {
          check_date: string
          check_time: string
          created_at: string | null
          id: string
          notes: string | null
          performed_by: string | null
          plant_room_id: string
          readings: Json | null
        }
        Insert: {
          check_date?: string
          check_time?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          plant_room_id: string
          readings?: Json | null
        }
        Update: {
          check_date?: string
          check_time?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          plant_room_id?: string
          readings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_room_checks_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_room_checks_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "plant_room_checks_plant_room_id_fkey"
            columns: ["plant_room_id"]
            isOneToOne: false
            referencedRelation: "plant_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_rooms: {
        Row: {
          check_days: number[] | null
          check_frequency: string | null
          check_times: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          property_id: string | null
          updated_at: string | null
        }
        Insert: {
          check_days?: number[] | null
          check_frequency?: string | null
          check_times?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          property_id?: string | null
          updated_at?: string | null
        }
        Update: {
          check_days?: number[] | null
          check_frequency?: string | null
          check_times?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          property_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "plant_rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          preferred_timezone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          preferred_timezone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_timezone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          billing_type: string | null
          city: string | null
          company_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          customer_id: string | null
          has_individual_units: boolean | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          postal_code: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          risk_category: Database["public"]["Enums"]["risk_category"] | null
          state: string | null
          timezone: string | null
          total_volume_litres: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          billing_type?: string | null
          city?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          customer_id?: string | null
          has_individual_units?: boolean | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          postal_code?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          risk_category?: Database["public"]["Enums"]["risk_category"] | null
          state?: string | null
          timezone?: string | null
          total_volume_litres?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          billing_type?: string | null
          city?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          customer_id?: string | null
          has_individual_units?: boolean | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          postal_code?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          risk_category?: Database["public"]["Enums"]["risk_category"] | null
          state?: string | null
          timezone?: string | null
          total_volume_litres?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "properties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      property_scheduling_rules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          property_id: string | null
          rule_config: Json
          rule_name: string
          rule_type: string
          target_unit_numbers: string[] | null
          target_unit_types: string[] | null
          target_units: Json | null
          target_water_types: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          property_id?: string | null
          rule_config: Json
          rule_name: string
          rule_type: string
          target_unit_numbers?: string[] | null
          target_unit_types?: string[] | null
          target_units?: Json | null
          target_water_types?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          property_id?: string | null
          rule_config?: Json
          rule_name?: string
          rule_type?: string
          target_unit_numbers?: string[] | null
          target_unit_types?: string[] | null
          target_units?: Json | null
          target_water_types?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_scheduling_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_scheduling_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_scheduling_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_scheduling_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          applicable_property_types: string[] | null
          applicable_unit_types: string[] | null
          applicable_water_types: string[] | null
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          template_config: Json
          template_name: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          applicable_property_types?: string[] | null
          applicable_unit_types?: string[] | null
          applicable_water_types?: string[] | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          template_config: Json
          template_name: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          applicable_property_types?: string[] | null
          applicable_unit_types?: string[] | null
          applicable_water_types?: string[] | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          template_config?: Json
          template_name?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "schedule_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
        ]
      }
      service_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          photo_order: number | null
          photo_url: string
          service_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_order?: number | null
          photo_url: string
          service_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_order?: number | null
          photo_url?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_photos_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_photos_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_photos_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_photos_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "technician_today_services"
            referencedColumns: ["service_id"]
          },
        ]
      }
      services: {
        Row: {
          completed_at: string | null
          created_at: string | null
          flagged_for_training: boolean | null
          id: string
          notes: string | null
          plant_room_id: string | null
          property_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_date: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: Database["public"]["Enums"]["service_status"] | null
          technician_id: string | null
          unit_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          flagged_for_training?: boolean | null
          id?: string
          notes?: string | null
          plant_room_id?: string | null
          property_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_date?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: Database["public"]["Enums"]["service_status"] | null
          technician_id?: string | null
          unit_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          flagged_for_training?: boolean | null
          id?: string
          notes?: string | null
          plant_room_id?: string | null
          property_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_date?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: Database["public"]["Enums"]["service_status"] | null
          technician_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_plant_room_id_fkey"
            columns: ["plant_room_id"]
            isOneToOne: false
            referencedRelation: "plant_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "services_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "services_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "services_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "services_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_audit_log: {
        Row: {
          action_type: string
          company_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          record_id: string | null
          super_admin_id: string
          table_name: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          super_admin_id: string
          table_name?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          super_admin_id?: string
          table_name?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_admin_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "super_admin_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "super_admin_audit_log_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_admin_audit_log_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      super_admin_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          session_token: string
          super_admin_id: string
          target_company_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          session_token: string
          super_admin_id: string
          target_company_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          session_token?: string
          super_admin_id?: string
          target_company_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_sessions_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_admin_sessions_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "super_admin_sessions_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_admin_sessions_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "super_admin_sessions_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string | null
          created_at: string | null
          customer_id: string | null
          email: string
          id: string
          invited_by: string | null
          is_revoked: boolean | null
          role: string
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          email: string
          id?: string
          invited_by?: string | null
          is_revoked?: boolean | null
          role: string
          token?: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          is_revoked?: boolean | null
          role?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "team_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "team_invitations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      time_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string | null
          id: string
          notes: string | null
          property_id: string | null
          total_hours: number | null
          user_id: string | null
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          total_hours?: number | null
          user_id?: string | null
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          total_hours?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "time_entries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      training_flags: {
        Row: {
          created_at: string | null
          flag_category: string | null
          flag_reason: string | null
          flagged_by: string | null
          id: string
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          service_id: string | null
          technician_id: string | null
        }
        Insert: {
          created_at?: string | null
          flag_category?: string | null
          flag_reason?: string | null
          flagged_by?: string | null
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          service_id?: string | null
          technician_id?: string | null
        }
        Update: {
          created_at?: string | null
          flag_category?: string | null
          flag_reason?: string | null
          flagged_by?: string | null
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          service_id?: string | null
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "training_flags_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_flags_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_flags_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_flags_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "technician_today_services"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "training_flags_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_flags_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      units: {
        Row: {
          billing_entity: Database["public"]["Enums"]["billing_entity"] | null
          created_at: string | null
          customer_id: string | null
          depth_meters: number | null
          id: string
          is_active: boolean | null
          last_service_warning_days: number | null
          name: string
          notes: string | null
          property_id: string | null
          risk_category: Database["public"]["Enums"]["risk_category"] | null
          service_frequency:
            | Database["public"]["Enums"]["service_frequency"]
            | null
          unit_number: string | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string | null
          volume_litres: number | null
          water_type: Database["public"]["Enums"]["water_type"] | null
        }
        Insert: {
          billing_entity?: Database["public"]["Enums"]["billing_entity"] | null
          created_at?: string | null
          customer_id?: string | null
          depth_meters?: number | null
          id?: string
          is_active?: boolean | null
          last_service_warning_days?: number | null
          name: string
          notes?: string | null
          property_id?: string | null
          risk_category?: Database["public"]["Enums"]["risk_category"] | null
          service_frequency?:
            | Database["public"]["Enums"]["service_frequency"]
            | null
          unit_number?: string | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at?: string | null
          volume_litres?: number | null
          water_type?: Database["public"]["Enums"]["water_type"] | null
        }
        Update: {
          billing_entity?: Database["public"]["Enums"]["billing_entity"] | null
          created_at?: string | null
          customer_id?: string | null
          depth_meters?: number | null
          id?: string
          is_active?: boolean | null
          last_service_warning_days?: number | null
          name?: string
          notes?: string | null
          property_id?: string | null
          risk_category?: Database["public"]["Enums"]["risk_category"] | null
          service_frequency?:
            | Database["public"]["Enums"]["service_frequency"]
            | null
          unit_number?: string | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string | null
          volume_litres?: number | null
          water_type?: Database["public"]["Enums"]["water_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "units_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
        ]
      }
      water_tests: {
        Row: {
          alkalinity: number | null
          all_parameters_ok: boolean | null
          bromine: number | null
          calcium: number | null
          chlorine: number | null
          created_at: string | null
          cyanuric: number | null
          id: string
          is_filter_cleaned: boolean | null
          is_pump_running: boolean | null
          is_water_warm: boolean | null
          notes: string | null
          ph: number | null
          salt: number | null
          service_id: string | null
          temperature: number | null
          test_time: string | null
          turbidity: number | null
        }
        Insert: {
          alkalinity?: number | null
          all_parameters_ok?: boolean | null
          bromine?: number | null
          calcium?: number | null
          chlorine?: number | null
          created_at?: string | null
          cyanuric?: number | null
          id?: string
          is_filter_cleaned?: boolean | null
          is_pump_running?: boolean | null
          is_water_warm?: boolean | null
          notes?: string | null
          ph?: number | null
          salt?: number | null
          service_id?: string | null
          temperature?: number | null
          test_time?: string | null
          turbidity?: number | null
        }
        Update: {
          alkalinity?: number | null
          all_parameters_ok?: boolean | null
          bromine?: number | null
          calcium?: number | null
          chlorine?: number | null
          created_at?: string | null
          cyanuric?: number | null
          id?: string
          is_filter_cleaned?: boolean | null
          is_pump_running?: boolean | null
          is_water_warm?: boolean | null
          notes?: string | null
          ph?: number | null
          salt?: number | null
          service_id?: string | null
          temperature?: number | null
          test_time?: string | null
          turbidity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "water_tests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_tests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_tests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_tests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "technician_today_services"
            referencedColumns: ["service_id"]
          },
        ]
      }
      wholesale_pickups: {
        Row: {
          chemical_type: string
          company_id: string | null
          cost: number | null
          created_at: string | null
          customer_id: string | null
          id: string
          notes: string | null
          pickup_date: string | null
          quantity: number
          unit_of_measure: string | null
        }
        Insert: {
          chemical_type: string
          company_id?: string | null
          cost?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          pickup_date?: string | null
          quantity: number
          unit_of_measure?: string | null
        }
        Update: {
          chemical_type?: string
          company_id?: string | null
          cost?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          pickup_date?: string | null
          quantity?: number
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_pickups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wholesale_pickups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "wholesale_pickups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "wholesale_pickups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wholesale_pickups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      compliance_summary: {
        Row: {
          last_violation_date: string | null
          open_violations: number | null
          property_id: string | null
          property_name: string | null
          resolved_violations: number | null
        }
        Relationships: []
      }
      customers_optimized: {
        Row: {
          active_property_count: number | null
          active_unit_count: number | null
          address: string | null
          billing_email: string | null
          city: string | null
          company_id: string | null
          created_at: string | null
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          email: string | null
          id: string | null
          is_active: boolean | null
          last_service_date: string | null
          name: string | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          property_count: number | null
          state: string | null
          today_services: number | null
          total_services: number | null
          unit_count: number | null
          updated_at: string | null
          water_quality_issues: number | null
          week_services: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
        ]
      }
      dashboard_stats: {
        Row: {
          company_id: string | null
          company_name: string | null
          property_count: number | null
          recent_services: number | null
          today_bookings: number | null
          today_services: number | null
          total_services: number | null
          unit_count: number | null
          water_quality_issues: number | null
          week_services: number | null
        }
        Relationships: []
      }
      dashboard_stats_optimized: {
        Row: {
          company_id: string | null
          company_name: string | null
          completed_today: number | null
          in_progress_services: number | null
          property_count: number | null
          recent_services: number | null
          scheduled_today: number | null
          today_bookings: number | null
          today_services: number | null
          total_services: number | null
          unit_count: number | null
          water_quality_issues: number | null
          week_services: number | null
        }
        Relationships: []
      }
      properties_optimized: {
        Row: {
          active_unit_count: number | null
          address: string | null
          billing_type: string | null
          city: string | null
          company_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          id: string | null
          is_active: boolean | null
          last_service_date: string | null
          name: string | null
          notes: string | null
          postal_code: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          risk_category: Database["public"]["Enums"]["risk_category"] | null
          state: string | null
          timezone: string | null
          today_services: number | null
          total_services: number | null
          total_volume_litres: number | null
          unit_count: number | null
          updated_at: string | null
          water_quality_issues: number | null
          week_services: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "properties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      services_optimized: {
        Row: {
          alkalinity: number | null
          all_parameters_ok: boolean | null
          bromine: number | null
          calcium: number | null
          chlorine: number | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          cyanuric: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          ph: number | null
          plant_room_id: string | null
          plant_room_name: string | null
          property_id: string | null
          property_name: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          salt: number | null
          service_date: string | null
          service_notes: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: Database["public"]["Enums"]["service_status"] | null
          technician_id: string | null
          technician_name: string | null
          temperature: number | null
          test_time: string | null
          turbidity: number | null
          unit_id: string | null
          unit_name: string | null
          unit_number: string | null
          unit_type: Database["public"]["Enums"]["unit_type"] | null
          water_test_id: string | null
          water_test_notes: string | null
          water_type: Database["public"]["Enums"]["water_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "services_plant_room_id_fkey"
            columns: ["plant_room_id"]
            isOneToOne: false
            referencedRelation: "plant_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "services_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "services_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "services_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_optimized"
            referencedColumns: ["id"]
          },
        ]
      }
      services_with_details: {
        Row: {
          alkalinity: number | null
          all_parameters_ok: boolean | null
          bromine: number | null
          calcium: number | null
          chlorine: number | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          cyanuric: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          ph: number | null
          property_id: string | null
          property_name: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          salt: number | null
          service_date: string | null
          service_notes: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: Database["public"]["Enums"]["service_status"] | null
          technician_id: string | null
          technician_name: string | null
          temperature: number | null
          test_time: string | null
          turbidity: number | null
          unit_id: string | null
          unit_name: string | null
          unit_number: string | null
          unit_type: Database["public"]["Enums"]["unit_type"] | null
          water_test_id: string | null
          water_test_notes: string | null
          water_type: Database["public"]["Enums"]["water_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
        ]
      }
      technician_today_services: {
        Row: {
          plant_room_name: string | null
          property_name: string | null
          service_date: string | null
          service_id: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: Database["public"]["Enums"]["service_status"] | null
          technician_id: string | null
          unit_name: string | null
          unit_number: string | null
          unit_type: Database["public"]["Enums"]["unit_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "services_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      units_optimized: {
        Row: {
          billing_entity: Database["public"]["Enums"]["billing_entity"] | null
          company_id: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          depth_meters: number | null
          id: string | null
          is_active: boolean | null
          last_service_date: string | null
          last_service_warning_days: number | null
          name: string | null
          next_service_due: string | null
          notes: string | null
          property_id: string | null
          property_name: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          risk_category: Database["public"]["Enums"]["risk_category"] | null
          service_frequency:
            | Database["public"]["Enums"]["service_frequency"]
            | null
          today_services: number | null
          total_services: number | null
          unit_number: string | null
          unit_type: Database["public"]["Enums"]["unit_type"] | null
          updated_at: string | null
          volume_litres: number | null
          water_quality_issues: number | null
          water_type: Database["public"]["Enums"]["water_type"] | null
          week_services: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_optimized"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "units_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "compliance_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "services_with_details"
            referencedColumns: ["property_id"]
          },
        ]
      }
    }
    Functions: {
      create_profile_for_user: {
        Args: {
          first_name?: string
          last_name?: string
          user_email: string
          user_id: string
        }
        Returns: undefined
      }
      current_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      ensure_user_profile: {
        Args: {
          first_name?: string
          last_name?: string
          user_email: string
          user_id: string
        }
        Returns: boolean
      }
      get_all_companies: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          user_count: number
        }[]
      }
      get_company_dashboard_stats: {
        Args: { company_uuid: string }
        Returns: {
          property_count: number
          recent_services: number
          today_bookings: number
          today_services: number
          total_services: number
          unit_count: number
          water_quality_issues: number
          week_services: number
        }[]
      }
      get_company_stats: {
        Args: { company_uuid: string }
        Returns: {
          company_name: string
          last_activity: string
          property_count: number
          service_count: number
          unit_count: number
          user_count: number
        }[]
      }
      get_property_stats: {
        Args: { property_uuid: string }
        Returns: {
          last_service_date: string
          today_services: number
          total_services: number
          unit_count: number
          water_quality_issues: number
          week_services: number
        }[]
      }
      is_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_super_admin_action: {
        Args: {
          p_action_type: string
          p_company_id?: string
          p_details?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
      super_admin_target_company: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      billing_entity: "property" | "unit_owner" | "hotel" | "body_corporate"
      business_type: "residential" | "commercial" | "both"
      customer_type:
        | "property_owner"
        | "body_corporate"
        | "hotel"
        | "property_manager"
        | "b2b_wholesale"
      property_type: "residential" | "commercial" | "resort" | "body_corporate"
      risk_category: "low" | "medium" | "high"
      service_frequency:
        | "daily_when_occupied"
        | "daily"
        | "twice_weekly"
        | "weekly"
        | "biweekly"
        | "monthly"
        | "custom"
      service_status: "scheduled" | "in_progress" | "completed" | "skipped"
      service_type:
        | "test_only"
        | "full_service"
        | "equipment_check"
        | "plant_room_check"
      unit_type:
        | "residential_pool"
        | "main_pool"
        | "kids_pool"
        | "main_spa"
        | "rooftop_spa"
        | "plunge_pool"
        | "villa_pool"
        | "splash_park"
      user_role: "owner" | "technician" | "super_admin"
      water_type: "saltwater" | "freshwater" | "bromine"
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
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      oauth_authorization_status: ["pending", "approved", "denied", "expired"],
      oauth_client_type: ["public", "confidential"],
      oauth_registration_type: ["dynamic", "manual"],
      oauth_response_type: ["code"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
  public: {
    Enums: {
      billing_entity: ["property", "unit_owner", "hotel", "body_corporate"],
      business_type: ["residential", "commercial", "both"],
      customer_type: [
        "property_owner",
        "body_corporate",
        "hotel",
        "property_manager",
        "b2b_wholesale",
      ],
      property_type: ["residential", "commercial", "resort", "body_corporate"],
      risk_category: ["low", "medium", "high"],
      service_frequency: [
        "daily_when_occupied",
        "daily",
        "twice_weekly",
        "weekly",
        "biweekly",
        "monthly",
        "custom",
      ],
      service_status: ["scheduled", "in_progress", "completed", "skipped"],
      service_type: [
        "test_only",
        "full_service",
        "equipment_check",
        "plant_room_check",
      ],
      unit_type: [
        "residential_pool",
        "main_pool",
        "kids_pool",
        "main_spa",
        "rooftop_spa",
        "plunge_pool",
        "villa_pool",
        "splash_park",
      ],
      user_role: ["owner", "technician", "super_admin"],
      water_type: ["saltwater", "freshwater", "bromine"],
    },
  },
} as const
