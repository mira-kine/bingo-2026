export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      bingo_cards: {
        Row: {
          id: string
          user_id: string | null
          quote: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          quote?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          quote?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bingo_cards_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      goals: {
        Row: {
          id: string
          bingo_card_id: string | null
          position: number | null
          goal: string | null
          completed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          bingo_card_id?: string | null
          position?: number | null
          goal?: string | null
          completed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          bingo_card_id?: string | null
          position?: number | null
          goal?: string | null
          completed?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_bingo_card_id_fkey"
            columns: ["bingo_card_id"]
            referencedRelation: "bingo_cards"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
