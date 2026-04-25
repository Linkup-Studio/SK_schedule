"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ArrowLeft, MapPin, Clock, Calendar, Users, Package, FileText,
  ExternalLink, Copy, CheckCheck, Loader2, Pencil, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/components/team/team-provider";
import { useTeamLink } from "@/hooks/use-team-link";
import { isStaffModeActive, touchStaffMode } from "@/lib/staff-auth";
import {
  fetchGameById,
  fetchAttendancesByGame,
  upsertAttendance,
  deleteGame,
  deleteAttendance,
  fetchPlayerCountsByGrade,
  fetchStaffAttendancesByDate,
  upsertStaffAttendance,
  deleteStaffAttendance,
} from "@/lib/supabase-data";
import { GameTypeBadge, GradeBadge, AttendanceBadge } from "@/components/common/badges";
import type { AttendanceStatusValue } from "@/lib/constants";
import type { Game, Attendance, StaffAttendance } from "@/lib/types";
import { Suspense } from "react";

const safeFormat = (dateValue: string | Date | null | undefined, fmt: string) => {
  if (!dateValue) return "";
  const d = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return "（未定）";
  try { return format(d, fmt, { locale: ja }); } catch { return "（形式エラー）"; }
};

const getLocalDateKey = (dateValue: string | Date) => format(typeof dateValue === "string" ? new Date(dateValue) : dateValue, "yyyy-MM-dd");

const STATUS_OPTIONS = [
  { status: "attend" as AttendanceStatusValue, icon: "○", label: "参加", activeClass: "bg-attend text-white shadow-attend/30 border-attend" },
  { status: "absent" as AttendanceStatusValue, icon: "×", label: "欠席", activeClass: "bg-absent text-white shadow-absent/30 border-absent" },
  { status: "undecided" as AttendanceStatusValue, icon: "△", label: "未定", activeClass: "bg-undecided text-white shadow-undecided/30 border-undecided" },
] as const;

function getOverallStatus(morning: AttendanceStatusValue, afternoon: AttendanceStatusValue): AttendanceStatusValue {
  if (morning === "attend" && afternoon === "attend") return "attend";
  if (morning === "absent" && afternoon === "absent") return "absent";
  return "undecided";
}

function getPeriodSummary<T extends { status: AttendanceStatusValue; morningStatus?: AttendanceStatusValue; afternoonStatus?: AttendanceStatusValue }>(
  rows: T[],
  period: "morning" | "afternoon",
  total?: number
) {
  const key = period === "morning" ? "morningStatus" : "afternoonStatus";
  const attend = rows.filter((a) => (a[key] ?? a.status) === "attend").length;
  const absent = rows.filter((a) => (a[key] ?? a.status) === "absent").length;
  const undecided = rows.filter((a) => (a[key] ?? a.status) === "undecided").length;
  const noAnswer = total === undefined ? 0 : Math.max(0, total - attend - absent - undecided);
  return { attend, absent, undecided, noAnswer };
}

function PeriodStatusPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AttendanceStatusValue | null;
  onChange: (status: AttendanceStatusValue) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-black text-muted ml-1">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {STATUS_OPTIONS.map((config) => (
          <button
            key={config.status}
            type="button"
            onClick={() => onChange(config.status)}
            className={cn(
              "flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border-2 font-bold transition-all shadow-sm active:scale-95 outline-none touch-active",
              value === config.status
                ? cn(config.activeClass, "scale-[1.02] shadow-md")
                : "border-border bg-white text-muted hover:bg-surface-variant active:bg-border"
            )}
          >
            <span className="text-2xl font-black">{config.icon}</span>
            <span className="text-[10px] mt-0.5">{config.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PeriodSummaryRows({
  morning,
  afternoon,
  showNoAnswer = true,
}: {
  morning: { attend: number; absent: number; undecided: number; noAnswer: number };
  afternoon: { attend: number; absent: number; undecided: number; noAnswer: number };
  showNoAnswer?: boolean;
}) {
  const rows = [
    { label: "午前", summary: morning },
    { label: "午後", summary: afternoon },
  ];

  return (
    <div className="space-y-2">
      {rows.map(({ label, summary }) => (
        <div key={label} className="grid grid-cols-[42px_1fr] gap-2 items-center">
          <span className="text-[11px] font-black text-muted">{label}</span>
          <div className={cn("grid gap-2", showNoAnswer ? "grid-cols-4" : "grid-cols-3")}>
            <StatBox label="参加" value={summary.attend} className="bg-attend/10 text-attend border-attend/20" />
            <StatBox label="欠席" value={summary.absent} className="bg-absent/10 text-absent border-absent/20" />
            <StatBox label="未定" value={summary.undecided} className="bg-undecided/10 text-undecided border-undecided/20" />
            {showNoAnswer && <StatBox label="未回答" value={summary.noAnswer} className="bg-gray-100 text-muted border-gray-200" />}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBox({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={cn("rounded-lg py-2 text-center border", className)}>
      <span className="text-[10px] font-bold block mb-0.5">{label}</span>
      <span className="text-[16px] font-black">{value}</span>
    </div>
  );
}

function PeriodStatusText({
  morning,
  afternoon,
}: {
  morning: AttendanceStatusValue;
  afternoon: AttendanceStatusValue;
}) {
  const icon = (status: AttendanceStatusValue) => STATUS_OPTIONS.find((s) => s.status === status)?.icon ?? "";
  return (
    <span className="text-[10px] font-bold text-muted shrink-0">
      午前 {icon(morning)} / 午後 {icon(afternoon)}
    </span>
  );
}

function GameDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { teamSlug } = useTeam();
  const teamLink = useTeamLink();
  const storageKey = `${teamSlug}_admin`;
  const id = searchParams.get("id") ?? "";
  const [isAdmin, setIsAdmin] = useState(false);

  const [game, setGame] = useState<Game | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [staffAttendances, setStaffAttendances] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [morningStatus, setMorningStatus] = useState<AttendanceStatusValue | null>(null);
  const [afternoonStatus, setAfternoonStatus] = useState<AttendanceStatusValue | null>(null);
  const [reason, setReason] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffMorningStatus, setStaffMorningStatus] = useState<AttendanceStatusValue | null>(null);
  const [staffAfternoonStatus, setStaffAfternoonStatus] = useState<AttendanceStatusValue | null>(null);
  const [staffNote, setStaffNote] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [staffSubmitSuccess, setStaffSubmitSuccess] = useState(false);
  const [gradeCounts, setGradeCounts] = useState<Record<string, number>>({});
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const adminState = localStorage.getItem(storageKey) === "true";
      const staffState = isStaffModeActive(teamSlug);
      setIsAdmin(adminState);
      setIsStaff(staffState);
      const canViewStaff = adminState || staffState;
      const [gameData, attData, counts] = await Promise.all([
        fetchGameById(id),
        fetchAttendancesByGame(id),
        fetchPlayerCountsByGrade(teamSlug),
      ]);
      setGame(gameData);
      setAttendances(attData);
      setGradeCounts(counts);
      if (canViewStaff && gameData) {
        const staffData = await fetchStaffAttendancesByDate(teamSlug, getLocalDateKey(gameData.dateStart));
        setStaffAttendances(staffData);
      } else {
        setStaffAttendances([]);
      }
      if (staffState) touchStaffMode(teamSlug);
      setLoading(false);
    }
    load();
  }, [id, storageKey, teamSlug]);

  const handleFinalSubmit = async () => {
    if (!playerName.trim()) { alert("選手のお名前を入力してください"); return; }
    if (!morningStatus || !afternoonStatus) { alert("午前・午後それぞれの出欠を選択してください"); return; }
    const status = getOverallStatus(morningStatus, afternoonStatus);
    setSubmitting(true);
    const result = await upsertAttendance(teamSlug, {
      gameId: id,
      playerName: playerName.trim(),
      status,
      morningStatus,
      afternoonStatus,
      reason: (morningStatus !== "attend" || afternoonStatus !== "attend") ? reason : undefined,
    });
    setSubmitting(false);
    if (result) {
      const fresh = await fetchAttendancesByGame(id);
      setAttendances(fresh);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      setPlayerName(""); setMorningStatus(null); setAfternoonStatus(null); setReason("");
    } else { alert("送信に失敗しました。もう一度お試しください。"); }
  };

  const handleStaffSubmit = async () => {
    if (!staffName.trim()) { alert("スタッフのお名前を入力してください"); return; }
    if (!staffMorningStatus || !staffAfternoonStatus) { alert("午前・午後それぞれの出欠を選択してください"); return; }
    const status = getOverallStatus(staffMorningStatus, staffAfternoonStatus);
    setStaffSubmitting(true);
    const attendanceDate = game ? getLocalDateKey(game.dateStart) : "";
    const result = await upsertStaffAttendance(teamSlug, {
      gameId: id,
      attendanceDate,
      staffName: staffName.trim(),
      status,
      morningStatus: staffMorningStatus,
      afternoonStatus: staffAfternoonStatus,
      note: staffNote.trim() || undefined,
    });
    setStaffSubmitting(false);
    if (result) {
      const fresh = await fetchStaffAttendancesByDate(teamSlug, attendanceDate);
      setStaffAttendances(fresh);
      if (isStaff) touchStaffMode(teamSlug);
      setStaffSubmitSuccess(true);
      setTimeout(() => setStaffSubmitSuccess(false), 3000);
      setStaffName(""); setStaffMorningStatus(null); setStaffAfternoonStatus(null); setStaffNote("");
    } else {
      alert("スタッフ出欠の送信に失敗しました。もう一度お試しください。");
    }
  };

  const handleCopyInfo = useCallback(() => {
    if (!game) return;
    const dateStart = new Date(game.dateStart);
    const text = [`📅 ${game.title}`, `日時: ${safeFormat(dateStart, "M月d日（E） HH:mm")}`, game.meetingTime ? `集合: ${game.meetingTime}${game.meetingPlace ? ` @ ${game.meetingPlace}` : ""}` : "", `会場: ${game.venueName}`, game.venueAddress ? `住所: ${game.venueAddress}` : "", game.items ? `持ち物: ${game.items}` : ""].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => { setShowCopied(true); setTimeout(() => setShowCopied(false), 2000); });
  }, [game]);

  if (loading) {
    return (<div className="flex items-center justify-center h-[60vh]"><div className="text-center space-y-3"><Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" /><p className="text-sm text-muted font-bold">読み込み中...</p></div></div>);
  }
  if (!game) {
    return (<div className="px-4 py-12 text-center"><h1 className="text-base font-bold mb-2">試合が見つかりません</h1><Link href={teamLink("/calendar")} className="text-primary font-bold text-sm">カレンダーに戻る</Link></div>);
  }

  const dateStart = new Date(game.dateStart);
  const isValidDate = !isNaN(dateStart.getTime());
  const isPast = isValidDate && dateStart < new Date();
  const daysUntil = isValidDate ? differenceInDays(dateStart, new Date()) : -1;
  const totalPlayers = game.grades.reduce((sum, g) => sum + (gradeCounts[String(g)] ?? 0), 0);
  const playerMorningSummary = getPeriodSummary(attendances, "morning", totalPlayers);
  const playerAfternoonSummary = getPeriodSummary(attendances, "afternoon", totalPlayers);
  const canViewStaff = isAdmin || isStaff;
  const staffMorningSummary = getPeriodSummary(staffAttendances, "morning");
  const staffAfternoonSummary = getPeriodSummary(staffAttendances, "afternoon");

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      <Link href={teamLink("/calendar")} className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2"><ArrowLeft className="w-4 h-4" />カレンダーに戻る</Link>

      <div className="bg-gradient-hero rounded-2xl p-4 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <GameTypeBadge type={game.type} size="md" />
            {game.grades.map((g) => (<GradeBadge key={g} grade={g} />))}
          </div>
          <h1 className="text-lg font-black mb-1 leading-tight">{game.title}</h1>
          {game.opponent && <p className="text-[13px] text-primary-100 font-bold">vs {game.opponent}</p>}
          <div className="flex items-center gap-2 mt-2.5">
            {!isPast && daysUntil >= 0 && (<span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold">{daysUntil === 0 ? "🔥 今日" : daysUntil === 1 ? "⏰ 明日" : `📅 ${daysUntil}日後`}</span>)}
            {isPast && (<span className="inline-flex items-center gap-1 bg-black/20 rounded-full px-2.5 py-1 text-[11px] font-bold">✅ 終了</span>)}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleCopyInfo} className={cn("flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border bg-surface text-[13px] font-bold transition-all shadow-sm touch-active", showCopied ? "bg-green-50 border-green-200 text-attend" : "active:bg-surface-variant text-muted")}>
          {showCopied ? (<><CheckCheck className="w-4 h-4" />コピー完了</>) : (<><Copy className="w-4 h-4" />情報をコピー</>)}
        </button>
      </div>

      {isAdmin && (
        <div className="flex gap-2">
          <Link href={teamLink(`/games/edit?id=${game.id}`)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-primary/20 bg-primary-50 text-primary text-[13px] font-bold active:scale-95 transition-all">
            <Pencil className="w-3.5 h-3.5" />編集
          </Link>
          <button onClick={async () => { if (!confirm("この予定を削除しますか？")) return; const ok = await deleteGame(game.id); if (ok) { alert("削除しました"); router.push(teamLink("/calendar")); } else { alert("削除に失敗しました"); }}} className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-red-200 bg-red-50 text-error text-[13px] font-bold active:scale-95 transition-all">
            <Trash2 className="w-3.5 h-3.5" />削除
          </button>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border divide-y divide-border/50 shadow-sm overflow-hidden">
        <InfoRow icon={<Calendar className="w-4.5 h-4.5 text-primary" />} label="日時" value={<div><p className="font-bold text-[14px]">{safeFormat(game.dateStart, "M月d日（E）")}</p><p className="text-[12px] text-muted mt-0.5">{safeFormat(game.dateStart, "HH:mm")}{game.dateEnd && ` 〜 ${safeFormat(game.dateEnd, "HH:mm")}`}</p></div>} />
        {game.meetingTime && (<InfoRow icon={<Clock className="w-4.5 h-4.5 text-warning" />} label="集合" value={<div><p className="font-bold text-[14px]">{game.meetingTime}</p>{game.meetingPlace && <p className="text-[12px] text-muted mt-0.5">{game.meetingPlace}</p>}</div>} />)}
        <InfoRow icon={<MapPin className="w-4.5 h-4.5 text-error" />} label="会場" value={<div><p className="font-bold text-[14px]">{game.venueName}</p>{game.venueAddress && <p className="text-[12px] text-muted mt-0.5 leading-relaxed">{game.venueAddress}</p>}{game.venueUrl && <a href={game.venueUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-primary font-bold mt-1.5"><ExternalLink className="w-3.5 h-3.5" />Google Maps</a>}</div>} />
        {game.items && (<InfoRow icon={<Package className="w-4.5 h-4.5 text-info" />} label="持ち物" value={<p className="text-[13px] leading-relaxed">{game.items}</p>} />)}
        {game.notes && (<InfoRow icon={<FileText className="w-4.5 h-4.5 text-muted" />} label="備考" value={<p className="text-[13px] leading-relaxed whitespace-pre-wrap">{game.notes}</p>} />)}
      </div>

      {!isPast && (
        <div className="bg-surface rounded-2xl border-2 border-primary/20 p-4 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-light" />
          {submitSuccess && (<div className="bg-attend/10 border border-attend/20 rounded-xl p-3 text-center animate-fade-in-up"><p className="text-attend font-bold text-[13px]">✅ 出欠を保存しました！</p></div>)}
          <div className="text-center mb-2"><h2 className="font-black text-[15px] mb-2">出欠を送信</h2>{game.rsvpDeadline ? <div className="inline-flex items-center gap-1.5 bg-error/10 border-2 border-error/25 rounded-xl px-4 py-2"><span className="text-[13px] font-black text-error">⏰ 締切: {safeFormat(game.rsvpDeadline, "M月d日（E）")}まで</span></div> : <p className="text-[11px] text-muted">いつでも回答・変更できます</p>}</div>
          <div className="space-y-3">
            <div><label className="text-[11px] font-bold text-muted ml-1 mb-1 block">選手のお名前（必須）</label><input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="例: 佐藤 太郎" className="w-full bg-background border border-border px-4 py-3 rounded-xl text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input" /></div>
            <div className="space-y-3">
              <PeriodStatusPicker label="午前" value={morningStatus} onChange={setMorningStatus} />
              <PeriodStatusPicker label="午後" value={afternoonStatus} onChange={setAfternoonStatus} />
              {(morningStatus && afternoonStatus && (morningStatus !== "attend" || afternoonStatus !== "attend")) && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 animate-fade-in-up">
                  <label className="text-[10px] font-bold text-undecided flex items-center gap-1 mb-1">理由・補足（任意）</label>
                  <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="例: 午後は塾のため欠席" className="w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-undecided/30 shadow-sm" />
                </div>
              )}
              <div className="bg-info/10 border border-info/20 rounded-xl px-3 py-2.5 text-center"><p className="text-[11px] font-bold text-info">🔄 同じお名前で再送信すると、回答を修正できます</p></div>
              <div className="pt-2"><button type="button" onClick={handleFinalSubmit} disabled={submitting} className={cn("w-full py-3.5 rounded-xl font-black text-[15px] shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 touch-active", submitting ? "bg-primary/50 text-white cursor-not-allowed" : "bg-primary text-white active:bg-primary-light active:scale-[0.98]")}>{submitting ? (<><Loader2 className="w-5 h-5 animate-spin" />送信中...</>) : (<><CheckCheck className="w-5 h-5" />この出欠を送信する</>)}</button></div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border p-4 space-y-3 shadow-sm">
        <h2 className="font-black text-[15px] flex items-center gap-1.5"><Users className="w-4.5 h-4.5 text-primary" />回答済み一覧</h2>
        <PeriodSummaryRows morning={playerMorningSummary} afternoon={playerAfternoonSummary} />
        <div className="pt-2">
          <div className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
            {attendances.length > 0 ? attendances.map((att) => (
              <div key={att.id} className="flex items-center justify-between px-3 py-2.5 bg-white">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold truncate">{att.userName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <PeriodStatusText morning={att.morningStatus ?? att.status} afternoon={att.afternoonStatus ?? att.status} />
                      {att.reason && <span className="text-[9px] text-error font-medium truncate max-w-[140px]">理由: {att.reason}</span>}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 ml-2 flex items-center gap-1.5"><AttendanceBadge status={att.status} />{isAdmin && <button onClick={async () => { if (!confirm(`${att.userName} の回答を削除しますか？`)) return; setAttendances(prev => prev.filter(a => a.id !== att.id)); const ok = await deleteAttendance(att.id); if (!ok) { alert("削除に失敗しました"); const fresh = await fetchAttendancesByGame(id); setAttendances(fresh); }}} className="w-6 h-6 flex items-center justify-center rounded-lg bg-error/10 text-error active:scale-90 transition-transform"><Trash2 className="w-3 h-3" /></button>}</div>
              </div>
            )) : (<div className="p-4 text-center text-[12px] text-muted">まだ出欠の回答はありません</div>)}
          </div>
        </div>
      </div>

      {canViewStaff && (
        <div className="bg-surface rounded-2xl border-2 border-info/20 p-4 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-info" />
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-black text-[15px] flex items-center gap-1.5"><Users className="w-4.5 h-4.5 text-info" />この日のスタッフ出欠</h2>
            <span className="text-[10px] font-black text-info bg-info/10 border border-info/20 px-2 py-1 rounded-lg">スタッフ限定</span>
          </div>

          <PeriodSummaryRows morning={staffMorningSummary} afternoon={staffAfternoonSummary} showNoAnswer={false} />

          <div className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
            {staffAttendances.length > 0 ? staffAttendances.map((att) => (
              <div key={att.id} className="flex items-center justify-between px-3 py-2.5 bg-white">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold truncate">{att.staffName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <PeriodStatusText morning={att.morningStatus ?? att.status} afternoon={att.afternoonStatus ?? att.status} />
                      {att.note && <span className="text-[9px] text-info font-medium truncate max-w-[140px]">メモ: {att.note}</span>}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 ml-2 flex items-center gap-1.5">
                  <AttendanceBadge status={att.status} />
                  {isAdmin && <button onClick={async () => { if (!confirm(`${att.staffName} のスタッフ回答を削除しますか？`)) return; setStaffAttendances(prev => prev.filter(a => a.id !== att.id)); const ok = await deleteStaffAttendance(att.id); if (!ok) { alert("削除に失敗しました"); const fresh = await fetchStaffAttendancesByDate(teamSlug, getLocalDateKey(game.dateStart)); setStaffAttendances(fresh); }}} className="w-6 h-6 flex items-center justify-center rounded-lg bg-error/10 text-error active:scale-90 transition-transform"><Trash2 className="w-3 h-3" /></button>}
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-[12px] text-muted">まだスタッフ出欠の回答はありません</div>
            )}
          </div>

          {!isPast && (
            <div className="space-y-3 pt-1">
              {staffSubmitSuccess && (<div className="bg-attend/10 border border-attend/20 rounded-xl p-3 text-center animate-fade-in-up"><p className="text-attend font-bold text-[13px]">✅ スタッフ出欠を保存しました！</p></div>)}
              <div>
                <label className="text-[11px] font-bold text-muted ml-1 mb-1 block">スタッフのお名前（必須）</label>
                <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="例: 佐藤 コーチ" className="w-full bg-background border border-border px-4 py-3 rounded-xl text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input" />
              </div>
              <div className="space-y-3">
                <PeriodStatusPicker label="午前" value={staffMorningStatus} onChange={setStaffMorningStatus} />
                <PeriodStatusPicker label="午後" value={staffAfternoonStatus} onChange={setStaffAfternoonStatus} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted ml-1 mb-1 block">スタッフメモ（任意）</label>
                <input type="text" value={staffNote} onChange={(e) => setStaffNote(e.target.value)} placeholder="例: 審判対応できます" className="w-full bg-background border border-border px-4 py-3 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input" />
              </div>
              <button type="button" onClick={handleStaffSubmit} disabled={staffSubmitting} className={cn("w-full py-3.5 rounded-xl font-black text-[15px] shadow-lg shadow-info/20 transition-all flex items-center justify-center gap-2 touch-active", staffSubmitting ? "bg-info/50 text-white cursor-not-allowed" : "bg-info text-white active:scale-[0.98]")}>
                {staffSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />送信中...</>) : (<><CheckCheck className="w-5 h-5" />スタッフ出欠を送信する</>)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (<div className="flex gap-3 px-3.5 py-3"><div className="mt-0.5 shrink-0">{icon}</div><div className="flex-1 min-w-0"><span className="text-[10px] font-bold text-muted block mb-0.5">{label}</span>{value}</div></div>);
}

export default function GameDetailPage() {
  return (<Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}><GameDetailContent /></Suspense>);
}
