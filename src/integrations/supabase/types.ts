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
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
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
          key: string
          name: string
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
          key: string
          name: string
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
          key?: string
          name?: string
          squad_id?: string | null
          task_seq?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
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
          id: string
          kind: Database["public"]["Enums"]["squad_kind"]
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["squad_kind"]
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["squad_kind"]
          name?: string
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
          id: string
          number: number
          parent_task_id: string | null
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
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
          id?: string
          number: number
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
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
          id?: string
          number?: number
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
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
        ]
      }
      tenants: {
        Row: {
          accent_color: string | null
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          minutes: number | null
          note: string | null
          source: string | null
          started_at: string
          task_id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          minutes?: number | null
          note?: string | null
          source?: string | null
          started_at?: string
          task_id: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          minutes?: number | null
          note?: string | null
          source?: string | null
          started_at?: string
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
      campaign_report: { Args: { _campaign_id: string }; Returns: Json }
      campaign_roas: { Args: { _campaign_id: string }; Returns: Json }
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
      check_ai_rate_limit: { Args: { _user_id: string }; Returns: number }
      convert_inbox_item_to_task: {
        Args: { _assignee_id?: string; _inbox_id: string; _project_id?: string }
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
      detect_anomalies: { Args: { _tenant: string }; Returns: number }
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
      ensure_user_workspace: { Args: { _user_id: string }; Returns: string }
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
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["tenant_role"]
          _tenant_id: string
        }
        Returns: boolean
      }
      inbox_summary: { Args: { _tenant: string }; Returns: Json }
      is_project_member: { Args: { _project_id: string }; Returns: boolean }
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
      refresh_warehouse: { Args: { _tenant: string }; Returns: Json }
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
      save_project_as_template: {
        Args: { p_description?: string; p_name: string; p_project_id: string }
        Returns: string
      }
      seed_default_skills: { Args: { p_tenant_id: string }; Returns: undefined }
      seed_default_task_types: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
          created_at: string
          ended_at: string | null
          id: string
          minutes: number | null
          note: string | null
          source: string | null
          started_at: string
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
          created_at: string
          ended_at: string | null
          id: string
          minutes: number | null
          note: string | null
          source: string | null
          started_at: string
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
      user_role_in_tenant: {
        Args: { _tenant_id: string }
        Returns: Database["public"]["Enums"]["tenant_role"]
      }
      user_tenant_ids: { Args: never; Returns: string[] }
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
