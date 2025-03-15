
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
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          avatar_url: string | null
          department: string | null
          position: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          avatar_url?: string | null
          department?: string | null
          position?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          avatar_url?: string | null
          department?: string | null
          position?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          capacity: number
          location: string
          floor: string | null
          room_number: string | null
          description: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          capacity: number
          location: string
          floor?: string | null
          room_number?: string | null
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          capacity?: number
          location?: string
          floor?: string | null
          room_number?: string | null
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      amenities: {
        Row: {
          id: string
          name: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          created_at?: string
        }
      }
      room_amenities: {
        Row: {
          id: string
          room_id: string
          amenity_id: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          amenity_id: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          amenity_id?: string
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          room_id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          recurring_pattern_id: string | null
          status: "confirmed" | "cancelled" | "completed"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          recurring_pattern_id?: string | null
          status?: "confirmed" | "cancelled" | "completed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          recurring_pattern_id?: string | null
          status?: "confirmed" | "cancelled" | "completed"
          created_at?: string
          updated_at?: string
        }
      }
      recurring_patterns: {
        Row: {
          id: string
          user_id: string
          frequency: "daily" | "weekly" | "monthly"
          interval: number
          days_of_week: number[] | null
          start_date: string
          end_date: string | null
          max_occurrences: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          frequency: "daily" | "weekly" | "monthly"
          interval?: number
          days_of_week?: number[] | null
          start_date: string
          end_date?: string | null
          max_occurrences?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          frequency?: "daily" | "weekly" | "monthly"
          interval?: number
          days_of_week?: number[] | null
          start_date?: string
          end_date?: string | null
          max_occurrences?: number | null
          created_at?: string
        }
      }
      booking_attendees: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          status: "pending" | "accepted" | "declined"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          status?: "pending" | "accepted" | "declined"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string
          status?: "pending" | "accepted" | "declined"
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_room_availability: {
        Args: {
          room_id: string
          start_time: string
          end_time: string
          exclude_booking_id?: string
        }
        Returns: boolean
      }
      create_booking: {
        Args: {
          p_room_id: string
          p_user_id: string
          p_title: string
          p_description: string
          p_start_time: string
          p_end_time: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
