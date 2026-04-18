import { supabase } from "./supabase";
import type { Game, Attendance, Announcement, AttendanceSummary, Player } from "./types";
import type { GradeValue, GameType, AttendanceStatusValue } from "./constants";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlayer(row: Record<string, any>): Player {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade as GradeValue,
    createdAt: row.created_at,
  };
}

// =============================================
// チームID解決
// =============================================

let teamIdCache: Record<string, string> = {};

export async function resolveTeamId(teamSlug: string): Promise<string | null> {
  if (teamIdCache[teamSlug]) return teamIdCache[teamSlug];

  const { data, error } = await supabase
    .from("teams")
    .select("id")
    .eq("slug", teamSlug)
    .single();

  if (error || !data) return null;
  teamIdCache[teamSlug] = data.id;
  return data.id;
}

// =============================================
// 試合（Games）
// =============================================

export async function fetchGames(teamSlug: string): Promise<Game[]> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return [];

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("team_id", teamId)
    .order("date_start", { ascending: true });

  if (error) {
    console.error("試合データの取得に失敗しました:", error.message);
    return [];
  }
  return (data ?? []).map(toGame);
}

export async function fetchFilteredGames(teamSlug: string, gradeFilter: GradeValue | null): Promise<Game[]> {
  const games = await fetchGames(teamSlug);
  if (!gradeFilter) return games;
  return games.filter((g) => g.grades.includes(gradeFilter));
}

export async function fetchUpcomingGames(teamSlug: string): Promise<Game[]> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return [];

  const now = new Date();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("team_id", teamId)
    .gte("date_start", now.toISOString())
    .order("date_start", { ascending: true });

  if (error) {
    console.error("今後の試合の取得に失敗しました:", error.message);
    return [];
  }
  return (data ?? []).map(toGame);
}

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

export async function createGame(teamSlug: string, input: {
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
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return null;

  const { data, error } = await supabase
    .from("games")
    .insert({
      team_id: teamId,
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

export async function deleteGame(id: string): Promise<boolean> {
  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) {
    console.error("試合の削除に失敗しました:", error.message);
    return false;
  }
  return true;
}

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

export async function upsertAttendance(teamSlug: string, input: {
  gameId: string;
  playerName: string;
  status: "attend" | "absent" | "undecided";
  reason?: string;
}): Promise<Attendance | null> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return null;

  const { data, error } = await supabase
    .from("attendances")
    .upsert(
      {
        team_id: teamId,
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

export async function deleteAttendance(id: string): Promise<boolean> {
  const { error } = await supabase.from("attendances").delete().eq("id", id);
  if (error) {
    console.error("出欠の削除に失敗しました:", error.message);
    return false;
  }
  return true;
}

export async function fetchAttendanceSummary(gameId: string, teamSlug: string, grades?: GradeValue[]): Promise<AttendanceSummary> {
  const attendances = await fetchAttendancesByGame(gameId);
  const attend = attendances.filter((a) => a.status === "attend").length;
  const absent = attendances.filter((a) => a.status === "absent").length;
  const undecided = 0;

  let totalPlayers = 0;
  if (typeof window !== "undefined" && grades && grades.length > 0) {
    const saved = localStorage.getItem(`${teamSlug}_player_counts`);
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

export async function fetchAnnouncements(teamSlug: string): Promise<Announcement[]> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return [];

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("team_id", teamId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("お知らせの取得に失敗しました:", error.message);
    return [];
  }
  return (data ?? []).map(toAnnouncement);
}

export async function cleanupOldAnnouncements(teamSlug: string): Promise<number> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return 0;

  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  const { data, error } = await supabase
    .from("announcements")
    .delete()
    .eq("team_id", teamId)
    .eq("is_pinned", false)
    .lt("created_at", threeWeeksAgo.toISOString())
    .select("id");

  if (error) {
    console.error("古いお知らせの自動削除に失敗しました:", error.message);
    return 0;
  }
  return data?.length ?? 0;
}

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

export async function createAnnouncement(teamSlug: string, input: {
  title: string;
  body: string;
  targetGrades: number[];
  isPinned?: boolean;
}): Promise<Announcement | null> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return null;

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      team_id: teamId,
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

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) {
    console.error("お知らせの削除に失敗しました:", error.message);
    return false;
  }
  return true;
}

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

export async function fetchPlayers(teamSlug: string): Promise<Player[]> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return [];

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId)
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("選手の取得に失敗:", error.message);
    return [];
  }
  return (data ?? []).map(toPlayer);
}

export async function createPlayer(teamSlug: string, input: { name: string; grade: GradeValue }): Promise<Player | null> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return null;

  const { data, error } = await supabase
    .from("players")
    .insert({ team_id: teamId, name: input.name, grade: input.grade })
    .select()
    .single();

  if (error) {
    console.error("選手の登録に失敗:", error.message);
    return null;
  }
  return data ? toPlayer(data) : null;
}

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
