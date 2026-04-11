/**
 * モックデータ（Phase 1: Supabase接続前の開発用）
 * 実際のDB接続時にこのファイルを置き換える
 */
import type { Game, User, Attendance, Announcement, Notification, AttendanceSummary } from "./types";
import type { GradeValue } from "./constants";

// ===== ユーザーデータ =====
export const MOCK_CURRENT_USER: User = {
  id: "admin-001",
  name: "佐藤 監督",
  email: "sato@example.com",
  role: "admin",
  createdAt: "2026-01-01T00:00:00Z",
};

export const MOCK_USERS: User[] = [
  MOCK_CURRENT_USER,
  { id: "coach-001", name: "田中 コーチ", email: "tanaka@example.com", role: "admin", createdAt: "2026-01-01T00:00:00Z" },
  // 中3
  { id: "p3-001", name: "山田 太郎", email: "yamada@example.com", role: "player", grade: 3, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p3-002", name: "鈴木 一郎", email: "suzuki@example.com", role: "player", grade: 3, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p3-003", name: "高橋 翔太", email: "takahashi@example.com", role: "player", grade: 3, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p3-004", name: "伊藤 大輝", email: "ito@example.com", role: "player", grade: 3, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p3-005", name: "渡辺 蓮", email: "watanabe@example.com", role: "player", grade: 3, createdAt: "2026-01-01T00:00:00Z" },
  // 中2
  { id: "p2-001", name: "中村 健太", email: "nakamura@example.com", role: "player", grade: 2, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p2-002", name: "小林 悠斗", email: "kobayashi@example.com", role: "player", grade: 2, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p2-003", name: "加藤 陽太", email: "kato@example.com", role: "player", grade: 2, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p2-004", name: "吉田 颯太", email: "yoshida@example.com", role: "player", grade: 2, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p2-005", name: "山本 大翔", email: "yamamoto@example.com", role: "player", grade: 2, createdAt: "2026-01-01T00:00:00Z" },
  // 中1
  { id: "p1-001", name: "松本 海斗", email: "matsumoto@example.com", role: "player", grade: 1, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p1-002", name: "井上 陸", email: "inoue@example.com", role: "player", grade: 1, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p1-003", name: "木村 蒼空", email: "kimura@example.com", role: "player", grade: 1, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p1-004", name: "林 結翔", email: "hayashi@example.com", role: "player", grade: 1, createdAt: "2026-01-01T00:00:00Z" },
  { id: "p1-005", name: "清水 湊斗", email: "shimizu@example.com", role: "player", grade: 1, createdAt: "2026-01-01T00:00:00Z" },
];

// ===== 試合データ =====
const today = new Date();
const d = (daysFromNow: number, hours: number = 9): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, 0, 0, 0);
  return date.toISOString();
};

export const MOCK_GAMES: Game[] = [
  {
    id: "game-001",
    title: "春季大会 1回戦",
    type: "official",
    opponent: "城東シニア",
    venueName: "市民球場 Aグラウンド",
    venueAddress: "東京都○○区○○1-2-3",
    venueUrl: "https://maps.google.com/?q=市民球場",
    dateStart: d(2, 9),
    dateEnd: d(2, 12),
    meetingTime: "07:30",
    meetingPlace: "球場正面入口",
    items: "ユニフォーム一式、スパイク、飲み物（2L以上）、お弁当",
    notes: "保護者の方は応援席からの応援をお願いします。",
    rsvpDeadline: d(0),
    grades: [3],
    createdBy: "admin-001",
    createdAt: d(-5),
  },
  {
    id: "game-002",
    title: "練習試合 vs 南部ボーイズ",
    type: "practice",
    opponent: "南部ボーイズ",
    venueName: "SK専用グラウンド",
    venueAddress: "東京都○○区○○4-5-6",
    dateStart: d(3, 13),
    dateEnd: d(3, 17),
    meetingTime: "12:30",
    meetingPlace: "グラウンド集合",
    items: "練習着、スパイク、飲み物",
    grades: [2, 3],
    createdBy: "admin-001",
    createdAt: d(-3),
  },
  {
    id: "game-003",
    title: "○○カップ（2日間）",
    type: "tournament",
    opponent: "初戦: 抽選",
    venueName: "県営球場",
    venueAddress: "東京都○○市○○7-8-9",
    venueUrl: "https://maps.google.com/?q=県営球場",
    dateStart: d(8, 8),
    dateEnd: d(9, 17),
    meetingTime: "07:00",
    meetingPlace: "球場バス停前",
    items: "ユニフォーム一式（ホーム・ビジター両方）、スパイク、飲み物、お弁当2日分",
    notes: "2日間の大会です。宿泊はありません。雨天の場合は翌週に順延。",
    rsvpDeadline: d(5),
    grades: [1, 2, 3],
    createdBy: "admin-001",
    createdAt: d(-2),
  },
  {
    id: "game-004",
    title: "練習試合 vs 北区ファイターズ",
    type: "practice",
    opponent: "北区ファイターズ",
    venueName: "北区第二グラウンド",
    dateStart: d(10, 9),
    dateEnd: d(10, 12),
    meetingTime: "08:30",
    meetingPlace: "現地集合",
    items: "練習着、スパイク、飲み物",
    grades: [1],
    createdBy: "coach-001",
    createdAt: d(-1),
  },
  {
    id: "game-005",
    title: "練習試合 vs 西部シニア",
    type: "practice",
    opponent: "西部シニア",
    venueName: "SK専用グラウンド",
    dateStart: d(15, 9),
    dateEnd: d(15, 15),
    meetingTime: "08:30",
    meetingPlace: "グラウンド集合",
    grades: [2],
    createdBy: "admin-001",
    createdAt: d(-1),
  },
  // 過去の試合
  {
    id: "game-past-001",
    title: "練習試合 vs 東部クラブ",
    type: "practice",
    opponent: "東部クラブ",
    venueName: "東部グラウンド",
    dateStart: d(-3, 9),
    dateEnd: d(-3, 12),
    grades: [3],
    createdBy: "admin-001",
    createdAt: d(-10),
  },
];

// ===== 出欠データ =====
export const MOCK_ATTENDANCES: Attendance[] = [
  // game-001 (中3)
  { id: "att-001", gameId: "game-001", userId: "p3-001", userName: "山田 太郎", userGrade: 3, answeredBy: "p3-001", status: "attend", answeredAt: d(-2) },
  { id: "att-002", gameId: "game-001", userId: "p3-002", userName: "鈴木 一郎", userGrade: 3, answeredBy: "p3-002", status: "attend", answeredAt: d(-2) },
  { id: "att-003", gameId: "game-001", userId: "p3-003", userName: "高橋 翔太", userGrade: 3, answeredBy: "p3-003", status: "absent", reason: "塾のため", answeredAt: d(-1) },
  { id: "att-004", gameId: "game-001", userId: "p3-004", userName: "伊藤 大輝", userGrade: 3, answeredBy: "p3-004", status: "attend", answeredAt: d(-1) },
  // p3-005 未回答

  // game-002 (中2, 中3)
  { id: "att-005", gameId: "game-002", userId: "p3-001", userName: "山田 太郎", userGrade: 3, answeredBy: "p3-001", status: "attend", answeredAt: d(-1) },
  { id: "att-006", gameId: "game-002", userId: "p2-001", userName: "中村 健太", userGrade: 2, answeredBy: "p2-001", status: "attend", answeredAt: d(-1) },
  { id: "att-007", gameId: "game-002", userId: "p2-002", userName: "小林 悠斗", userGrade: 2, answeredBy: "p2-002", status: "undecided", answeredAt: d(-1) },

  // game-003 (全学年)
  { id: "att-008", gameId: "game-003", userId: "p3-001", userName: "山田 太郎", userGrade: 3, answeredBy: "p3-001", status: "attend", answeredAt: d(-1) },
  { id: "att-009", gameId: "game-003", userId: "p2-001", userName: "中村 健太", userGrade: 2, answeredBy: "p2-001", status: "attend", answeredAt: d(-1) },
  { id: "att-010", gameId: "game-003", userId: "p1-001", userName: "松本 海斗", userGrade: 1, answeredBy: "p1-001", status: "undecided", answeredAt: d(-1) },
];

// ===== お知らせデータ =====
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-001",
    title: "4月の月謝について",
    body: "4月分の月謝（8,000円）の引き落とし日は4月25日（金）です。\n口座残高のご確認をお願いいたします。\n\nご不明な点がございましたら、佐藤監督までご連絡ください。",
    isPinned: true,
    targetGrades: [1, 2, 3],
    createdBy: "admin-001",
    createdByName: "佐藤 監督",
    createdAt: d(-3),
  },
  {
    id: "ann-002",
    title: "GW合宿のお知らせ",
    body: "ゴールデンウィーク期間中（5/3〜5/5）に合宿を行います。\n\n場所: ○○スポーツセンター\n費用: 15,000円（宿泊費・食事代込み）\n\n詳細は後日改めてお知らせいたします。参加希望の方は4月20日までにお知らせください。",
    isPinned: false,
    targetGrades: [1, 2, 3],
    createdBy: "admin-001",
    createdByName: "佐藤 監督",
    createdAt: d(-5),
  },
  {
    id: "ann-003",
    title: "中3 保護者会開催のご案内",
    body: "下記の日程で中3の保護者会を開催いたします。\n\n日時: 4月19日（日）14:00〜\n場所: SK専用グラウンド会議室\n\n議題:\n・今後の大会スケジュールについて\n・夏の遠征計画について\n・その他\n\nご出席のほどよろしくお願いいたします。",
    isPinned: false,
    targetGrades: [3],
    createdBy: "admin-001",
    createdByName: "佐藤 監督",
    createdAt: d(-7),
  },
];

// ===== 通知データ =====
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "notif-001", userId: "admin-001", type: "new_game", referenceId: "game-004", referenceType: "game", message: "新しい試合「練習試合 vs 北区ファイターズ」が登録されました", isRead: false, createdAt: d(-1) },
  { id: "notif-002", userId: "admin-001", type: "rsvp_reminder", referenceId: "game-001", referenceType: "game", message: "「春季大会 1回戦」の出欠回答期限が近づいています（未回答1名）", isRead: false, createdAt: d(0) },
  { id: "notif-003", userId: "admin-001", type: "new_announcement", referenceId: "ann-001", referenceType: "announcement", message: "お知らせ「4月の月謝について」が投稿されました", isRead: true, createdAt: d(-3) },
];

// ===== ヘルパー関数 =====

/** 試合の出欠サマリーを取得 */
export function getAttendanceSummary(gameId: string, grades: GradeValue[]): AttendanceSummary {
  const gameAttendances = MOCK_ATTENDANCES.filter((a) => a.gameId === gameId);
  const targetPlayers = MOCK_USERS.filter(
    (u) => u.role === "player" && u.grade !== undefined && grades.includes(u.grade)
  );

  const attend = gameAttendances.filter((a) => a.status === "attend").length;
  const absent = gameAttendances.filter((a) => a.status === "absent").length;
  const undecided = gameAttendances.filter((a) => a.status === "undecided").length;
  const answered = attend + absent + undecided;
  const noAnswer = targetPlayers.length - answered;

  return { attend, absent, undecided, noAnswer, total: targetPlayers.length };
}

/** 学年でフィルターした試合を取得 */
export function getFilteredGames(gradeFilter: GradeValue | null): Game[] {
  if (!gradeFilter) return MOCK_GAMES;
  return MOCK_GAMES.filter((g) => g.grades.includes(gradeFilter));
}

/** 未来の試合のみ取得 */
export function getUpcomingGames(games: Game[]): Game[] {
  const now = new Date();
  return games
    .filter((g) => new Date(g.dateStart) >= now)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
}

/** 直近の試合（今週＋来週） */
export function getThisWeekGames(): Game[] {
  const now = new Date();
  const twoWeeksLater = new Date(now);
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
  return MOCK_GAMES
    .filter((g) => {
      const d = new Date(g.dateStart);
      return d >= now && d <= twoWeeksLater;
    })
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
}
