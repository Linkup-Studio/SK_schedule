import type { GameType, AttendanceStatusValue, UserRole, GradeValue } from "./constants";

/** ユーザー情報 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  grade?: GradeValue;
  avatarUrl?: string;
  createdAt: string;
}

/** 試合情報 */
export interface Game {
  id: string;
  title: string;
  type: GameType;
  opponent?: string;
  venueName: string;
  venueAddress?: string;
  venueUrl?: string;
  dateStart: string;
  dateEnd?: string;
  meetingTime?: string;
  meetingPlace?: string;
  items?: string;
  notes?: string;
  rsvpDeadline?: string;
  grades: GradeValue[];
  createdBy: string;
  createdAt: string;
}

/** 出欠回答 */
export interface Attendance {
  id: string;
  gameId: string;
  userId: string;
  userName?: string;
  userGrade?: GradeValue;
  answeredBy: string;
  status: AttendanceStatusValue;
  reason?: string;
  answeredAt: string;
}

/** スタッフ出欠回答 */
export interface StaffAttendance {
  id: string;
  gameId: string;
  staffName: string;
  status: AttendanceStatusValue;
  note?: string;
  answeredAt: string;
}

/** 出欠サマリー */
export interface AttendanceSummary {
  attend: number;
  absent: number;
  undecided: number;
  noAnswer: number;
  total: number;
}

/** お知らせ */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrls?: string[];
  isPinned: boolean;
  targetGrades: GradeValue[];
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

/** 通知 */
export interface Notification {
  id: string;
  userId: string;
  type: "new_game" | "rsvp_reminder" | "game_reminder" | "new_announcement" | "new_comment";
  referenceId?: string;
  referenceType?: "game" | "announcement";
  message: string;
  isRead: boolean;
  createdAt: string;
}

/** 選手（名簿） */
export interface Player {
  id: string;
  name: string;
  grade: GradeValue;
  createdAt: string;
}
