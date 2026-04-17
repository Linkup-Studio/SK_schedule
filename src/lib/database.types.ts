/**
 * Supabase データベース型定義
 * supabase-schema.sql に対応する型
 */
export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string;
          type: string;
          title: string;
          opponent: string | null;
          grades: number[];
          venue_name: string;
          venue_address: string | null;
          meeting_place: string | null;
          date_start: string;
          date_end: string | null;
          meeting_time: string | null;
          rsvp_deadline: string | null;
          items: string | null;
          notes: string | null;
          team_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          opponent?: string | null;
          grades: number[];
          venue_name: string;
          venue_address?: string | null;
          meeting_place?: string | null;
          date_start: string;
          date_end?: string | null;
          meeting_time?: string | null;
          rsvp_deadline?: string | null;
          items?: string | null;
          notes?: string | null;
          team_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          opponent?: string | null;
          grades?: number[];
          venue_name?: string;
          venue_address?: string | null;
          meeting_place?: string | null;
          date_start?: string;
          date_end?: string | null;
          meeting_time?: string | null;
          rsvp_deadline?: string | null;
          items?: string | null;
          notes?: string | null;
          team_id?: string;
          created_at?: string;
        };
      };
      attendances: {
        Row: {
          id: string;
          game_id: string;
          player_name: string;
          status: "attend" | "absent" | "undecided";
          reason: string | null;
          team_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          player_name: string;
          status: "attend" | "absent" | "undecided";
          reason?: string | null;
          team_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          player_name?: string;
          status?: "attend" | "absent" | "undecided";
          reason?: string | null;
          team_id?: string;
          created_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          target_grades: number[];
          is_pinned: boolean;
          team_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          target_grades: number[];
          is_pinned?: boolean;
          team_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          target_grades?: number[];
          is_pinned?: boolean;
          team_id?: string;
          created_at?: string;
        };
      };
    };
  };
}

/** DBから取得した試合データの行型 */
export type GameRow = Database["public"]["Tables"]["games"]["Row"];
/** DBから取得した出欠データの行型 */
export type AttendanceRow = Database["public"]["Tables"]["attendances"]["Row"];
/** DBから取得したお知らせデータの行型 */
export type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
