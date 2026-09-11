import { supabase } from "./supabase";
import { sendPushToTeam } from "./push";
import type { Game, Attendance, Announcement, AttendanceSummary, Player, StaffAttendance } from "./types";
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
  const status = row.status as AttendanceStatusValue;
  return {
    id: row.id,
    gameId: row.game_id,
    userId: row.player_name,
    userName: row.player_name,
    answeredBy: row.player_name,
    status,
    morningStatus: (row.morning_status ?? status) as AttendanceStatusValue,
    afternoonStatus: (row.afternoon_status ?? status) as AttendanceStatusValue,
    reason: row.reason ?? undefined,
    answeredAt: row.created_at,
  };
}

function toStaffAttendance(row: Record<string, unknown>): StaffAttendance {
  const status = row.status as AttendanceStatusValue;
  return {
    id: String(row.id),
    gameId: String(row.game_id),
    attendanceDate: typeof row.attendance_date === "string" ? row.attendance_date : undefined,
    staffName: String(row.staff_name),
    status,
    morningStatus: (row.morning_status ?? status) as AttendanceStatusValue,
    afternoonStatus: (row.afternoon_status ?? status) as AttendanceStatusValue,
    note: typeof row.note === "string" ? row.note : undefined,
    answeredAt: String(row.created_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAnnouncement(row: Record<string, any>): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    isPinned: row.is_pinned,
    gameId: row.game_id ?? undefined,
    gameDateStart: row.games?.date_start ?? undefined,
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

const teamIdCache: Record<string, string> = {};

export async function resolveTeamId(teamSlug: string): Promise<string | null> {
  if (teamIdCache[teamSlug]) return teamIdCache[teamSlug];

  // 新スキーマ: slug 列で解決（teams.id は UUID）
  const bySlug = await supabase
    .from("teams")
    .select("id")
    .eq("slug", teamSlug)
    .maybeSingle();
  if (bySlug.data?.id) {
    teamIdCache[teamSlug] = bySlug.data.id;
    return bySlug.data.id;
  }

  // 旧スキーマ互換: id がスラッグそのもの（slug 列が無い/未設定の環境）
  const byId = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamSlug)
    .maybeSingle();
  if (byId.data?.id) {
    teamIdCache[teamSlug] = byId.data.id;
    return byId.data.id;
  }

  return null;
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

  // 当日の予定は1日残す（翌日0時になってから外す）
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("team_id", teamId)
    .gte("date_start", todayStart.toISOString())
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


// =============================================
// 取得の安全弁（2026-09-09）: 同じ取得を短時間に繰り返してもDBへは1回しか行かない
// 背景: Supabaseの送信量(egress)が月5GBを超過。DB統計で「出欠一覧＋学年人数」の取得だけが
// 画面表示回数の70倍呼ばれており、特定端末の再取得ループが疑われる。利用者の見た目は変えず、
// 15秒以内の同一取得はメモリ上の結果を返す（送信後の再取得は force で回避できる）。
// =============================================
const SHORT_TTL_MS = 15_000;
const shortCache = new Map<string, { at: number; value: Promise<unknown> }>();
function withShortCache<T>(key: string, force: boolean, run: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = shortCache.get(key);
  if (!force && hit && now - hit.at < SHORT_TTL_MS) return hit.value as Promise<T>;
  const value = run().catch((e) => { shortCache.delete(key); throw e; });
  shortCache.set(key, { at: now, value });
  if (shortCache.size > 200) shortCache.clear();
  return value;
}

export async function fetchAttendancesByGame(gameId: string, force = false): Promise<Attendance[]> {
  return withShortCache(`att:${gameId}`, force, () => fetchAttendancesByGameRaw(gameId));
}


async function fetchAttendancesByGameRaw(gameId: string): Promise<Attendance[]> {
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

/** 指定した名前で回答済みの試合ID一覧を取得（個々の「回答済み」表示用） */
export async function fetchAnsweredGameIds(teamSlug: string, playerName: string): Promise<Set<string>> {
  const name = playerName.trim();
  if (!name) return new Set();
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return new Set();

  const { data, error } = await supabase
    .from("attendances")
    .select("game_id")
    .eq("team_id", teamId)
    .eq("player_name", name);

  if (error) {
    console.error("回答済み予定の取得に失敗しました:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => String(r.game_id)));
}

export async function upsertAttendance(teamSlug: string, input: {
  gameId: string;
  playerName: string;
  status: "attend" | "absent" | "undecided";
  morningStatus?: "attend" | "absent" | "undecided";
  afternoonStatus?: "attend" | "absent" | "undecided";
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
        morning_status: input.morningStatus ?? input.status,
        afternoon_status: input.afternoonStatus ?? input.status,
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

// =============================================
// スタッフ出欠（Staff Attendances）
// =============================================

export async function fetchStaffAttendancesByDate(teamSlug: string, attendanceDate: string): Promise<StaffAttendance[]> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return [];

  const { data, error } = await supabase
    .from("staff_attendances")
    .select("*")
    .eq("team_id", teamId)
    .eq("attendance_date", attendanceDate)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("スタッフ出欠データの取得に失敗しました:", error.message);
    return [];
  }
  return (data ?? []).map(toStaffAttendance);
}

/** 指定したスタッフ名で回答済みの日付一覧を取得（スタッフ版「回答済み」表示用） */
export async function fetchStaffAnsweredDates(teamSlug: string, staffName: string): Promise<Set<string>> {
  const name = staffName.trim();
  if (!name) return new Set();
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return new Set();

  const { data, error } = await supabase
    .from("staff_attendances")
    .select("attendance_date")
    .eq("team_id", teamId)
    .eq("staff_name", name);

  if (error) {
    console.error("スタッフ回答済み日付の取得に失敗しました:", error.message);
    return new Set();
  }
  return new Set(
    (data ?? [])
      .map((r) => (typeof r.attendance_date === "string" ? r.attendance_date : null))
      .filter((d): d is string => !!d)
  );
}

export async function upsertStaffAttendance(teamSlug: string, input: {
  gameId: string;
  attendanceDate: string;
  staffName: string;
  status: "attend" | "absent" | "undecided";
  morningStatus?: "attend" | "absent" | "undecided";
  afternoonStatus?: "attend" | "absent" | "undecided";
  note?: string;
}): Promise<StaffAttendance | null> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return null;

  const { data, error } = await supabase
    .from("staff_attendances")
    .upsert(
      {
        team_id: teamId,
        game_id: input.gameId,
        attendance_date: input.attendanceDate,
        staff_name: input.staffName,
        status: input.status,
        morning_status: input.morningStatus ?? input.status,
        afternoon_status: input.afternoonStatus ?? input.status,
        note: input.note || null,
      },
      { onConflict: "team_id,attendance_date,staff_name" }
    )
    .select()
    .single();

  if (error) {
    console.error("スタッフ出欠の送信に失敗しました:", error.message);
    return null;
  }
  return data ? toStaffAttendance(data) : null;
}

export async function deleteStaffAttendance(id: string): Promise<boolean> {
  const { error } = await supabase.from("staff_attendances").delete().eq("id", id);
  if (error) {
    console.error("スタッフ出欠の削除に失敗しました:", error.message);
    return false;
  }
  return true;
}

export async function fetchPlayerCountsByGrade(teamSlug: string, force = false): Promise<Record<string, number>> {
  return withShortCache(`pc:${teamSlug}`, force, () => fetchPlayerCountsByGradeRaw(teamSlug));
}

async function fetchPlayerCountsByGradeRaw(teamSlug: string): Promise<Record<string, number>> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return {};

  const { data, error } = await supabase
    .from("teams")
    .select("player_counts")
    .eq("id", teamId)
    .single();

  if (error || !data || !data.player_counts) return {};
  return data.player_counts as Record<string, number>;
}

export async function updatePlayerCounts(teamSlug: string, counts: Record<string, number>): Promise<boolean> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return false;

  const { error } = await supabase
    .from("teams")
    .update({ player_counts: counts })
    .eq("id", teamId);

  if (error) {
    console.error("選手人数の更新に失敗:", error.message);
    return false;
  }
  return true;
}

export async function fetchAttendanceSummary(gameId: string, teamSlug: string, grades?: GradeValue[]): Promise<AttendanceSummary> {
  const attendances = await fetchAttendancesByGame(gameId);
  let totalPlayersOuter = 0;
  if (grades && grades.length > 0) {
    const counts = await fetchPlayerCountsByGrade(teamSlug);
    totalPlayersOuter = grades.reduce((sum, g) => sum + (counts[String(g)] ?? 0), 0);
  }
  return buildAttendanceSummary(attendances, totalPlayersOuter);
}

/** 集計に必要な最小限の項目だけ（名前・理由・日時は集計に使わないので取らない） */
type AttendanceTally = { status: AttendanceStatusValue; morningStatus?: AttendanceStatusValue; afternoonStatus?: AttendanceStatusValue };

/**
 * 一覧画面用: 複数試合の集計を「出欠まとめて＋学年人数1回」で作る。
 *
 * 以前は試合ごとに1回ずつ、しかも全項目(select *)を取っていたため、
 * 画面を開くたびに「試合の数」ぶんの通信が走り、名前や理由など集計に使わない
 * データまで毎回ダウンロードしていた（Supabaseのデータ通信量超過の主因・2026-09-11実測）。
 * ここでは game_id でまとめて引き、集計に使う4項目だけを取る。
 * URLが長くなりすぎないよう40件ずつに分けて問い合わせる。
 */
export async function fetchAttendanceSummaries(
  games: { id: string; grades?: GradeValue[] }[],
  teamSlug: string,
  force = false,
): Promise<Record<string, AttendanceSummary>> {
  if (games.length === 0) return {};
  const ids = [...new Set(games.map((g) => g.id))].filter(Boolean);
  const needsCounts = games.some((g) => g.grades && g.grades.length > 0);

  const [byGame, counts] = await Promise.all([
    withShortCache(`attsum:${[...ids].sort().join(",")}`, force, async () => {
      const out: Record<string, AttendanceTally[]> = {};
      for (const id of ids) out[id] = [];
      for (let i = 0; i < ids.length; i += 40) {
        const { data, error } = await supabase
          .from("attendances")
          .select("game_id,status,morning_status,afternoon_status")
          .in("game_id", ids.slice(i, i + 40));
        if (error) {
          console.error("出欠データの取得に失敗しました:", error.message);
          continue; // 取れなかったぶんは0件扱い（試合ごとに取っていた時と同じ挙動）
        }
        for (const row of data ?? []) {
          const status = row.status as AttendanceStatusValue;
          (out[row.game_id as string] ??= []).push({
            status,
            morningStatus: (row.morning_status ?? status) as AttendanceStatusValue,
            afternoonStatus: (row.afternoon_status ?? status) as AttendanceStatusValue,
          });
        }
      }
      return out;
    }),
    needsCounts ? fetchPlayerCountsByGrade(teamSlug, force) : Promise.resolve({} as Record<string, number>),
  ]);

  const out: Record<string, AttendanceSummary> = {};
  for (const g of games) {
    const totalPlayers = (g.grades ?? []).reduce((sum, gr) => sum + (counts[String(gr)] ?? 0), 0);
    out[g.id] = buildAttendanceSummary(byGame[g.id] ?? [], totalPlayers);
  }
  return out;
}

/** 出欠の配列と対象人数から集計を作る（通信はしない） */
function buildAttendanceSummary(attendances: AttendanceTally[], totalPlayers: number): AttendanceSummary {
  // 全体集計（既存の status ベース - 後方互換）
  const attend = attendances.filter((a) => a.status === "attend").length;
  const absent = attendances.filter((a) => a.status === "absent").length;
  const undecided = attendances.filter((a) => a.status === "undecided").length;

  // 午前集計 (morningStatus)
  const mAttend = attendances.filter((a) => a.morningStatus === "attend").length;
  const mAbsent = attendances.filter((a) => a.morningStatus === "absent").length;
  const mUndecided = attendances.filter((a) => a.morningStatus === "undecided").length;

  // 午後集計 (afternoonStatus)
  const aAttend = attendances.filter((a) => a.afternoonStatus === "attend").length;
  const aAbsent = attendances.filter((a) => a.afternoonStatus === "absent").length;
  const aUndecided = attendances.filter((a) => a.afternoonStatus === "undecided").length;

  const noAnswer = Math.max(0, totalPlayers - attend - absent - undecided);
  const total = attend + absent + undecided + noAnswer;

  const mNoAnswer = Math.max(0, totalPlayers - mAttend - mAbsent - mUndecided);
  const mTotal = mAttend + mAbsent + mUndecided + mNoAnswer;

  const aNoAnswer = Math.max(0, totalPlayers - aAttend - aAbsent - aUndecided);
  const aTotal = aAttend + aAbsent + aUndecided + aNoAnswer;

  return {
    attend, absent, undecided, noAnswer, total,
    morning: { attend: mAttend, absent: mAbsent, undecided: mUndecided, noAnswer: mNoAnswer, total: mTotal },
    afternoon: { attend: aAttend, absent: aAbsent, undecided: aUndecided, noAnswer: aNoAnswer, total: aTotal },
  };
}

// =============================================
// お知らせ（Announcements）
// =============================================

export async function fetchAnnouncements(teamSlug: string): Promise<Announcement[]> {
  const teamId = await resolveTeamId(teamSlug);
  if (!teamId) return [];

  const { data, error } = await supabase
    .from("announcements")
    .select("*, games(date_start)")
    .eq("team_id", teamId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("お知らせの取得に失敗しました:", error.message);
    return [];
  }
  // 予定に紐付いたお知らせは当日いっぱいで一覧から外す（翌日0時から非表示・予定タブと同じ挙動）
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return (data ?? [])
    .map(toAnnouncement)
    .filter((a) => !a.gameDateStart || new Date(a.gameDateStart) >= todayStart);
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
  /** 予定登録の自動お知らせで、元の予定へリンクするためのID */
  gameId?: string;
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
      // game_idカラム追加前の環境でも投稿が失敗しないよう、指定時だけ含める
      ...(input.gameId ? { game_id: input.gameId } : {}),
    })
    .select()
    .single();

  if (error) {
    console.error("お知らせの投稿に失敗しました:", error.message);
    return null;
  }

  if (data) {
    // 購読者へプッシュ通知（失敗しても投稿自体は成功扱い）
    const bodyPreview = input.body.replace(/\s+/g, " ").trim();
    void sendPushToTeam(teamSlug, {
      title: input.title,
      body: bodyPreview.length > 100 ? `${bodyPreview.slice(0, 100)}…` : bodyPreview,
      url: `/${teamSlug}/announcements/detail/?id=${data.id}`,
      tag: `announcement-${data.id}`,
    });
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
