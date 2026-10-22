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
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          source: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          source?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: string
          classification: string | null
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          platform: string | null
          slug: string
          source_id: string
          status: string
          updated_at: string
          url: string | null
          version: string | null
          visibility: string
        }
        Insert: {
          asset_type: string
          classification?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          platform?: string | null
          slug: string
          source_id: string
          status?: string
          updated_at?: string
          url?: string | null
          version?: string | null
          visibility?: string
        }
        Update: {
          asset_type?: string
          classification?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          platform?: string | null
          slug?: string
          source_id?: string
          status?: string
          updated_at?: string
          url?: string | null
          version?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_sessions: {
        Row: {
          assistant_key: string
          context: Json
          created_at: string
          ended_at: string | null
          id: string
          organization_id: string
          started_at: string
          status: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_key: string
          context?: Json
          created_at?: string
          ended_at?: string | null
          id?: string
          organization_id: string
          started_at?: string
          status?: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_key?: string
          context?: Json
          created_at?: string
          ended_at?: string | null
          id?: string
          organization_id?: string
          started_at?: string
          status?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_configs: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          organization_id: string
          slug: string
          updated_at: string
          version: number
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          organization_id: string
          slug: string
          updated_at?: string
          version?: number
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brokerflow_deals: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          id: string
          lead_id: string
          organization_id: string
          pipeline_stage: string
          review_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          id?: string
          lead_id: string
          organization_id: string
          pipeline_stage?: string
          review_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          id?: string
          lead_id?: string
          organization_id?: string
          pipeline_stage?: string
          review_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokerflow_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerflow_deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerflow_deals_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "brokerflow_review_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      brokerflow_document_requests: {
        Row: {
          checklist: Json
          checklist_reference: string
          created_at: string
          created_by: string
          deal_id: string | null
          delivery_status: string
          draft: string
          id: string
          idempotency_hash: string
          lead_id: string | null
          missing_documents: Json
          organization_id: string
          request_fingerprint: string
          result: Json
          review_id: string | null
          status: string
          submitted_documents: Json
        }
        Insert: {
          checklist: Json
          checklist_reference: string
          created_at?: string
          created_by: string
          deal_id?: string | null
          delivery_status?: string
          draft: string
          id: string
          idempotency_hash: string
          lead_id?: string | null
          missing_documents: Json
          organization_id: string
          request_fingerprint: string
          result: Json
          review_id?: string | null
          status?: string
          submitted_documents: Json
        }
        Update: {
          checklist?: Json
          checklist_reference?: string
          created_at?: string
          created_by?: string
          deal_id?: string | null
          delivery_status?: string
          draft?: string
          id?: string
          idempotency_hash?: string
          lead_id?: string | null
          missing_documents?: Json
          organization_id?: string
          request_fingerprint?: string
          result?: Json
          review_id?: string | null
          status?: string
          submitted_documents?: Json
        }
        Relationships: [
          {
            foreignKeyName: "brokerflow_document_requests_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brokerflow_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerflow_document_requests_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "brokerflow_follow_up_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerflow_document_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerflow_document_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerflow_document_requests_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "brokerflow_review_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      brokerflow_follow_up_task_events: {
        Row: {
          actor_user_id: string
          created_at: string
          event_type: string
          id: string
          idempotency_hash: string
          organization_id: string
          request_fingerprint: string
          task_id: string
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          event_type: string
          id?: string
          idempotency_hash: string
          organization_id: string
          request_fingerprint: string
          task_id: string
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          event_type?: string
          id?: string
          idempotency_hash?: string
          organization_id?: string
          request_fingerprint?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokerflow_follow_up_task_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerflow_follow_up_task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "brokerflow_follow_up_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      brokerflow_follow_up_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          completion_idempotency_hash: string | null
          completion_request_fingerprint: string | null
          create_idempotency_hash: string
          create_request_fingerprint: string
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          id: string
          organization_id: string
          review_id: string | null
          status: string
          task_type: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_idempotency_hash?: string | null
          completion_request_fingerprint?: string | null
          create_idempotency_hash: string
          create_request_fingerprint: string
          created_at?: string
          created_by: string
          description?: string
          due_date?: string | null
          id?: string
          organization_id: string
          review_id?: string | null
          status?: string
          task_type: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_idempotency_hash?: string | null
          completion_request_fingerprint?: string | null
          create_idempotency_hash?: string
          create_request_fingerprint?: string
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          review_id?: string | null
          status?: string
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokerflow_follow_up_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerflow_follow_up_tasks_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "brokerflow_review_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      brokerflow_rate_limits: {
        Row: {
          identity_hash: string
          request_count: number
          scope: string
          window_start: string
        }
        Insert: {
          identity_hash: string
          request_count: number
          scope: string
          window_start: string
        }
        Update: {
          identity_hash?: string
          request_count?: number
          scope?: string
          window_start?: string
        }
        Relationships: []
      }
      brokerflow_review_events: {
        Row: {
          action_actor_scope: string | null
          actor_source: string
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          idempotency_hash: string
          new_status: string
          note: string | null
          organization_id: string
          previous_status: string | null
          request_fingerprint: string
          result: Json | null
          review_id: string
          version: number
        }
        Insert: {
          action_actor_scope?: string | null
          actor_source: string
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          idempotency_hash: string
          new_status: string
          note?: string | null
          organization_id: string
          previous_status?: string | null
          request_fingerprint: string
          result?: Json | null
          review_id: string
          version: number
        }
        Update: {
          action_actor_scope?: string | null
          actor_source?: string
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          idempotency_hash?: string
          new_status?: string
          note?: string | null
          organization_id?: string
          previous_status?: string | null
          request_fingerprint?: string
          result?: Json | null
          review_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "brokerflow_review_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokerflow_review_events_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "brokerflow_review_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      brokerflow_review_requests: {
        Row: {
          borrower_type: string
          business_name: string | null
          create_actor_scope: string
          create_idempotency_hash: string
          created_at: string
          created_by: string | null
          id: string
          loan_purpose: string
          organization_id: string
          recommended_review_path: string | null
          request_fingerprint: string
          requested_amount: number
          requester_name: string
          review_request_id: string
          scenario: Json
          source: string
          state: string
          status: string
          updated_at: string
          urgency: string
          version: number
        }
        Insert: {
          borrower_type: string
          business_name?: string | null
          create_actor_scope: string
          create_idempotency_hash: string
          created_at?: string
          created_by?: string | null
          id?: string
          loan_purpose: string
          organization_id: string
          recommended_review_path?: string | null
          request_fingerprint: string
          requested_amount: number
          requester_name: string
          review_request_id: string
          scenario?: Json
          source: string
          state: string
          status?: string
          updated_at?: string
          urgency?: string
          version?: number
        }
        Update: {
          borrower_type?: string
          business_name?: string | null
          create_actor_scope?: string
          create_idempotency_hash?: string
          created_at?: string
          created_by?: string | null
          id?: string
          loan_purpose?: string
          organization_id?: string
          recommended_review_path?: string | null
          request_fingerprint?: string
          requested_amount?: number
          requester_name?: string
          review_request_id?: string
          scenario?: Json
          source?: string
          state?: string
          status?: string
          updated_at?: string
          urgency?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "brokerflow_review_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_projects: {
        Row: {
          brief: Json
          created_at: string
          id: string
          name: string
          organization_id: string
          owner_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          brief?: Json
          created_at?: string
          id?: string
          name: string
          organization_id: string
          owner_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          brief?: Json
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          owner_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_content: {
        Row: {
          body: string | null
          content_project_id: string
          content_type: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          model: string | null
          organization_id: string
          prompt_hash: string | null
          provider: string | null
          status: string
          title: string | null
          updated_at: string
          usage: Json
        }
        Insert: {
          body?: string | null
          content_project_id: string
          content_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          model?: string | null
          organization_id: string
          prompt_hash?: string | null
          provider?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          usage?: Json
        }
        Update: {
          body?: string | null
          content_project_id?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          model?: string | null
          organization_id?: string
          prompt_hash?: string | null
          provider?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          usage?: Json
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_content_project_id_fkey"
            columns: ["content_project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          credentials_ref: string | null
          id: string
          last_verified_at: string | null
          name: string
          organization_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          credentials_ref?: string | null
          id?: string
          last_verified_at?: string | null
          name: string
          organization_id: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          credentials_ref?: string | null
          id?: string
          last_verified_at?: string | null
          name?: string
          organization_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          idempotency_key: string | null
          lead_id: string
          occurred_at: string
          organization_id: string
          payload: Json
          source: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          idempotency_key?: string | null
          lead_id: string
          occurred_at?: string
          organization_id: string
          payload?: Json
          source?: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string | null
          lead_id?: string
          occurred_at?: string
          organization_id?: string
          payload?: Json
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          created_at: string
          created_by: string | null
          factors: Json
          id: string
          lead_id: string
          model_key: string
          model_version: string
          organization_id: string
          score: number
          scored_at: string
          tier: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          factors?: Json
          id?: string
          lead_id: string
          model_key: string
          model_version: string
          organization_id: string
          score: number
          scored_at?: string
          tier: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          factors?: Json
          id?: string
          lead_id?: string
          model_key?: string
          model_version?: string
          organization_id?: string
          score?: number
          scored_at?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          attribution: Json
          company_name: string | null
          consent_at: string | null
          created_at: string
          created_by: string | null
          email: string | null
          external_id: string | null
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json
          organization_id: string
          phone: string | null
          qualification: Json
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attribution?: Json
          company_name?: string | null
          consent_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          external_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json
          organization_id: string
          phone?: string | null
          qualification?: Json
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attribution?: Json
          company_name?: string | null
          consent_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          external_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json
          organization_id?: string
          phone?: string | null
          qualification?: Json
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_system: boolean
          name: string
          settings: Json
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean
          name: string
          settings?: Json
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean
          name?: string
          settings?: Json
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          agency_name: string | null
          answers: Json
          applicant_name: string | null
          applicant_type: string
          email: string | null
          external_submission_id: string | null
          form_id: string | null
          id: string
          organization_id: string
          owner_user_id: string | null
          partner_id: string | null
          received_at: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          agency_name?: string | null
          answers?: Json
          applicant_name?: string | null
          applicant_type?: string
          email?: string | null
          external_submission_id?: string | null
          form_id?: string | null
          id?: string
          organization_id: string
          owner_user_id?: string | null
          partner_id?: string | null
          received_at?: string
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          agency_name?: string | null
          answers?: Json
          applicant_name?: string | null
          applicant_type?: string
          email?: string | null
          external_submission_id?: string | null
          form_id?: string | null
          id?: string
          organization_id?: string
          owner_user_id?: string | null
          partner_id?: string | null
          received_at?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_applications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_follow_up_tasks: {
        Row: {
          application_id: string | null
          created_at: string
          due_at: string | null
          id: string
          notes: string | null
          organization_id: string
          owner_user_id: string | null
          partner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          owner_user_id?: string | null
          partner_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          owner_user_id?: string | null
          partner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_follow_up_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_follow_up_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_follow_up_tasks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_intake_events: {
        Row: {
          application_id: string | null
          created_at: string
          event_type: string
          external_event_id: string | null
          id: string
          organization_id: string
          partner_id: string | null
          payload: Json
          source: string
          summary: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          event_type: string
          external_event_id?: string | null
          id?: string
          organization_id: string
          partner_id?: string | null
          payload?: Json
          source: string
          summary?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          event_type?: string
          external_event_id?: string | null
          id?: string
          organization_id?: string
          partner_id?: string | null
          payload?: Json
          source?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_intake_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_intake_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_intake_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_portal_accounts: {
        Row: {
          created_at: string
          created_by: string | null
          organization_id: string
          partner_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          organization_id: string
          partner_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          organization_id?: string
          partner_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_portal_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_portal_accounts_partner_id_organization_id_fkey"
            columns: ["partner_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      partners: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          external_id: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          partner_code: string
          partner_type: string
          status: string
          terms: Json
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          partner_code: string
          partner_type: string
          status?: string
          terms?: Json
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          partner_code?: string
          partner_type?: string
          status?: string
          terms?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string
          id: string
          key: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          key: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          lead_id: string
          metadata: Json
          organization_id: string
          partner_id: string
          referred_at: string
          status: string
          updated_at: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json
          organization_id: string
          partner_id: string
          referred_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json
          organization_id?: string
          partner_id?: string
          referred_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          key: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          cursor: Json
          error_summary: string | null
          id: string
          integration_connection_id: string | null
          metrics: Json
          organization_id: string
          started_at: string | null
          status: string
          sync_type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          cursor?: Json
          error_summary?: string | null
          id?: string
          integration_connection_id?: string | null
          metrics?: Json
          organization_id: string
          started_at?: string | null
          status?: string
          sync_type: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          cursor?: Json
          error_summary?: string | null
          id?: string
          integration_connection_id?: string | null
          metrics?: Json
          organization_id?: string
          started_at?: string | null
          status?: string
          sync_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_integration_connection_id_fkey"
            columns: ["integration_connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_links: {
        Row: {
          campaign: string | null
          created_at: string
          created_by: string | null
          destination_url: string
          id: string
          is_active: boolean
          metadata: Json
          organization_id: string
          partner_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          created_by?: string | null
          destination_url: string
          id?: string
          is_active?: boolean
          metadata?: Json
          organization_id: string
          partner_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          campaign?: string | null
          created_at?: string
          created_by?: string | null
          destination_url?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          organization_id?: string
          partner_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      vertical_configs: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          organization_id: string
          slug: string
          updated_at: string
          version: number
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          organization_id: string
          slug: string
          updated_at?: string
          version?: number
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "vertical_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          direction: string
          event_type: string
          id: string
          idempotency_key: string
          integration_connection_id: string | null
          last_error: string | null
          next_attempt_at: string | null
          organization_id: string
          payload: Json
          response_status: number | null
          status: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          direction: string
          event_type: string
          id?: string
          idempotency_key: string
          integration_connection_id?: string | null
          last_error?: string | null
          next_attempt_at?: string | null
          organization_id: string
          payload?: Json
          response_status?: number | null
          status?: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          direction?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          integration_connection_id?: string | null
          last_error?: string | null
          next_attempt_at?: string | null
          organization_id?: string
          payload?: Json
          response_status?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_integration_connection_id_fkey"
            columns: ["integration_connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_configs: {
        Row: {
          allowed_origins: string[]
          asset_id: string | null
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_public: boolean
          name: string
          organization_id: string
          slug: string
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          allowed_origins?: string[]
          asset_id?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          name: string
          organization_id: string
          slug: string
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          allowed_origins?: string[]
          asset_id?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          name?: string
          organization_id?: string
          slug?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "widget_configs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          idempotency_key: string | null
          lead_id: string | null
          occurred_at: string
          organization_id: string
          payload: Json
          session_id: string | null
          widget_config_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          idempotency_key?: string | null
          lead_id?: string | null
          occurred_at?: string
          organization_id: string
          payload?: Json
          session_id?: string | null
          widget_config_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string | null
          lead_id?: string | null
          occurred_at?: string
          organization_id?: string
          payload?: Json
          session_id?: string | null
          widget_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_events_widget_config_id_fkey"
            columns: ["widget_config_id"]
            isOneToOne: false
            referencedRelation: "widget_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      brokerflow_apply_review_action: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_expected_version: number
          p_idempotency_key: string
          p_next_status: string
          p_note: string
          p_organization_id: string
          p_review_id: string
        }
        Returns: Json
      }
      brokerflow_capture_borrower_intake: {
        Args: {
          p_actor_user_id: string
          p_idempotency_key: string
          p_input: Json
          p_organization_id: string
        }
        Returns: Json
      }
      brokerflow_capture_partner_referral: {
        Args: {
          p_actor_user_id: string
          p_idempotency_key: string
          p_input: Json
          p_organization_id: string
        }
        Returns: Json
      }
      brokerflow_complete_follow_up_task: {
        Args: {
          p_actor_user_id: string
          p_idempotency_key: string
          p_organization_id: string
          p_task_id: string
        }
        Returns: Json
      }
      brokerflow_consume_rate_limit: {
        Args: {
          p_identity: string
          p_limit: number
          p_scope: string
          p_window_seconds?: number
        }
        Returns: Json
      }
      brokerflow_create_follow_up_task: {
        Args: {
          p_actor_user_id: string
          p_idempotency_key: string
          p_organization_id: string
          p_task: Json
        }
        Returns: Json
      }
      brokerflow_create_review: {
        Args: {
          p_actor_user_id: string
          p_idempotency_key: string
          p_organization_id: string
          p_scenario: Json
        }
        Returns: Json
      }
      brokerflow_lookup_deal_status: {
        Args: {
          p_actor_user_id: string
          p_input: Json
          p_organization_id: string
        }
        Returns: Json
      }
      brokerflow_mcp_audience_hook: { Args: { event: Json }; Returns: Json }
      brokerflow_request_lender_match_review: {
        Args: {
          p_actor_user_id: string
          p_idempotency_key: string
          p_input: Json
          p_organization_id: string
        }
        Returns: Json
      }
      brokerflow_trigger_missing_document_request: {
        Args: {
          p_actor_user_id: string
          p_idempotency_key: string
          p_input: Json
          p_organization_id: string
        }
        Returns: Json
      }
      claim_partner_portal_access: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      complete_partner_follow_up: {
        Args: { p_task_id: string }
        Returns: boolean
      }
      create_partner_tracking_link: {
        Args: { p_campaign: string; p_destination_url: string; p_slug: string }
        Returns: string
      }
      submit_partner_referral: {
        Args: {
          p_business_name: string
          p_consent_confirmed: boolean
          p_contact_name: string
          p_email: string
          p_phone: string
          p_request_id: string
        }
        Returns: string
      }
      triage_partner_application: {
        Args: { p_application_id: string; p_status: string }
        Returns: string
      }
      update_partner_operational_fields: {
        Args: {
          p_partner_id: string
          p_status: string
          p_partner_type: string
        }
        Returns: string
      }
      update_partner_portal_profile: {
        Args: {
          p_phone: string
          p_website_url: string
          p_service_area: string
          p_business_summary: string
        }
        Returns: string
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
    Enums: {},
  },
} as const
