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
      }
    }
  }
}
