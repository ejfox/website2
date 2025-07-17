// Supabase database types

export interface Database {
  public: {
    Tables: {
      scraps: {
        Row: {
          id: string
          created_at: string
          content: string
          url?: string
          tags?: string[]
          image_url?: string
          metadata?: Record<string, any>
        }
        Insert: {
          id?: string
          created_at?: string
          content: string
          url?: string
          tags?: string[]
          image_url?: string
          metadata?: Record<string, any>
        }
        Update: {
          id?: string
          created_at?: string
          content?: string
          url?: string
          tags?: string[]
          image_url?: string
          metadata?: Record<string, any>
        }
      }
      predictions: {
        Row: {
          id: string
          created_at: string
          statement: string
          confidence: number
          deadline?: string
          categories: string[]
          visibility: 'public' | 'private'
          evidence?: string
          resolution?: boolean
          resolved_at?: string
          notes?: string
          updated_at?: string
          hash?: string
          git_commit?: string
          pgp_signature?: string
          signed?: string
        }
        Insert: {
          id?: string
          created_at?: string
          statement: string
          confidence: number
          deadline?: string
          categories: string[]
          visibility: 'public' | 'private'
          evidence?: string
          resolution?: boolean
          resolved_at?: string
          notes?: string
          updated_at?: string
          hash?: string
          git_commit?: string
          pgp_signature?: string
          signed?: string
        }
        Update: {
          id?: string
          created_at?: string
          statement?: string
          confidence?: number
          deadline?: string
          categories?: string[]
          visibility?: 'public' | 'private'
          evidence?: string
          resolution?: boolean
          resolved_at?: string
          notes?: string
          updated_at?: string
          hash?: string
          git_commit?: string
          pgp_signature?: string
          signed?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]