/**
 * Supabase データアクセス関数
 * モックデータの代わりにSupabaseからデータを取得・保存する
 */
import { supabase } from "./supabase";
import type { Game, Attendance, Announcement, AttendanceSummary, Player } from "./types";
import type { GradeValue, GameType, AttendanceStatusValue } from "./constants";

// =============================================
// 変換ヘルパー（DBの行 → アプリの型）
// =============================================

/** DB行をアプリ用Game型に変換 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGame(row: Record<string, any>): Game {
  return {
    id: row.id,
    title: row.title,
    type: row.type as GameType,
    opponent: row.opponent ?? undefined,
    venueName: row.venue_name,
    venueAddress: row.venue_address ?? undefined,
    venueUrl: row.venue_address
      ? `https://maps.google.com/?q=${encodeURIComponent(row.venue_address)}`
      : undefined,
    dateStart: row.date_start,
    dateEnd: row.date_end ?? undefined,
    meetingTime: row.meeting_time ?? undefined,
    meetingPlace: row.meeting_place ?? undefined,
    items: row.items ?? undefined,
    notes: row.notes ?? undefined,
    rsvpDeadline: row.rsvp_deadline ?? undefined,
    grades: row.grades as GradeValue[],
    createdBy: "admin",
    createdAt: row.created_at,
  };
}

/** DB行をアプリ用Attendance型に変換 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAttendance(row: Record<string, any>): Attendance {
  return {
    id: row.id,
    gameId: row.game_id,
    userId: row.player_name,
    userName: row.player_name,
    answeredBy: row.player_name,
    status: row.status as AttendanceStatusValue,
    reason: row.reason ?? undefined,
    answeredAt: row.created_at,
  };
}

/** DB行をアプリ用Announcement型に変換 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAnnouncement(row: Record<string, any>): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    isPinned: row.is_pinned,
    targetGrades: row.target_grades as GradeValue[],
    createdBy: "admin",
    createdByName: "管理者",
    createdAt: row.created_at,
  };
}

// =============================================
// 試合（Games）
// =============================================

/** 全試合を取得 */
export async function fetchGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("date_start", { ascending: true });

  if (error) {
    console.error("試合データの取得に失敗しました:", error.message);
    return [];
  }
  return (data ?? []).map(toGame);
}

/** 学年でフィルターした試合を取得 */
export async function fetchFilteredGames(gradeFilter: GradeValue | null): Promise<Game[]> {
  const games = await fetchGames();
  if (!gradeFilter) return games;
  return games.filter((g) => g.grades.includes(gradeFilter));
}

/** 今後の試合を取得 */
export async function fetchUpcomingGames(): Promise<Game[]> {
  const now = new Date();

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .gte("date_start", now.toISOString())
    .order("date_start", { ascending: true });

  if (error) {
    console.error("今後の試合の取得に失敗しました:", error.message);
    return [];
  }
  return (data ?? []).map(toGame);
}

/** 試合を1件取得 */
export async function fetchGameById(id: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("試合の取得に失敗しました:", error.message);
    return null;
  }
  return data ? toGame(data) : null;
}

/** 試合を新規登録 */
export async function createGame(input: {
  title: string;
  type: string;
  grades: number[];
  venueName: string;
  venueAddress?: string;
  meetingPlace?: string;
  dateStart: string;
  dateEnd?: string;
  meetingTime?: string;
  rsvpDeadline?: string;
  opponent?: string;
  items?: string;
  notes?: string;
}): Promise<Game | null> {
  const { data, error } = await supabase
    .from("games")
    .insert({
      title: input.title,
      type: input.type,
      grades: input.grades,
      venue_name: input.venueName,
      venue_address: input.venueAddress || null,
      meeting_place: input.meetingPlace || null,
      date_start: input.dateStart,
      date_end: input.dateEnd || null,
      meeting_time: input.meetingTime || null,
      rsvp_deadline: input.rsvpDeadline || null,
      opponent: input.opponent || null,
      items: input.items || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("試合の登録に失敗しました:", error.message);
    return null;
  }
  return data ? toGame(data) : null;
}

/** 試合を削除 */
export async function deleteGame(id: string): Promise<boolean> {
  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) {
    console.error("試合の削除に失敗しました:", error.message);
    return false;
  }
  return true;
}

/** 試合を更新 */
export async function updateGame(id: string, input: {
  title: string;
  type: string;
  grades: number[];
  venueName: string;
  venueAddress?: string;
  meetingPlace?: string;
  dateStart: string;
  dateEnd?: string;
  meetingTime?: string;
  rsvpDeadline?: string;
  opponent?: string;
  items?: string;
  notes?: string;
}): Promise<Game | null> {
  const { data, error } = await supabase
    .from("games")
    .update({
      title: input.title,
      type: input.type,
      grades: input.grades,
      venue_name: input.venueName,
      venue_address: input.venueAddress || null,
      meeting_place: input.meetingPlace || null,
      date_start: input.dateStart,
      date_end: input.dateEnd || null,
      meeting_time: input.meetingTime || null,
      rsvp_deadline: input.rsvpDeadline || null,
      opponent: input.opponent || null,
      items: input.items || null,
      notes: input.notes || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("試合の更新に失敗しました:", error.message);
    return null;
  }
  return data ? toGame(data) : null;
}

// =============================================
// 出欠（Attendances）
// =============================================

/** 指定した試合の出欠を全件取得 */
export async function fetchAttendancesByGame(gameId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from("attendances")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("出欠データの取得に失敗しました:", error.message);
    return [];
  }
  return (data ?? []).map(toAttendance);
}

/** 出欠を送信（UPSERTで同名は上書き） */
export async function upsertAttendance(input: {
  gameId: string;
  playerName: string;
  status: "attend" | "absent" | "undecided";
  reason?: string;
}): Promise<Attendance | null> {
  const { data, error } = await supabase
    .from("attendances")
    .upsert(
      {
        game_id: input.gameId,
        player_name: input.playerName,
        status: input.status,
        reason: input.reason || null,
      },
      { onConflict: "game_id,player_name" }
    )
    .select()
    .single();

  if (error) {
    console.error("出欠の送信に失敗しました:", error.message);
    return null;
  }
  return data ? toAttendance(data) : null;
}

/** 出欠を削除 */
export async function deleteAttendance(id: string): Promise<boolean> {
  const { error } = await supabase.from("attendances").delete().eq("id", id);
  if (error) {
    console.error("出欠の削除に失敗しました:", error.message);
    return false;
  }
  return true;
}
export async function fetchAttendanceSummary(gameId: string, grades?: GradeValue[]): Promise<AttendanceSummary> {
  const attendances = await fetchAttendancesByGame(gameId);
  const attend = attendances.filter((a) => a.status === "attend").length;
  const absent = attendances.filter((a) => a.status === "absent").length;
  const undecided = 0;

  // 対象学年の登録人数から未回答を計算
  let totalPlayers = 0;
  if (typeof window !== "undefined" && grades && grades.length > 0) {
    const saved = localStorage.getItem("sk_player_counts");
    if (saved) {
      const counts = JSON.parse(saved) as Record<string, number>;
      totalPlayers = grades.reduce((sum, g) => sum + (counts[String(g)] ?? 0), 0);
    }
  }
  const noAnswer = Math.max(0, totalPlayers - attend - absent);
  const total = attend + absent + noAnswer;

  return { attend, absent, undecided, noAnswer, total };
}

// =============================================
// お知らせ（Announcements）
// =============================================

/** お知らせ全件取得（ピン留め優先、新しい順） */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("お知らせの取得に失敗しました:", error.message);
    return [];
  }
  return (data ?? []).map(toAnnouncement);
}

/** お知らせを1件取得 */
export async function fetchAnnouncementById(id: string): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("お知らせの取得に失敗しました:", error.message);
    return null;
  }
  return data ? toAnnouncement(data) : null;
}

/** お知らせを新規投稿 */
export async function createAnnouncement(input: {
  title: string;
  body: string;
  targetGrades: number[];
  isPinned?: boolean;
}): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: input.title,
      body: input.body,
      target_grades: input.targetGrades,
      is_pinned: input.isPinned ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error("お知らせの投稿に失敗しました:", error.message);
    return null;
  }
  return data ? toAnnouncement(data) : null;
}

/** お知らせを削除 */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) {
    console.error("お知らせの削除に失敗しました:", error.message);
    return false;
  }
  return true;
}

/** お知らせを更新 */
export async function updateAnnouncement(id: string, input: {
  title: string;
  body: string;
  targetGrades: number[];
  isPinned?: boolean;
}): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from("announcements")
    .update({
      title: input.title,
      body: input.body,
      target_grades: input.targetGrades,
      is_pinned: input.isPinned ?? false,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("お知らせの更新に失敗しました:", error.message);
    return null;
  }
  return data ? toAnnouncement(data) : null;
}

// =============================================
// 選手名簿 CRUD
// =============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlayer(row: Record<string, any>): Player {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade as GradeValue,
    createdAt: row.created_at,
  };
}

/** 選手一覧取得 */
export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("選手の取得に失敗:", error.message);
    return [];
  }
  return (data ?? []).map(toPlayer);
}

/** 選手追加 */
export async function createPlayer(input: { name: string; grade: GradeValue }): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .insert({ name: input.name, grade: input.grade })
    .select()
    .single();

  if (error) {
    console.error("選手の登録に失敗:", error.message);
    return null;
  }
  return data ? toPlayer(data) : null;
}

/** 選手の学年更新 */
export async function updatePlayerGrade(id: string, grade: GradeValue): Promise<boolean> {
  const { error } = await supabase
    .from("players")
    .update({ grade })
    .eq("id", id);

  if (error) {
    console.error("学年の更新に失敗:", error.message);
    return false;
  }
  return true;
}

/** 選手削除 */
export async function deletePlayer(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("選手の削除に失敗:", error.message);
    return false;
  }
  return true;
}

