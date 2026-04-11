/** チーム設定 */
export const TEAM_NAME = "一色SKクラブ";
export const TEAM_SHORT = "SK";

/** 学年ラベル */
export const GRADES = [
  { value: 1, label: "中1", short: "1年" },
  { value: 2, label: "中2", short: "2年" },
  { value: 3, label: "中3", short: "3年" },
] as const;

export const GRADE_ALL_LABEL = "すべて";

/** 試合種別 */
export const GAME_TYPES = [
  { value: "official", label: "公式戦", color: "official" },
  { value: "practice", label: "練習試合", color: "practice" },
  { value: "other", label: "その他", color: "other" },
] as const;

/** 出欠ステータス */
export const ATTENDANCE_STATUS = [
  { value: "attend", label: "参加", icon: "○", color: "attend" },
  { value: "absent", label: "欠席", icon: "×", color: "absent" },
  { value: "undecided", label: "未定", icon: "△", color: "undecided" },
] as const;

/** ユーザーロール */
export const ROLES = [
  { value: "admin", label: "管理者" },
  { value: "player", label: "選手" },
  { value: "parent", label: "保護者" },
] as const;

/** ナビゲーション */
export const NAV_ITEMS = [
  { href: "/dashboard", label: "ホーム", icon: "home" },
  { href: "/calendar", label: "カレンダー", icon: "calendar" },
  { href: "/announcements", label: "お知らせ", icon: "megaphone" },
  { href: "/settings", label: "マイページ", icon: "user" },
] as const;

export type GameType = (typeof GAME_TYPES)[number]["value"];
export type AttendanceStatusValue = (typeof ATTENDANCE_STATUS)[number]["value"];
export type UserRole = (typeof ROLES)[number]["value"];
export type GradeValue = (typeof GRADES)[number]["value"];
