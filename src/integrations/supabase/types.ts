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
      achievements: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          icon: string | null
          id: string
          name: string
          rarity: string
          threshold_kind: string | null
          threshold_value: number | null
          xp_reward: number
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          name: string
          rarity?: string
          threshold_kind?: string | null
          threshold_value?: number | null
          xp_reward?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          name?: string
          rarity?: string
          threshold_kind?: string | null
          threshold_value?: number | null
          xp_reward?: number
        }
        Relationships: []
      }
      activities: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["activity_kind"]
          payload: Json | null
          project_id: string | null
          task_id: string | null
          tenant_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["activity_kind"]
          payload?: Json | null
          project_id?: string | null
          task_id?: string | null
          tenant_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["activity_kind"]
          payload?: Json | null
          project_id?: string | null
          task_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_boosts: {
        Row: {
          budget_cents: number
          campaign_id: string | null
          channel: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          external_id: string | null
          id: string
          notes: string | null
          objective: string
          revenue_cents: number
          spent_cents: number
          starts_at: string
          status: string
          task_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          budget_cents?: number
          campaign_id?: string | null
          channel: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          external_id?: string | null
          id?: string
          notes?: string | null
          objective?: string
          revenue_cents?: number
          spent_cents?: number
          starts_at?: string
          status?: string
          task_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          budget_cents?: number
          campaign_id?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          external_id?: string | null
          id?: string
          notes?: string | null
          objective?: string
          revenue_cents?: number
          spent_cents?: number
          starts_at?: string
          status?: string
          task_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_boosts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_boosts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_boosts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interactions: {
        Row: {
          cost_cents: number | null
          created_at: string
          feature: string
          id: string
          model: string | null
          prompt: string | null
          response: string | null
          task_id: string | null
          tenant_id: string
          tokens_in: number | null
          tokens_out: number | null
          user_id: string | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          feature: string
          id?: string
          model?: string | null
          prompt?: string | null
          response?: string | null
          task_id?: string | null
          tenant_id: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          feature?: string
          id?: string
          model?: string | null
          prompt?: string | null
          response?: string | null
          task_id?: string | null
          tenant_id?: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          acted_at: string | null
          body: string | null
          context_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          kind: string
          payload: Json
          status: string
          tenant_id: string
          title: string
          user_id: string
        }
        Insert: {
          acted_at?: string | null
          body?: string | null
          context_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kind: string
          payload?: Json
          status?: string
          tenant_id: string
          title: string
          user_id: string
        }
        Update: {
          acted_at?: string | null
          body?: string | null
          context_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          payload?: Json
          status?: string
          tenant_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_summaries: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          metrics: Json
          period_date: string
          squad_id: string | null
          tenant_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind: string
          metrics?: Json
          period_date: string
          squad_id?: string | null
          tenant_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          metrics?: Json
          period_date?: string
          squad_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_summaries_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_summaries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_tokens: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
          tenant_id: string
          token_hash: string
          token_prefix: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[]
          tenant_id: string
          token_hash: string
          token_prefix: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          tenant_id?: string
          token_hash?: string
          token_prefix?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_events: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: number
          method: string
          resource: string
          status_code: number | null
          tenant_id: string | null
          token_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: never
          method: string
          resource: string
          status_code?: number | null
          tenant_id?: string | null
          token_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: never
          method?: string
          resource?: string
          status_code?: number | null
          tenant_id?: string | null
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_events_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "api_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_decisions: {
        Row: {
          comment: string | null
          created_at: string
          decided_by: string
          decision: Database["public"]["Enums"]["decision_kind"]
          id: string
          instance_id: string
          step_id: string
          tenant_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          decided_by: string
          decision: Database["public"]["Enums"]["decision_kind"]
          id?: string
          instance_id: string
          step_id: string
          tenant_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          decided_by?: string
          decision?: Database["public"]["Enums"]["decision_kind"]
          id?: string
          instance_id?: string
          step_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_decisions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "approval_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_decisions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_instances: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step_position: number
          id: string
          notes: string | null
          requested_by: string
          status: Database["public"]["Enums"]["approval_status"]
          task_id: string | null
          tenant_id: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step_position?: number
          id?: string
          notes?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["approval_status"]
          task_id?: string | null
          tenant_id: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step_position?: number
          id?: string
          notes?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["approval_status"]
          task_id?: string | null
          tenant_id?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_instances_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          allow_skip: boolean
          approver_kind: Database["public"]["Enums"]["approver_kind"]
          approver_role: Database["public"]["Enums"]["tenant_role"] | null
          approver_user_id: string | null
          created_at: string
          id: string
          name: string
          position: number
          required_approvals: number
          tenant_id: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          allow_skip?: boolean
          approver_kind?: Database["public"]["Enums"]["approver_kind"]
          approver_role?: Database["public"]["Enums"]["tenant_role"] | null
          approver_user_id?: string | null
          created_at?: string
          id?: string
          name: string
          position: number
          required_approvals?: number
          tenant_id: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          allow_skip?: boolean
          approver_kind?: Database["public"]["Enums"]["approver_kind"]
          approver_role?: Database["public"]["Enums"]["tenant_role"] | null
          approver_user_id?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          required_approvals?: number
          tenant_id?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignment_matrix: {
        Row: {
          assignee_id: string | null
          created_at: string
          id: string
          priority: number
          project_id: string | null
          status_id: string | null
          tenant_id: string
          type_id: string | null
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          id?: string
          priority?: number
          project_id?: string | null
          status_id?: string | null
          tenant_id: string
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          id?: string
          priority?: number
          project_id?: string | null
          status_id?: string | null
          tenant_id?: string
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_matrix_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_matrix_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_matrix_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_matrix_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          bucket: string
          comment_id: string | null
          created_at: string
          filename: string
          id: string
          mime_type: string | null
          path: string
          size_bytes: number | null
          task_id: string | null
          tenant_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          bucket: string
          comment_id?: string | null
          created_at?: string
          filename: string
          id?: string
          mime_type?: string | null
          path: string
          size_bytes?: number | null
          task_id?: string | null
          tenant_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          bucket?: string
          comment_id?: string | null
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string | null
          path?: string
          size_bytes?: number | null
          task_id?: string | null
          tenant_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audiences: {
        Row: {
          channels: string[]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          persona_ids: string[]
          size_estimate: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channels?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          persona_ids?: string[]
          size_estimate?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channels?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          persona_ids?: string[]
          size_estimate?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audiences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_events: {
        Row: {
          created_at: string
          event: string
          id: string
          payload: Json
          processed_at: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          payload?: Json
          processed_at?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          actions: Json
          active: boolean
          color: string | null
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_template: boolean
          last_run_at: string | null
          name: string
          run_count: number
          template_category: string | null
          tenant_id: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          active?: boolean
          color?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_template?: boolean
          last_run_at?: string | null
          name: string
          run_count?: number
          template_category?: string | null
          tenant_id: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          active?: boolean
          color?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_template?: boolean
          last_run_at?: string | null
          name?: string
          run_count?: number
          template_category?: string | null
          tenant_id?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          actions_executed: number
          created_at: string
          error: string | null
          id: string
          payload: Json
          rule_id: string
          status: string
          tenant_id: string
          trigger_event: string
        }
        Insert: {
          actions_executed?: number
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          rule_id: string
          status?: string
          tenant_id: string
          trigger_event: string
        }
        Update: {
          actions_executed?: number
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          rule_id?: string
          status?: string
          tenant_id?: string
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          features: Json
          id: string
          max_members: number | null
          max_projects: number | null
          name: string
          position: number
          price_monthly: number
        }
        Insert: {
          features?: Json
          id: string
          max_members?: number | null
          max_projects?: number | null
          name: string
          position?: number
          price_monthly?: number
        }
        Update: {
          features?: Json
          id?: string
          max_members?: number | null
          max_projects?: number | null
          name?: string
          position?: number
          price_monthly?: number
        }
        Relationships: []
      }
      bio_links: {
        Row: {
          active: boolean
          clicks: number
          created_at: string
          ends_at: string | null
          icon: string | null
          id: string
          label: string
          page_id: string
          position: number
          starts_at: string | null
          tenant_id: string
          updated_at: string
          url: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          active?: boolean
          clicks?: number
          created_at?: string
          ends_at?: string | null
          icon?: string | null
          id?: string
          label: string
          page_id: string
          position?: number
          starts_at?: string | null
          tenant_id: string
          updated_at?: string
          url: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          active?: boolean
          clicks?: number
          created_at?: string
          ends_at?: string | null
          icon?: string | null
          id?: string
          label?: string
          page_id?: string
          position?: number
          starts_at?: string | null
          tenant_id?: string
          updated_at?: string
          url?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bio_links_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bio_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_pages: {
        Row: {
          active: boolean
          avatar_url: string | null
          bio: string | null
          created_at: string
          created_by: string | null
          id: string
          slug: string
          tenant_id: string
          theme: Json
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          slug: string
          tenant_id: string
          theme?: Json
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          slug?: string
          tenant_id?: string
          theme?: Json
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "bio_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      caption_snippets: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["social_channel"] | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          tags: string[] | null
          tenant_id: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          body: string
          channel?: Database["public"]["Enums"]["social_channel"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["social_channel"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      changelog_entries: {
        Row: {
          body_md: string
          created_at: string
          id: string
          kind: string
          released_at: string
          title: string
          version: string
        }
        Insert: {
          body_md: string
          created_at?: string
          id?: string
          kind?: string
          released_at?: string
          title: string
          version: string
        }
        Update: {
          body_md?: string
          created_at?: string
          id?: string
          kind?: string
          released_at?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      chat_integrations: {
        Row: {
          active: boolean
          channel: string | null
          created_at: string
          created_by: string
          events: string[]
          id: string
          last_sent_at: string | null
          name: string
          provider: string
          tenant_id: string
          webhook_url: string
        }
        Insert: {
          active?: boolean
          channel?: string | null
          created_at?: string
          created_by: string
          events?: string[]
          id?: string
          last_sent_at?: string | null
          name: string
          provider: string
          tenant_id: string
          webhook_url: string
        }
        Update: {
          active?: boolean
          channel?: string | null
          created_at?: string
          created_by?: string
          events?: string[]
          id?: string
          last_sent_at?: string | null
          name?: string
          provider?: string
          tenant_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_sessions: {
        Row: {
          amount: number | null
          billing_cycle: string
          completed_at: string | null
          created_at: string
          currency: string | null
          id: string
          payload: Json | null
          plan_slug: string
          return_url: string | null
          status: string
          stripe_session_id: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          billing_cycle?: string
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payload?: Json | null
          plan_slug: string
          return_url?: string | null
          status?: string
          stripe_session_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          billing_cycle?: string
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payload?: Json | null
          plan_slug?: string
          return_url?: string | null
          status?: string
          stripe_session_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          mentions: string[] | null
          parent_id: string | null
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          mentions?: string[] | null
          parent_id?: string | null
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          mentions?: string[] | null
          parent_id?: string | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_posts: {
        Row: {
          caption: string | null
          comments: number | null
          competitor_id: string
          created_at: string
          created_by: string | null
          id: string
          likes: number | null
          notes: string | null
          posted_at: string | null
          shares: number | null
          tenant_id: string
          thumbnail_url: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          caption?: string | null
          comments?: number | null
          competitor_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          likes?: number | null
          notes?: string | null
          posted_at?: string | null
          shares?: number | null
          tenant_id: string
          thumbnail_url?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          caption?: string | null
          comments?: number | null
          competitor_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          likes?: number | null
          notes?: string | null
          posted_at?: string | null
          shares?: number | null
          tenant_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_posts_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          channel: Database["public"]["Enums"]["social_channel"]
          created_at: string
          created_by: string | null
          followers: number | null
          handle: string | null
          id: string
          name: string
          notes: string | null
          tenant_id: string
          updated_at: string
          url: string | null
        }
        Insert: {
          channel?: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          created_by?: string | null
          followers?: number | null
          handle?: string | null
          id?: string
          name: string
          notes?: string | null
          tenant_id: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          created_by?: string | null
          followers?: number | null
          handle?: string | null
          id?: string
          name?: string
          notes?: string | null
          tenant_id?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      compliance_exports: {
        Row: {
          completed_at: string | null
          created_at: string
          date_from: string | null
          date_to: string | null
          file_url: string | null
          id: string
          kind: string
          requested_by: string
          status: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          file_url?: string | null
          id?: string
          kind: string
          requested_by: string
          status?: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          file_url?: string | null
          id?: string
          kind?: string
          requested_by?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_exports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_briefs: {
        Row: {
          angles: Json
          audience: string | null
          campaign_id: string | null
          channels: Database["public"]["Enums"]["social_channel"][]
          created_at: string
          created_by: string | null
          generated_by_ai: boolean
          hooks: Json
          id: string
          notes: string | null
          objective: string | null
          tenant_id: string
          title: string
          tone: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          angles?: Json
          audience?: string | null
          campaign_id?: string | null
          channels?: Database["public"]["Enums"]["social_channel"][]
          created_at?: string
          created_by?: string | null
          generated_by_ai?: boolean
          hooks?: Json
          id?: string
          notes?: string | null
          objective?: string | null
          tenant_id: string
          title: string
          tone?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          angles?: Json
          audience?: string | null
          campaign_id?: string | null
          channels?: Database["public"]["Enums"]["social_channel"][]
          created_at?: string
          created_by?: string | null
          generated_by_ai?: boolean
          hooks?: Json
          id?: string
          notes?: string | null
          objective?: string | null
          tenant_id?: string
          title?: string
          tone?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      copilot_conversations: {
        Row: {
          context: Json
          created_at: string
          id: string
          tenant_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          tenant_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          tenant_id: string
          tool_calls: Json | null
          tool_name: string | null
          tool_result: Json | null
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tenant_id: string
          tool_calls?: Json | null
          tool_name?: string | null
          tool_result?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          tool_calls?: Json | null
          tool_name?: string | null
          tool_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_contracts: {
        Row: {
          briefing: string | null
          campaign_id: string | null
          channels: string[] | null
          contract_url: string | null
          created_at: string
          created_by: string | null
          creator_id: string
          currency: string | null
          exclusivity: boolean | null
          fee_cents: number | null
          id: string
          rights_end: string | null
          rights_start: string | null
          scope: string | null
          signed_at: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          briefing?: string | null
          campaign_id?: string | null
          channels?: string[] | null
          contract_url?: string | null
          created_at?: string
          created_by?: string | null
          creator_id: string
          currency?: string | null
          exclusivity?: boolean | null
          fee_cents?: number | null
          id?: string
          rights_end?: string | null
          rights_start?: string | null
          scope?: string | null
          signed_at?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          briefing?: string | null
          campaign_id?: string | null
          channels?: string[] | null
          contract_url?: string | null
          created_at?: string
          created_by?: string | null
          creator_id?: string
          currency?: string | null
          exclusivity?: boolean | null
          fee_cents?: number | null
          id?: string
          rights_end?: string | null
          rights_start?: string | null
          scope?: string | null
          signed_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_contracts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_contracts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          email: string | null
          engagement_rate: number | null
          followers_count: number | null
          full_name: string
          handle: string | null
          id: string
          niche: string | null
          notes: string | null
          phone: string | null
          status: string
          tags: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          engagement_rate?: number | null
          followers_count?: number | null
          full_name: string
          handle?: string | null
          id?: string
          niche?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          engagement_rate?: number | null
          followers_count?: number | null
          full_name?: string
          handle?: string | null
          id?: string
          niche?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creators_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          created_by: string | null
          default_value: Json | null
          field_type: string
          help_text: string | null
          id: string
          is_active: boolean
          key: string
          label: string
          options: Json | null
          position: number
          project_id: string | null
          required: boolean
          scope: string
          task_type_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_value?: Json | null
          field_type: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          key: string
          label: string
          options?: Json | null
          position?: number
          project_id?: string | null
          required?: boolean
          scope: string
          task_type_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_value?: Json | null
          field_type?: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          options?: Json | null
          position?: number
          project_id?: string | null
          required?: boolean
          scope?: string
          task_type_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_definitions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_definitions_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_definitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_widgets: {
        Row: {
          config: Json
          created_at: string
          dashboard_id: string
          height: number
          id: string
          kind: string
          position: number
          title: string
          updated_at: string
          width: number
        }
        Insert: {
          config?: Json
          created_at?: string
          dashboard_id: string
          height?: number
          id?: string
          kind: string
          position?: number
          title: string
          updated_at?: string
          width?: number
        }
        Update: {
          config?: Json
          created_at?: string
          dashboard_id?: string
          height?: number
          id?: string
          kind?: string
          position?: number
          title?: string
          updated_at?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean
          layout: Json
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          layout?: Json
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          layout?: Json
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_forms: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          project_id: string | null
          schema: Json
          slug: string
          squad_id: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          schema?: Json
          slug: string
          squad_id?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          schema?: Json
          slug?: string
          squad_id?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_forms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forms_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_submissions: {
        Row: {
          approval_token: string
          created_at: string
          form_id: string
          id: string
          payload: Json
          requester_email: string | null
          requester_name: string | null
          status: string | null
          task_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approval_token?: string
          created_at?: string
          form_id: string
          id?: string
          payload?: Json
          requester_email?: string | null
          requester_name?: string | null
          status?: string | null
          task_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approval_token?: string
          created_at?: string
          form_id?: string
          id?: string
          payload?: Json
          requester_email?: string | null
          requester_name?: string | null
          status?: string | null
          task_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "demand_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dim_date: {
        Row: {
          d: string
          day: number
          dow: number
          is_weekend: boolean
          month: number
          quarter: number
          week: number
          year: number
        }
        Insert: {
          d: string
          day: number
          dow: number
          is_weekend: boolean
          month: number
          quarter: number
          week: number
          year: number
        }
        Update: {
          d?: string
          day?: number
          dow?: number
          is_weekend?: boolean
          month?: number
          quarter?: number
          week?: number
          year?: number
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      error_events: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          level: string
          message: string
          source: string
          stack: string | null
          tenant_id: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message: string
          source?: string
          stack?: string | null
          tenant_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          source?: string
          stack?: string | null
          tenant_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      export_jobs: {
        Row: {
          created_at: string
          download_url: string | null
          error_message: string | null
          expires_at: string | null
          finished_at: string | null
          format: string
          id: string
          scope: Json
          size_bytes: number | null
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          error_message?: string | null
          expires_at?: string | null
          finished_at?: string | null
          format: string
          id?: string
          scope?: Json
          size_bytes?: number | null
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          error_message?: string | null
          expires_at?: string | null
          finished_at?: string | null
          format?: string
          id?: string
          scope?: Json
          size_bytes?: number | null
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      external_integrations: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          last_error: string | null
          last_sync_at: string | null
          mapping: Json
          provider: string
          status: string
          sync_schedule: string | null
          tenant_id: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          mapping?: Json
          provider: string
          status?: string
          sync_schedule?: string | null
          tenant_id: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          mapping?: Json
          provider?: string
          status?: string
          sync_schedule?: string | null
          tenant_id?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      external_sync_runs: {
        Row: {
          direction: string | null
          error: string | null
          finished_at: string | null
          id: string
          integration_id: string
          items_failed: number | null
          items_processed: number | null
          payload: Json | null
          started_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          direction?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          integration_id: string
          items_failed?: number | null
          items_processed?: number | null
          payload?: Json | null
          started_at?: string
          status?: string
          tenant_id: string
        }
        Update: {
          direction?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          integration_id?: string
          items_failed?: number | null
          items_processed?: number | null
          payload?: Json | null
          started_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_sync_runs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "external_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_sync_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_posts_daily: {
        Row: {
          campaign_id: string | null
          channel: string | null
          clicks: number
          comments: number
          d: string
          id: string
          impressions: number
          likes: number
          posts_published: number
          reach: number
          refreshed_at: string
          saves: number
          shares: number
          tenant_id: string
        }
        Insert: {
          campaign_id?: string | null
          channel?: string | null
          clicks?: number
          comments?: number
          d: string
          id?: string
          impressions?: number
          likes?: number
          posts_published?: number
          reach?: number
          refreshed_at?: string
          saves?: number
          shares?: number
          tenant_id: string
        }
        Update: {
          campaign_id?: string | null
          channel?: string | null
          clicks?: number
          comments?: number
          d?: string
          id?: string
          impressions?: number
          likes?: number
          posts_published?: number
          reach?: number
          refreshed_at?: string
          saves?: number
          shares?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_posts_daily_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_tasks_daily: {
        Row: {
          assignee_id: string | null
          created_count: number
          d: string
          done_count: number
          estimate_minutes: number
          id: string
          overdue_count: number
          project_id: string | null
          refreshed_at: string
          spent_minutes: number
          squad_id: string | null
          tenant_id: string
          type_id: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_count?: number
          d: string
          done_count?: number
          estimate_minutes?: number
          id?: string
          overdue_count?: number
          project_id?: string | null
          refreshed_at?: string
          spent_minutes?: number
          squad_id?: string | null
          tenant_id: string
          type_id?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_count?: number
          d?: string
          done_count?: number
          estimate_minutes?: number
          id?: string
          overdue_count?: number
          project_id?: string | null
          refreshed_at?: string
          spent_minutes?: number
          squad_id?: string | null
          tenant_id?: string
          type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_tasks_daily_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gcal_sync_config: {
        Row: {
          created_at: string
          last_pull_sync_token: string | null
          last_push_at: string | null
          oauth_connection_id: string
          sync_pull_enabled: boolean
          sync_push_enabled: boolean
          target_calendar_id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_pull_sync_token?: string | null
          last_push_at?: string | null
          oauth_connection_id: string
          sync_pull_enabled?: boolean
          sync_push_enabled?: boolean
          target_calendar_id?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_pull_sync_token?: string | null
          last_push_at?: string | null
          oauth_connection_id?: string
          sync_pull_enabled?: boolean
          sync_push_enabled?: boolean
          target_calendar_id?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gcal_sync_config_oauth_connection_id_fkey"
            columns: ["oauth_connection_id"]
            isOneToOne: false
            referencedRelation: "oauth_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gcal_sync_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          owner_id: string | null
          period_end: string
          period_start: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          owner_id?: string | null
          period_end: string
          period_start: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          owner_id?: string | null
          period_end?: string
          period_start?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          habit_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          habit_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_checkins_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          cadence: string | null
          color: string | null
          created_at: string
          id: string
          name: string
          target_per_period: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          cadence?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name: string
          target_per_period?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          cadence?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          target_per_period?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hashtag_groups: {
        Row: {
          channel: Database["public"]["Enums"]["social_channel"] | null
          created_at: string
          created_by: string | null
          hashtags: string[]
          id: string
          name: string
          notes: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["social_channel"] | null
          created_at?: string
          created_by?: string | null
          hashtags?: string[]
          id?: string
          name: string
          notes?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["social_channel"] | null
          created_at?: string
          created_by?: string | null
          hashtags?: string[]
          id?: string
          name?: string
          notes?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          body_md: string
          category_id: string | null
          created_at: string
          helpful_count: number
          id: string
          not_helpful_count: number
          published: boolean
          slug: string
          tags: string[]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          body_md: string
          category_id?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          not_helpful_count?: number
          published?: boolean
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          body_md?: string
          category_id?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          not_helpful_count?: number
          published?: boolean
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          position: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      impersonation_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          ended_at: string | null
          id: string
          reason: string
          started_at: string
          target_user_id: string
          tenant_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          reason: string
          started_at?: string
          target_user_id: string
          tenant_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          reason?: string
          started_at?: string
          target_user_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "impersonation_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          created_at: string
          created_count: number
          error_count: number
          errors: Json
          filename: string | null
          finished_at: string | null
          id: string
          mapping: Json
          project_id: string | null
          raw_sample: Json | null
          source: string
          status: string
          target: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_count?: number
          error_count?: number
          errors?: Json
          filename?: string | null
          finished_at?: string | null
          id?: string
          mapping?: Json
          project_id?: string | null
          raw_sample?: Json | null
          source: string
          status?: string
          target: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_count?: number
          error_count?: number
          errors?: Json
          filename?: string | null
          finished_at?: string | null
          id?: string
          mapping?: Json
          project_id?: string | null
          raw_sample?: Json | null
          source?: string
          status?: string
          target?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_benchmarks: {
        Row: {
          created_at: string
          id: string
          industry: string
          metric: string
          notes: string | null
          p25: number
          p50: number
          p75: number
          source: string | null
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry: string
          metric: string
          notes?: string | null
          p25: number
          p50: number
          p75: number
          source?: string | null
          unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string
          metric?: string
          notes?: string | null
          p25?: number
          p50?: number
          p75?: number
          source?: string | null
          unit?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          status: string
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          tenant_id?: string
          token?: string
        }
        Relationships: []
      }
      key_results: {
        Row: {
          auto_update: boolean
          baseline: number
          created_at: string
          current_value: number
          dimension_key: string | null
          dimension_value: string | null
          direction: string
          goal_id: string
          id: string
          linked_task_filter: Json | null
          manual_value: number | null
          metric: string
          source: string
          target: number
          target_type: string
          tenant_id: string
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          auto_update?: boolean
          baseline?: number
          created_at?: string
          current_value?: number
          dimension_key?: string | null
          dimension_value?: string | null
          direction?: string
          goal_id: string
          id?: string
          linked_task_filter?: Json | null
          manual_value?: number | null
          metric: string
          source: string
          target: number
          target_type?: string
          tenant_id: string
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          auto_update?: boolean
          baseline?: number
          created_at?: string
          current_value?: number
          dimension_key?: string | null
          dimension_value?: string | null
          direction?: string
          goal_id?: string
          id?: string
          linked_task_filter?: Json | null
          manual_value?: number | null
          metric?: string
          source?: string
          target?: number
          target_type?: string
          tenant_id?: string
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      link_clicks: {
        Row: {
          bio_link_id: string | null
          campaign_id: string | null
          channel: string | null
          clicked_at: string
          country: string | null
          device: string | null
          id: string
          referer: string | null
          task_id: string | null
          tenant_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          bio_link_id?: string | null
          campaign_id?: string | null
          channel?: string | null
          clicked_at?: string
          country?: string | null
          device?: string | null
          id?: string
          referer?: string | null
          task_id?: string | null
          tenant_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          bio_link_id?: string | null
          campaign_id?: string | null
          channel?: string | null
          clicked_at?: string
          country?: string | null
          device?: string | null
          id?: string
          referer?: string | null
          task_id?: string | null
          tenant_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_bio_link_id_fkey"
            columns: ["bio_link_id"]
            isOneToOne: false
            referencedRelation: "bio_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          notes: string | null
          plan_interest: string | null
          source: string | null
          status: string
          utm: Json | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          plan_interest?: string | null
          source?: string | null
          status?: string
          utm?: Json | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          plan_interest?: string | null
          source?: string | null
          status?: string
          utm?: Json | null
        }
        Relationships: []
      }
      marketplace_installs: {
        Row: {
          id: string
          installed_at: string
          installed_by: string | null
          template_id: string
          tenant_id: string
        }
        Insert: {
          id?: string
          installed_at?: string
          installed_by?: string | null
          template_id: string
          tenant_id: string
        }
        Update: {
          id?: string
          installed_at?: string
          installed_by?: string | null
          template_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_installs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketplace_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_installs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_templates: {
        Row: {
          author_user_id: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          install_count: number
          is_official: boolean
          is_public: boolean
          name: string
          payload: Json
          rating_avg: number
          rating_count: number
          source_tenant_id: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          install_count?: number
          is_official?: boolean
          is_public?: boolean
          name: string
          payload: Json
          rating_avg?: number
          rating_count?: number
          source_tenant_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          install_count?: number
          is_official?: boolean
          is_public?: boolean
          name?: string
          payload?: Json
          rating_avg?: number
          rating_count?: number
          source_tenant_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_templates_source_tenant_id_fkey"
            columns: ["source_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          bucket: string
          campaign_id: string | null
          created_at: string
          duration_seconds: number | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime_type: string | null
          name: string
          notes: string | null
          path: string
          size_bytes: number | null
          tags: string[] | null
          tenant_id: string
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          bucket?: string
          campaign_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string | null
          name: string
          notes?: string | null
          path: string
          size_bytes?: number | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          bucket?: string
          campaign_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string | null
          name?: string
          notes?: string | null
          path?: string
          size_bytes?: number | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_anomalies: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          delta_pct: number
          detected_at: string
          dimension_key: string | null
          dimension_value: string | null
          expected: number
          explanation: string | null
          id: string
          metric: string
          observed: number
          severity: string
          source: string
          status: string
          suggested_action: string | null
          tenant_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          delta_pct: number
          detected_at?: string
          dimension_key?: string | null
          dimension_value?: string | null
          expected: number
          explanation?: string | null
          id?: string
          metric: string
          observed: number
          severity: string
          source: string
          status?: string
          suggested_action?: string | null
          tenant_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          delta_pct?: number
          detected_at?: string
          dimension_key?: string | null
          dimension_value?: string | null
          expected?: number
          explanation?: string | null
          id?: string
          metric?: string
          observed?: number
          severity?: string
          source?: string
          status?: string
          suggested_action?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metric_anomalies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_scorecards: {
        Row: {
          ai_summary: string | null
          benchmarks: Json
          created_at: string
          id: string
          metrics: Json
          period_month: string
          recommendations: Json | null
          tenant_id: string
        }
        Insert: {
          ai_summary?: string | null
          benchmarks?: Json
          created_at?: string
          id?: string
          metrics?: Json
          period_month: string
          recommendations?: Json | null
          tenant_id: string
        }
        Update: {
          ai_summary?: string | null
          benchmarks?: Json
          created_at?: string
          id?: string
          metrics?: Json
          period_month?: string
          recommendations?: Json | null
          tenant_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          email_digest: string
          in_app_enabled: boolean
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          email_digest?: string
          in_app_enabled?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          email_digest?: string
          in_app_enabled?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          channels: Database["public"]["Enums"]["notification_channel"][]
          created_at: string
          enabled: boolean
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          tenant_id: string
          threshold: Json
          user_id: string | null
        }
        Insert: {
          channels?: Database["public"]["Enums"]["notification_channel"][]
          created_at?: string
          enabled?: boolean
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          tenant_id: string
          threshold?: Json
          user_id?: string | null
        }
        Update: {
          channels?: Database["public"]["Enums"]["notification_channel"][]
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          tenant_id?: string
          threshold?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          link: string | null
          payload: Json | null
          read_at: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          link?: string | null
          payload?: Json | null
          read_at?: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          link?: string | null
          payload?: Json | null
          read_at?: string | null
          tenant_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_connections: {
        Row: {
          access_token: string | null
          account_email: string | null
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          provider: string
          refresh_token: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_email?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_email?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      perf_metrics: {
        Row: {
          created_at: string
          id: string
          metric: string
          rating: string | null
          route: string
          tenant_id: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric: string
          rating?: string | null
          route: string
          tenant_id?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          rating?: string | null
          route?: string
          tenant_id?: string | null
          user_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "perf_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          bio: string | null
          channels: string[]
          color: string
          created_at: string
          created_by: string | null
          goals: Json
          id: string
          name: string
          occupation: string | null
          pain_points: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          channels?: string[]
          color?: string
          created_at?: string
          created_by?: string | null
          goals?: Json
          id?: string
          name: string
          occupation?: string | null
          pain_points?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          channels?: string[]
          color?: string
          created_at?: string
          created_by?: string | null
          goals?: Json
          id?: string
          name?: string
          occupation?: string | null
          pain_points?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoros: {
        Row: {
          ambient: string | null
          break_minutes: number
          completed: boolean
          created_at: string
          ended_at: string | null
          id: string
          planned_minutes: number
          started_at: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ambient?: string | null
          break_minutes?: number
          completed?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          planned_minutes?: number
          started_at?: string
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ambient?: string | null
          break_minutes?: number
          completed?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          planned_minutes?: number
          started_at?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoros_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics: {
        Row: {
          clicks: number | null
          collected_at: string
          comments: number | null
          created_at: string
          created_by: string | null
          followers_gained: number | null
          id: string
          impressions: number | null
          likes: number | null
          notes: string | null
          reach: number | null
          saves: number | null
          shares: number | null
          task_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          clicks?: number | null
          collected_at?: string
          comments?: number | null
          created_at?: string
          created_by?: string | null
          followers_gained?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          notes?: string | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          task_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          clicks?: number | null
          collected_at?: string
          comments?: number | null
          created_at?: string
          created_by?: string | null
          followers_gained?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          notes?: string | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          task_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      posting_cadence: {
        Row: {
          channel: Database["public"]["Enums"]["social_channel"]
          created_at: string
          dow: number
          enabled: boolean
          hour: number
          id: string
          notes: string | null
          target_posts: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          dow: number
          enabled?: boolean
          hour: number
          id?: string
          notes?: string | null
          target_posts?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          dow?: number
          enabled?: boolean
          hour?: number
          id?: string
          notes?: string | null
          target_posts?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_plans_public: {
        Row: {
          active: boolean | null
          created_at: string
          cta_label: string | null
          currency: string
          features: Json
          highlight: boolean | null
          id: string
          name: string
          position: number | null
          price_monthly: number
          price_yearly: number
          slug: string
          tagline: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          cta_label?: string | null
          currency?: string
          features?: Json
          highlight?: boolean | null
          id?: string
          name: string
          position?: number | null
          price_monthly?: number
          price_yearly?: number
          slug: string
          tagline?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          cta_label?: string | null
          currency?: string
          features?: Json
          highlight?: boolean | null
          id?: string
          name?: string
          position?: number | null
          price_monthly?: number
          price_yearly?: number
          slug?: string
          tagline?: string | null
        }
        Relationships: []
      }
      privacy_consents: {
        Row: {
          granted: boolean
          granted_at: string
          id: string
          ip: string | null
          kind: string
          revoked_at: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          granted?: boolean
          granted_at?: string
          id?: string
          ip?: string | null
          kind: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
          version?: string
        }
        Update: {
          granted?: boolean
          granted_at?: string
          id?: string
          ip?: string | null
          kind?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      privacy_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          kind: string
          notes: string | null
          payload: Json | null
          result_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          kind: string
          notes?: string | null
          payload?: Json | null
          result_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          kind?: string
          notes?: string | null
          payload?: Json | null
          result_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          locale: string | null
          preferences: Json
          role_title: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string | null
          preferences?: Json
          role_title?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string | null
          preferences?: Json
          role_title?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: Database["public"]["Enums"]["project_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          payload: Json
          suggested_squad_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          payload?: Json
          suggested_squad_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          payload?: Json
          suggested_squad_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_templates_suggested_squad_id_fkey"
            columns: ["suggested_squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived: boolean
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_private: boolean
          key: string
          kind: string
          name: string
          parent_id: string | null
          pipefy_card_id: string | null
          pipefy_last_synced_at: string | null
          pipefy_metadata: Json | null
          pipefy_phase_name: string | null
          pipefy_pipe_id: string | null
          pipefy_url: string | null
          sort_order: number
          squad_id: string | null
          task_seq: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_private?: boolean
          key: string
          kind?: string
          name: string
          parent_id?: string | null
          pipefy_card_id?: string | null
          pipefy_last_synced_at?: string | null
          pipefy_metadata?: Json | null
          pipefy_phase_name?: string | null
          pipefy_pipe_id?: string | null
          pipefy_url?: string | null
          sort_order?: number
          squad_id?: string | null
          task_seq?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_private?: boolean
          key?: string
          kind?: string
          name?: string
          parent_id?: string | null
          pipefy_card_id?: string | null
          pipefy_last_synced_at?: string | null
          pipefy_metadata?: Json | null
          pipefy_phase_name?: string | null
          pipefy_pipe_id?: string | null
          pipefy_url?: string | null
          sort_order?: number
          squad_id?: string | null
          task_seq?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pipefy_integrations: {
        Row: {
          active_only: boolean
          created_at: string
          enabled: boolean
          id: string
          last_error: string | null
          last_sync_at: string | null
          last_sync_count: number | null
          last_sync_status: string | null
          pipe_id: string
          pipe_name: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active_only?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          last_sync_count?: number | null
          last_sync_status?: string | null
          pipe_id: string
          pipe_name?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active_only?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          last_sync_count?: number | null
          last_sync_status?: string | null
          pipe_id?: string
          pipe_name?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipefy_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          tenant_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          tenant_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recurrences: {
        Row: {
          active: boolean
          created_at: string
          id: string
          next_run_at: string | null
          rrule: string
          task_id: string | null
          template: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          next_run_at?: string | null
          rrule: string
          task_id?: string | null
          template?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          next_run_at?: string | null
          rrule?: string
          task_id?: string | null
          template?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurrences_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          remind_at: string
          sent: boolean
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          remind_at: string
          sent?: boolean
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          remind_at?: string
          sent?: boolean
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      report_schedules: {
        Row: {
          active: boolean
          cadence: string
          created_at: string
          id: string
          last_run_at: string | null
          next_run_at: string | null
          recipients: string[]
          report_id: string
          tenant_id: string
        }
        Insert: {
          active?: boolean
          cadence: string
          created_at?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          recipients?: string[]
          report_id: string
          tenant_id: string
        }
        Update: {
          active?: boolean
          cadence?: string
          created_at?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          recipients?: string[]
          report_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "saved_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_filters: {
        Row: {
          created_at: string
          id: string
          is_shared: boolean
          name: string
          query: Json
          scope: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean
          name: string
          query?: Json
          scope?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean
          name?: string
          query?: Json
          scope?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_filters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          chart_type: string
          created_at: string
          created_by: string | null
          description: string | null
          dimensions: Json
          filters: Json
          id: string
          is_favorite: boolean
          metrics: Json
          name: string
          source: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          chart_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: Json
          filters?: Json
          id?: string
          is_favorite?: boolean
          metrics?: Json
          name: string
          source: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          chart_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: Json
          filters?: Json
          id?: string
          is_favorite?: boolean
          metrics?: Json
          name?: string
          source?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          color: string | null
          created_at: string
          filters: Json
          icon: string | null
          id: string
          name: string
          pinned: boolean
          position: number
          source: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          filters?: Json
          icon?: string | null
          id?: string
          name: string
          pinned?: boolean
          position?: number
          source: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          filters?: Json
          icon?: string | null
          id?: string
          name?: string
          pinned?: boolean
          position?: number
          source?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_publishes: {
        Row: {
          attempts: number
          channel: Database["public"]["Enums"]["social_channel"]
          created_at: string
          created_by: string | null
          error: string | null
          external_id: string | null
          external_url: string | null
          id: string
          integration_id: string | null
          last_attempt_at: string | null
          response: Json | null
          scheduled_at: string
          status: string
          task_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          channel: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          created_by?: string | null
          error?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          integration_id?: string | null
          last_attempt_at?: string | null
          response?: Json | null
          scheduled_at: string
          status?: string
          task_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          channel?: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          created_by?: string | null
          error?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          integration_id?: string | null
          last_attempt_at?: string | null
          response?: Json | null
          scheduled_at?: string
          status?: string
          task_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_publishes_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "social_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          query: string
          result_count: number
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          result_count?: number
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          result_count?: number
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit: {
        Row: {
          created_at: string
          event: string
          id: string
          ip: string | null
          metadata: Json
          severity: string
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          ip?: string | null
          metadata?: Json
          severity?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          ip?: string | null
          metadata?: Json
          severity?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_scenarios: {
        Row: {
          ai_narrative: string | null
          created_at: string
          created_by: string
          id: string
          inputs: Json
          kind: string
          name: string
          result: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ai_narrative?: string | null
          created_at?: string
          created_by: string
          id?: string
          inputs?: Json
          kind: string
          name: string
          result?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ai_narrative?: string | null
          created_at?: string
          created_by?: string
          id?: string
          inputs?: Json
          kind?: string
          name?: string
          result?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sla_policies: {
        Row: {
          active: boolean
          business_hours_only: boolean
          created_at: string
          created_by: string | null
          id: string
          name: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          resolution_hours: number
          response_hours: number
          tenant_id: string
          type_id: string | null
          updated_at: string
          warning_threshold_pct: number
        }
        Insert: {
          active?: boolean
          business_hours_only?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          resolution_hours?: number
          response_hours?: number
          tenant_id: string
          type_id?: string | null
          updated_at?: string
          warning_threshold_pct?: number
        }
        Update: {
          active?: boolean
          business_hours_only?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          resolution_hours?: number
          response_hours?: number
          tenant_id?: string
          type_id?: string | null
          updated_at?: string
          warning_threshold_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "sla_policies_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      social_approval_requests: {
        Row: {
          client_email: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by_name: string | null
          decision_comment: string | null
          expires_at: string | null
          id: string
          message: string | null
          status: Database["public"]["Enums"]["social_approval_status"]
          task_id: string
          tenant_id: string
          token: string
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by_name?: string | null
          decision_comment?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["social_approval_status"]
          task_id: string
          tenant_id: string
          token?: string
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by_name?: string | null
          decision_comment?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["social_approval_status"]
          task_id?: string
          tenant_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_approval_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      social_campaigns: {
        Row: {
          channels: Database["public"]["Enums"]["social_channel"][]
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          objective: string | null
          stage_checklists: Json
          start_date: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channels?: Database["public"]["Enums"]["social_channel"][]
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          objective?: string | null
          stage_checklists?: Json
          start_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channels?: Database["public"]["Enums"]["social_channel"][]
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          objective?: string | null
          stage_checklists?: Json
          start_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_inbox_items: {
        Row: {
          ai_suggested_reply: string | null
          ai_summary: string | null
          author_avatar: string | null
          author_handle: string | null
          author_name: string | null
          channel: Database["public"]["Enums"]["social_channel"]
          created_at: string
          external_id: string | null
          external_url: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          integration_id: string | null
          kind: Database["public"]["Enums"]["inbox_item_kind"]
          message: string
          metadata: Json
          parent_post_external_id: string | null
          received_at: string
          reply_text: string | null
          sentiment: Database["public"]["Enums"]["inbox_sentiment"] | null
          status: Database["public"]["Enums"]["inbox_item_status"]
          task_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ai_suggested_reply?: string | null
          ai_summary?: string | null
          author_avatar?: string | null
          author_handle?: string | null
          author_name?: string | null
          channel: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          external_id?: string | null
          external_url?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          integration_id?: string | null
          kind?: Database["public"]["Enums"]["inbox_item_kind"]
          message: string
          metadata?: Json
          parent_post_external_id?: string | null
          received_at?: string
          reply_text?: string | null
          sentiment?: Database["public"]["Enums"]["inbox_sentiment"] | null
          status?: Database["public"]["Enums"]["inbox_item_status"]
          task_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ai_suggested_reply?: string | null
          ai_summary?: string | null
          author_avatar?: string | null
          author_handle?: string | null
          author_name?: string | null
          channel?: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          external_id?: string | null
          external_url?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          integration_id?: string | null
          kind?: Database["public"]["Enums"]["inbox_item_kind"]
          message?: string
          metadata?: Json
          parent_post_external_id?: string | null
          received_at?: string
          reply_text?: string | null
          sentiment?: Database["public"]["Enums"]["inbox_sentiment"] | null
          status?: Database["public"]["Enums"]["inbox_item_status"]
          task_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_inbox_items_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "social_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_inbox_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      social_integrations: {
        Row: {
          access_token: string | null
          account_avatar: string | null
          account_id: string | null
          account_name: string | null
          connected_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          last_error: string | null
          metadata: Json
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_avatar?: string | null
          account_id?: string | null
          account_name?: string | null
          connected_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_error?: string | null
          metadata?: Json
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_avatar?: string | null
          account_id?: string | null
          account_name?: string | null
          connected_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_error?: string | null
          metadata?: Json
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      squad_members: {
        Row: {
          capacity_hours_week: number | null
          created_at: string
          id: string
          role_in_squad: Database["public"]["Enums"]["squad_role"]
          squad_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capacity_hours_week?: number | null
          created_at?: string
          id?: string
          role_in_squad?: Database["public"]["Enums"]["squad_role"]
          squad_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capacity_hours_week?: number | null
          created_at?: string
          id?: string
          role_in_squad?: Database["public"]["Enums"]["squad_role"]
          squad_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_private: boolean
          kind: Database["public"]["Enums"]["squad_kind"]
          name: string
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_private?: boolean
          kind?: Database["public"]["Enums"]["squad_kind"]
          name: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_private?: boolean
          kind?: Database["public"]["Enums"]["squad_kind"]
          name?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_configurations: {
        Row: {
          active: boolean
          created_at: string
          domains: string[]
          entity_id: string | null
          id: string
          metadata_url: string | null
          provider: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          domains?: string[]
          entity_id?: string | null
          id?: string
          metadata_url?: string | null
          provider: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          domains?: string[]
          entity_id?: string | null
          id?: string
          metadata_url?: string | null
          provider?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_trials: {
        Row: {
          converted_at: string | null
          created_by: string | null
          ends_at: string
          id: string
          plan_slug: string
          started_at: string
          tenant_id: string
        }
        Insert: {
          converted_at?: string | null
          created_by?: string | null
          ends_at: string
          id?: string
          plan_slug: string
          started_at?: string
          tenant_id: string
        }
        Update: {
          converted_at?: string | null
          created_by?: string | null
          ends_at?: string
          id?: string
          plan_slug?: string
          started_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_trials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_status: {
        Row: {
          id: string
          message: string | null
          service: string
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          message?: string | null
          service: string
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          message?: string | null
          service?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assets: {
        Row: {
          asset_id: string
          created_at: string
          position: number
          task_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          position?: number
          task_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          position?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_custom_field_values: {
        Row: {
          field_definition_id: string
          task_id: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          field_definition_id: string
          task_id: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          field_definition_id?: string
          task_id?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "task_custom_field_values_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_custom_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_embeddings: {
        Row: {
          content: string | null
          created_at: string
          embedding: string | null
          task_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          embedding?: string | null
          task_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          embedding?: string | null
          task_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_embeddings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_embeddings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_statuses: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_done: boolean
          name: string
          position: number
          slug: string
          squad_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_done?: boolean
          name: string
          position?: number
          slug: string
          squad_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_done?: boolean
          name?: string
          position?: number
          slug?: string
          squad_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_statuses_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_statuses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          tag_id: string
          task_id: string
        }
        Insert: {
          tag_id: string
          task_id: string
        }
        Update: {
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          checklist: Json | null
          color: string | null
          created_at: string
          default_estimate_minutes: number | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          squad_id: string | null
          tenant_id: string
          updated_at: string
          workflow: Json | null
        }
        Insert: {
          checklist?: Json | null
          color?: string | null
          created_at?: string
          default_estimate_minutes?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          squad_id?: string | null
          tenant_id: string
          updated_at?: string
          workflow?: Json | null
        }
        Update: {
          checklist?: Json | null
          color?: string | null
          created_at?: string
          default_estimate_minutes?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          squad_id?: string | null
          tenant_id?: string
          updated_at?: string
          workflow?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "task_types_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived: boolean
          assignee_id: string | null
          audience_id: string | null
          campaign_id: string | null
          checklist: Json | null
          code: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          description: string | null
          done_at: string | null
          due_at: string | null
          estimate_minutes: number | null
          gcal_calendar_id: string | null
          gcal_etag: string | null
          gcal_event_id: string | null
          gcal_last_synced_at: string | null
          ice_confidence: number | null
          ice_ease: number | null
          ice_impact: number | null
          ice_score: number | null
          id: string
          number: number
          parent_task_id: string | null
          persona_id: string | null
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          progress_pct: number
          project_id: string
          publish_state: Database["public"]["Enums"]["publish_state"] | null
          published_at: string | null
          published_url: string | null
          reporter_id: string | null
          scheduled_at: string | null
          social_caption: string | null
          social_channel: Database["public"]["Enums"]["social_channel"] | null
          spent_minutes: number
          start_at: string | null
          status_id: string | null
          tenant_id: string
          title: string
          type_id: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          assignee_id?: string | null
          audience_id?: string | null
          campaign_id?: string | null
          checklist?: Json | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          done_at?: string | null
          due_at?: string | null
          estimate_minutes?: number | null
          gcal_calendar_id?: string | null
          gcal_etag?: string | null
          gcal_event_id?: string | null
          gcal_last_synced_at?: string | null
          ice_confidence?: number | null
          ice_ease?: number | null
          ice_impact?: number | null
          id?: string
          number: number
          parent_task_id?: string | null
          persona_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          progress_pct?: number
          project_id: string
          publish_state?: Database["public"]["Enums"]["publish_state"] | null
          published_at?: string | null
          published_url?: string | null
          reporter_id?: string | null
          scheduled_at?: string | null
          social_caption?: string | null
          social_channel?: Database["public"]["Enums"]["social_channel"] | null
          spent_minutes?: number
          start_at?: string | null
          status_id?: string | null
          tenant_id: string
          title: string
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          assignee_id?: string | null
          audience_id?: string | null
          campaign_id?: string | null
          checklist?: Json | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          done_at?: string | null
          due_at?: string | null
          estimate_minutes?: number | null
          gcal_calendar_id?: string | null
          gcal_etag?: string | null
          gcal_event_id?: string | null
          gcal_last_synced_at?: string | null
          ice_confidence?: number | null
          ice_ease?: number | null
          ice_impact?: number | null
          id?: string
          number?: number
          parent_task_id?: string | null
          persona_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          progress_pct?: number
          project_id?: string
          publish_state?: Database["public"]["Enums"]["publish_state"] | null
          published_at?: string | null
          published_url?: string | null
          reporter_id?: string | null
          scheduled_at?: string | null
          social_caption?: string | null
          social_channel?: Database["public"]["Enums"]["social_channel"] | null
          spent_minutes?: number
          start_at?: string | null
          status_id?: string | null
          tenant_id?: string
          title?: string
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_unified: {
        Row: {
          body: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_pinned: boolean
          kind: string
          last_used_at: string | null
          name: string
          tags: string[]
          tenant_id: string
          updated_at: string
          use_count: number
        }
        Insert: {
          body?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean
          kind: string
          last_used_at?: string | null
          name: string
          tags?: string[]
          tenant_id: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          body?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean
          kind?: string
          last_used_at?: string | null
          name?: string
          tags?: string[]
          tenant_id?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_unified_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_unified_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_billing: {
        Row: {
          current_period_end: string | null
          external_customer_id: string | null
          plan_id: string
          status: string
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          current_period_end?: string | null
          external_customer_id?: string | null
          plan_id?: string
          status?: string
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          current_period_end?: string | null
          external_customer_id?: string | null
          plan_id?: string
          status?: string
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_billing_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          accent_color: string | null
          created_at: string
          created_by: string | null
          custom_domain: string | null
          data_residency: string
          id: string
          industry: string
          logo_url: string | null
          name: string
          primary_color: string | null
          settings: Json
          sla_tier: string
          slug: string
          updated_at: string
          white_label: boolean
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          data_residency?: string
          id?: string
          industry?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          settings?: Json
          sla_tier?: string
          slug: string
          updated_at?: string
          white_label?: boolean
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          data_residency?: string
          id?: string
          industry?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          settings?: Json
          sla_tier?: string
          slug?: string
          updated_at?: string
          white_label?: boolean
        }
        Relationships: []
      }
      ticket_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: string
          kind: string
          payload: Json
          ticket_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          ticket_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments: Json
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          internal: boolean
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          internal?: boolean
          ticket_id: string
        }
        Update: {
          attachments?: Json
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          channel: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          first_response_at: string | null
          id: string
          number: number
          owner_user_id: string | null
          priority: string
          requester_email: string | null
          requester_name: string | null
          requester_user_id: string | null
          resolved_at: string | null
          sla_resolution_minutes: number | null
          sla_response_minutes: number | null
          squad_id: string | null
          status: string
          tags: string[]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          channel?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          first_response_at?: string | null
          id?: string
          number: number
          owner_user_id?: string | null
          priority?: string
          requester_email?: string | null
          requester_name?: string | null
          requester_user_id?: string | null
          resolved_at?: string | null
          sla_resolution_minutes?: number | null
          sla_response_minutes?: number | null
          squad_id?: string | null
          status?: string
          tags?: string[]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          channel?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          first_response_at?: string | null
          id?: string
          number?: number
          owner_user_id?: string | null
          priority?: string
          requester_email?: string | null
          requester_name?: string | null
          requester_user_id?: string | null
          resolved_at?: string | null
          sla_resolution_minutes?: number | null
          sla_response_minutes?: number | null
          squad_id?: string | null
          status?: string
          tags?: string[]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          billable: boolean
          created_at: string
          ended_at: string | null
          hourly_rate: number | null
          id: string
          minutes: number | null
          note: string | null
          source: string | null
          started_at: string
          tags: string[]
          task_id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billable?: boolean
          created_at?: string
          ended_at?: string | null
          hourly_rate?: number | null
          id?: string
          minutes?: number | null
          note?: string | null
          source?: string | null
          started_at?: string
          tags?: string[]
          task_id: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billable?: boolean
          created_at?: string
          ended_at?: string | null
          hourly_rate?: number | null
          id?: string
          minutes?: number | null
          note?: string | null
          source?: string | null
          started_at?: string
          tags?: string[]
          task_id?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          kind: Database["public"]["Enums"]["time_off_kind"]
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["time_off_status"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          kind?: Database["public"]["Enums"]["time_off_kind"]
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["time_off_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          kind?: Database["public"]["Enums"]["time_off_kind"]
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["time_off_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ugc_assets: {
        Row: {
          asset_id: string | null
          caption: string | null
          created_at: string
          created_by: string | null
          creator_id: string | null
          id: string
          inbox_item_id: string | null
          notes: string | null
          reposted_task_id: string | null
          rights_ok: boolean | null
          rights_until: string | null
          source_url: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          creator_id?: string | null
          id?: string
          inbox_item_id?: string | null
          notes?: string | null
          reposted_task_id?: string | null
          rights_ok?: boolean | null
          rights_until?: string | null
          source_url?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          creator_id?: string | null
          id?: string
          inbox_item_id?: string | null
          notes?: string | null
          reposted_task_id?: string | null
          rights_ok?: boolean | null
          rights_until?: string | null
          source_url?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ugc_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ugc_assets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ugc_assets_inbox_item_id_fkey"
            columns: ["inbox_item_id"]
            isOneToOne: false
            referencedRelation: "social_inbox_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ugc_assets_reposted_task_id_fkey"
            columns: ["reposted_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ugc_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          tenant_id: string | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          tenant_id?: string | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          tenant_id?: string | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_capacity: {
        Row: {
          created_at: string
          daily_hours: number
          hours_per_week: number
          id: string
          notes: string | null
          tenant_id: string
          updated_at: string
          user_id: string
          workdays: number[]
        }
        Insert: {
          created_at?: string
          daily_hours?: number
          hours_per_week?: number
          id?: string
          notes?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
          workdays?: number[]
        }
        Update: {
          created_at?: string
          daily_hours?: number
          hours_per_week?: number
          id?: string
          notes?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
          workdays?: number[]
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          created_at: string
          endorsements_count: number
          id: string
          level: number
          notes: string | null
          skill_id: string
          tenant_id: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          endorsements_count?: number
          id?: string
          level?: number
          notes?: string | null
          skill_id: string
          tenant_id: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          endorsements_count?: number
          id?: string
          level?: number
          notes?: string | null
          skill_id?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp: {
        Row: {
          current_streak: number
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          tenant_id: string
          updated_at: string
          user_id: string
          xp_total: number
        }
        Insert: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          tenant_id: string
          updated_at?: string
          user_id: string
          xp_total?: number
        }
        Update: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          tenant_id?: string
          updated_at?: string
          user_id?: string
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_xp_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_briefings: {
        Row: {
          audio_url: string | null
          created_at: string
          duration_sec: number | null
          id: string
          summary: string | null
          tenant_id: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration_sec?: number | null
          id?: string
          summary?: string | null
          tenant_id: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration_sec?: number | null
          id?: string
          summary?: string | null
          tenant_id?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_briefings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          delivered_at: string | null
          event: string
          http_status: number | null
          id: string
          payload: Json
          response_body: string | null
          status: string
          tenant_id: string
          webhook_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          event: string
          http_status?: number | null
          id?: string
          payload: Json
          response_body?: string | null
          status?: string
          tenant_id: string
          webhook_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          event?: string
          http_status?: number | null
          id?: string
          payload?: Json
          response_body?: string | null
          status?: string
          tenant_id?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          events: string[]
          filter_jsonpath: string | null
          id: string
          last_delivery_at: string | null
          last_status: number | null
          name: string
          secret: string
          tenant_id: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          events?: string[]
          filter_jsonpath?: string | null
          id?: string
          last_delivery_at?: string | null
          last_status?: number | null
          name: string
          secret?: string
          tenant_id: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          events?: string[]
          filter_jsonpath?: string | null
          id?: string
          last_delivery_at?: string | null
          last_status?: number | null
          name?: string
          secret?: string
          tenant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whiteboards: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          snapshot: Json
          task_id: string | null
          tenant_id: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          snapshot?: Json
          task_id?: string | null
          tenant_id: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          snapshot?: Json
          task_id?: string | null
          tenant_id?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whiteboards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whiteboards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whiteboards_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whiteboards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_pages: {
        Row: {
          body: string
          body_search: unknown
          cover_image: string | null
          created_at: string
          created_by: string | null
          icon: string | null
          id: string
          is_published: boolean
          parent_id: string | null
          slug: string
          sort_order: number
          tenant_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          body_search?: unknown
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          parent_id?: string | null
          slug: string
          sort_order?: number
          tenant_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          body_search?: unknown
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          parent_id?: string | null
          slug?: string
          sort_order?: number
          tenant_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wiki_pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_versions: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          page_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          page_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          page_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "wiki_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "wiki_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          ref_id: string | null
          ref_kind: string | null
          tenant_id: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          ref_id?: string | null
          ref_kind?: string | null
          tenant_id: string
          user_id: string
          xp: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          ref_id?: string | null
          ref_kind?: string | null
          tenant_id?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_workload_by_user: {
        Row: {
          estimated_minutes: number | null
          spent_minutes: number | null
          task_count: number | null
          tenant_id: string | null
          user_id: string | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: string }
      apply_ai_suggestion: { Args: { _id: string }; Returns: undefined }
      apply_project_template: {
        Args: {
          p_key: string
          p_name: string
          p_squad_id?: string
          p_template_id: string
        }
        Returns: string
      }
      approval_decide: {
        Args: {
          _comment?: string
          _decision: Database["public"]["Enums"]["decision_kind"]
          _instance_id: string
        }
        Returns: Database["public"]["Enums"]["approval_status"]
      }
      approval_start: {
        Args: { _notes?: string; _task_id: string; _workflow_id: string }
        Returns: string
      }
      assign_ticket_owner: {
        Args: { _ticket_id: string; _user_id: string }
        Returns: undefined
      }
      award_xp: {
        Args: {
          _kind: string
          _ref_id?: string
          _ref_kind?: string
          _tenant: string
          _xp: number
        }
        Returns: Json
      }
      benchmark_compare: { Args: { _tenant: string }; Returns: Json }
      broadcast_table_change: {
        Args: { _channel: string; _event: string; _payload: Json }
        Returns: undefined
      }
      campaign_report: { Args: { _campaign_id: string }; Returns: Json }
      campaign_roas: { Args: { _campaign_id: string }; Returns: Json }
      can_see_project: { Args: { _project_id: string }; Returns: boolean }
      can_see_task: { Args: { _task_id: string }; Returns: boolean }
      capacity_for_user: {
        Args: {
          _from: string
          _tenant_id: string
          _to: string
          _user_id: string
        }
        Returns: {
          available_hours: number
          off_days: number
          workdays_total: number
        }[]
      }
      check_achievements: { Args: { _tenant: string }; Returns: number }
      check_ai_rate_limit: { Args: { _user_id: string }; Returns: number }
      compute_next_run: {
        Args: { _cadence: string; _from?: string }
        Returns: string
      }
      convert_inbox_item_to_task: {
        Args: { _assignee_id?: string; _inbox_id: string; _project_id?: string }
        Returns: string
      }
      convert_lead: {
        Args: {
          _company?: string
          _email: string
          _name?: string
          _plan?: string
          _source?: string
          _utm?: Json
        }
        Returns: string
      }
      copilot_context: { Args: { _tenant: string }; Returns: Json }
      create_workspace: {
        Args: { _name: string; _slug?: string }
        Returns: string
      }
      decide_social_approval: {
        Args: {
          _comment: string
          _decision: Database["public"]["Enums"]["social_approval_status"]
          _name: string
          _token: string
        }
        Returns: {
          client_email: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by_name: string | null
          decision_comment: string | null
          expires_at: string | null
          id: string
          message: string | null
          status: Database["public"]["Enums"]["social_approval_status"]
          task_id: string
          tenant_id: string
          token: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "social_approval_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      detect_anomalies: { Args: { _tenant: string }; Returns: number }
      dismiss_ai_suggestion: { Args: { _id: string }; Returns: undefined }
      due_schedules: {
        Args: never
        Returns: {
          cadence: string
          id: string
          recipients: string[]
          report_id: string
          tenant_id: string
        }[]
      }
      endorse_user_skill: {
        Args: { _user_skill_id: string }
        Returns: {
          created_at: string
          endorsements_count: number
          id: string
          level: number
          notes: string | null
          skill_id: string
          tenant_id: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        SetofOptions: {
          from: "*"
          to: "user_skills"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      enqueue_automation_event: {
        Args: { _event: string; _payload: Json; _tenant: string }
        Returns: string
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_webhook: {
        Args: { _event: string; _payload: Json; _tenant: string }
        Returns: number
      }
      ensure_user_workspace: { Args: { _user_id: string }; Returns: string }
      exec_kpis: { Args: { _tenant: string }; Returns: Json }
      export_my_personal_data: { Args: never; Returns: Json }
      forecast_metric: {
        Args: {
          _days_ahead?: number
          _days_back?: number
          _metric: string
          _source: string
          _tenant: string
        }
        Returns: {
          d: string
          kind: string
          value: number
        }[]
      }
      generate_ai_suggestions: { Args: { _tenant: string }; Returns: number }
      get_demand_submission_by_token: {
        Args: { _token: string }
        Returns: {
          created_at: string
          form_description: string
          form_id: string
          form_title: string
          id: string
          payload: Json
          requester_email: string
          requester_name: string
          status: string
          task_id: string
          tenant_id: string
        }[]
      }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          status: string
          tenant_id: string
          tenant_name: string
        }[]
      }
      get_social_approval_by_token: {
        Args: { _token: string }
        Returns: {
          asset_buckets: string[]
          asset_kinds: Database["public"]["Enums"]["media_kind"][]
          asset_paths: string[]
          client_email: string
          client_name: string
          decided_at: string
          decision_comment: string
          expires_at: string
          id: string
          message: string
          status: Database["public"]["Enums"]["social_approval_status"]
          task_caption: string
          task_channel: Database["public"]["Enums"]["social_channel"]
          task_id: string
          task_publish_state: Database["public"]["Enums"]["publish_state"]
          task_scheduled_at: string
          task_title: string
        }[]
      }
      global_search: {
        Args: { _limit?: number; _q: string; _tenant: string }
        Returns: {
          id: string
          kind: string
          rank: number
          subtitle: string
          title: string
          url: string
        }[]
      }
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["tenant_role"]
          _tenant_id: string
        }
        Returns: boolean
      }
      health_snapshot: { Args: { _tenant: string }; Returns: Json }
      inbox_summary: { Args: { _tenant: string }; Returns: Json }
      install_marketplace_template: {
        Args: { _template_id: string; _tenant_id: string }
        Returns: string
      }
      is_project_member: { Args: { _project_id: string }; Returns: boolean }
      is_squad_member: { Args: { _squad_id: string }; Returns: boolean }
      kr_progress: { Args: { _tenant: string }; Returns: number }
      mark_notifications_read: { Args: { _ids?: string[] }; Returns: number }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      pending_webhook_deliveries: {
        Args: { _limit?: number }
        Returns: {
          attempts: number
          delivery_id: string
          event: string
          payload: Json
          secret: string
          url: string
          webhook_id: string
        }[]
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recommend_boosts: {
        Args: { _limit?: number; _tenant: string }
        Returns: {
          channel: string
          engagement: number
          reach: number
          score: number
          task_id: string
          title: string
        }[]
      }
      refresh_kr_progress: { Args: { _tenant: string }; Returns: undefined }
      refresh_warehouse: { Args: { _tenant: string }; Returns: Json }
      replay_webhook_delivery: {
        Args: { _delivery_id: string }
        Returns: string
      }
      repost_ugc: {
        Args: {
          _channel: Database["public"]["Enums"]["social_channel"]
          _project_id: string
          _ugc_id: string
        }
        Returns: string
      }
      resolve_task_sla: {
        Args: { p_task_id: string }
        Returns: {
          active: boolean
          business_hours_only: boolean
          created_at: string
          created_by: string | null
          id: string
          name: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          resolution_hours: number
          response_hours: number
          tenant_id: string
          type_id: string | null
          updated_at: string
          warning_threshold_pct: number
        }
        SetofOptions: {
          from: "*"
          to: "sla_policies"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      run_report: { Args: { _report_id: string }; Returns: Json }
      run_simulation: {
        Args: { _inputs: Json; _kind: string; _tenant: string }
        Returns: Json
      }
      save_project_as_template: {
        Args: { p_description?: string; p_name: string; p_project_id: string }
        Returns: string
      }
      scan_notifications: { Args: { _tenant: string }; Returns: number }
      seed_default_skills: { Args: { p_tenant_id: string }; Returns: undefined }
      seed_default_task_types: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      seed_sample_data: { Args: { _persona?: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      squad_leaderboard: {
        Args: { _tenant: string }
        Returns: {
          achievements_count: number
          avatar_url: string
          current_streak: number
          display_name: string
          level: number
          user_id: string
          xp_total: number
        }[]
      }
      start_impersonation: {
        Args: { _reason: string; _target_user: string; _tenant: string }
        Returns: string
      }
      start_pomodoro: {
        Args: {
          _ambient?: string
          _break_minutes?: number
          _planned_minutes?: number
          _task_id?: string
        }
        Returns: {
          ambient: string | null
          break_minutes: number
          completed: boolean
          created_at: string
          ended_at: string | null
          id: string
          planned_minutes: number
          started_at: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "pomodoros"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_timer: {
        Args: { _note?: string; _task_id: string }
        Returns: {
          billable: boolean
          created_at: string
          ended_at: string | null
          hourly_rate: number | null
          id: string
          minutes: number | null
          note: string | null
          source: string | null
          started_at: string
          tags: string[]
          task_id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "time_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_trial: {
        Args: { _plan_slug: string; _tenant: string }
        Returns: Json
      }
      stop_pomodoro: {
        Args: { _completed?: boolean }
        Returns: {
          ambient: string | null
          break_minutes: number
          completed: boolean
          created_at: string
          ended_at: string | null
          id: string
          planned_minutes: number
          started_at: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "pomodoros"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      stop_timer: {
        Args: never
        Returns: {
          billable: boolean
          created_at: string
          ended_at: string | null
          hourly_rate: number | null
          id: string
          minutes: number | null
          note: string | null
          source: string | null
          started_at: string
          tags: string[]
          task_id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "time_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      toggle_comment_reaction: {
        Args: { _comment_id: string; _emoji: string }
        Returns: boolean
      }
      use_unified_template: { Args: { p_id: string }; Returns: Json }
      user_role_in_tenant: {
        Args: { _tenant_id: string }
        Returns: Database["public"]["Enums"]["tenant_role"]
      }
      user_tenant_ids: { Args: never; Returns: string[] }
      user_timesheet: {
        Args: { _end: string; _start: string; _tenant: string; _user: string }
        Returns: {
          billable_minutes: number
          day: string
          task_count: number
          total_amount: number
          total_minutes: number
        }[]
      }
      wiki_search: {
        Args: { _q: string; _tenant: string }
        Returns: {
          icon: string
          id: string
          parent_id: string
          rank: number
          slug: string
          snippet: string
          title: string
        }[]
      }
    }
    Enums: {
      activity_kind:
        | "created"
        | "updated"
        | "status_changed"
        | "assigned"
        | "commented"
        | "deleted"
        | "attached"
        | "time_logged"
      approval_status:
        | "draft"
        | "in_progress"
        | "approved"
        | "rejected"
        | "cancelled"
      approver_kind: "user" | "tenant_role"
      decision_kind: "approved" | "rejected"
      inbox_item_kind: "dm" | "comment" | "mention" | "review" | "reply"
      inbox_item_status:
        | "new"
        | "reading"
        | "replied"
        | "ignored"
        | "task_created"
        | "archived"
      inbox_sentiment: "positive" | "neutral" | "negative" | "question"
      media_kind: "image" | "video" | "document" | "audio" | "other"
      notification_channel: "in_app" | "email" | "push"
      notification_kind:
        | "kr_at_risk"
        | "anomaly_critical"
        | "sla_breach_soon"
        | "deadline_near"
        | "task_assigned"
        | "approval_pending"
        | "forecast_drop"
        | "manual"
        | "mention"
      project_role: "owner" | "editor" | "commenter" | "viewer"
      publish_state:
        | "idea"
        | "drafting"
        | "review"
        | "approved"
        | "scheduled"
        | "published"
        | "archived"
      social_approval_status: "pending" | "approved" | "rejected" | "expired"
      social_channel:
        | "instagram"
        | "linkedin"
        | "tiktok"
        | "facebook"
        | "youtube"
        | "twitter"
        | "email"
        | "other"
      squad_kind: "ia" | "marketing" | "expansao" | "custom"
      squad_role: "lead" | "specialist"
      task_priority: "none" | "low" | "medium" | "high" | "urgent"
      tenant_role: "admin" | "manager" | "specialist" | "requester"
      time_off_kind: "vacation" | "sick" | "holiday" | "personal" | "other"
      time_off_status: "pending" | "approved" | "rejected" | "cancelled"
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
      activity_kind: [
        "created",
        "updated",
        "status_changed",
        "assigned",
        "commented",
        "deleted",
        "attached",
        "time_logged",
      ],
      approval_status: [
        "draft",
        "in_progress",
        "approved",
        "rejected",
        "cancelled",
      ],
      approver_kind: ["user", "tenant_role"],
      decision_kind: ["approved", "rejected"],
      inbox_item_kind: ["dm", "comment", "mention", "review", "reply"],
      inbox_item_status: [
        "new",
        "reading",
        "replied",
        "ignored",
        "task_created",
        "archived",
      ],
      inbox_sentiment: ["positive", "neutral", "negative", "question"],
      media_kind: ["image", "video", "document", "audio", "other"],
      notification_channel: ["in_app", "email", "push"],
      notification_kind: [
        "kr_at_risk",
        "anomaly_critical",
        "sla_breach_soon",
        "deadline_near",
        "task_assigned",
        "approval_pending",
        "forecast_drop",
        "manual",
        "mention",
      ],
      project_role: ["owner", "editor", "commenter", "viewer"],
      publish_state: [
        "idea",
        "drafting",
        "review",
        "approved",
        "scheduled",
        "published",
        "archived",
      ],
      social_approval_status: ["pending", "approved", "rejected", "expired"],
      social_channel: [
        "instagram",
        "linkedin",
        "tiktok",
        "facebook",
        "youtube",
        "twitter",
        "email",
        "other",
      ],
      squad_kind: ["ia", "marketing", "expansao", "custom"],
      squad_role: ["lead", "specialist"],
      task_priority: ["none", "low", "medium", "high", "urgent"],
      tenant_role: ["admin", "manager", "specialist", "requester"],
      time_off_kind: ["vacation", "sick", "holiday", "personal", "other"],
      time_off_status: ["pending", "approved", "rejected", "cancelled"],
    },
  },
} as const
