"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, CheckCheck, Loader2, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/components/team/team-provider";
import { useTeamLink } from "@/hooks/use-team-link";
import { isStaffModeActive, touchStaffMode } from "@/lib/staff-auth";
import {
  deleteStaffAttendance,
  fetchGames,
  fetchStaffAttendancesByDate,
  upsertStaffAttendance,
} from "@/lib/supabase-data";
import { GameTypeBadge, GradeBadge, AttendanceBadge } from "@/components/common/badges";
import type { AttendanceStatusValue } from "@/lib/constants";
import type { Game, StaffAttendance } from "@/lib/types";

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

function getLocalDateKey(dateValue: string | Date) {
  return format(typeof dateValue === "string" ? new Date(dateValue) : dateValue, "yyyy-MM-dd");
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

function PeriodStatusText({ morning, afternoon }: { morning: AttendanceStatusValue; afternoon: AttendanceStatusValue }) {
  const icon = (status: AttendanceStatusValue) => STATUS_OPTIONS.find((s) => s.status === status)?.icon ?? "";
  return (
    <span className="text-[10px] font-bold text-muted shrink-0">
      午前 {icon(morning)} / 午後 {icon(afternoon)}
    </span>
  );
}

function StaffAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { teamSlug } = useTeam();
  const teamLink = useTeamLink();
  const storageKey = `${teamSlug}_admin`;
  const attendanceDate = searchParams.get("date") ?? "";

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [dayGames, setDayGames] = useState<Game[]>([]);
  const [staffAttendances, setStaffAttendances] = useState<StaffAttendance[]>([]);
  const [staffName, setStaffName] = useState("");
  const [staffMorningStatus, setStaffMorningStatus] = useState<AttendanceStatusValue | null>(null);
  const [staffAfternoonStatus, setStaffAfternoonStatus] = useState<AttendanceStatusValue | null>(null);
  const [staffNote, setStaffNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const dateLabel = useMemo(() => {
    if (!attendanceDate) return "";
    const date = new Date(`${attendanceDate}T00:00:00`);
    return format(date, "M月d日（E）", { locale: ja });
  }, [attendanceDate]);

  useEffect(() => {
    async function load() {
      if (!attendanceDate) {
        router.replace(teamLink("/calendar"));
        return;
      }

      setLoading(true);
      const adminState = localStorage.getItem(storageKey) === "true";
      const staffState = isStaffModeActive(teamSlug);
      if (!adminState && !staffState) {
        router.replace(teamLink("/settings"));
        return;
      }

      setIsAdmin(adminState);
      setIsStaff(staffState);

      const [games, staffData] = await Promise.all([
        fetchGames(teamSlug),
        fetchStaffAttendancesByDate(teamSlug, attendanceDate),
      ]);
      setDayGames(
        games
          .filter((game) => getLocalDateKey(game.dateStart) === attendanceDate)
          .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
      );
      setStaffAttendances(staffData);
      if (staffState) touchStaffMode(teamSlug);
      setLoading(false);
    }
    load();
  }, [attendanceDate, router, storageKey, teamLink, teamSlug]);

  const anchorGame = dayGames[0];

  const handleSubmit = async () => {
    if (!anchorGame) { alert("この日の予定が見つかりません。"); return; }
    if (!staffName.trim()) { alert("スタッフのお名前を入力してください"); return; }
    if (!staffMorningStatus || !staffAfternoonStatus) { alert("午前・午後それぞれの出欠を選択してください"); return; }

    const status = getOverallStatus(staffMorningStatus, staffAfternoonStatus);
    setSubmitting(true);
    const result = await upsertStaffAttendance(teamSlug, {
      gameId: anchorGame.id,
      attendanceDate,
      staffName: staffName.trim(),
      status,
      morningStatus: staffMorningStatus,
      afternoonStatus: staffAfternoonStatus,
      note: staffNote.trim() || undefined,
    });
    setSubmitting(false);

    if (result) {
      const fresh = await fetchStaffAttendancesByDate(teamSlug, attendanceDate);
      setStaffAttendances(fresh);
      if (isStaff) touchStaffMode(teamSlug);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      setStaffName("");
      setStaffMorningStatus(null);
      setStaffAfternoonStatus(null);
      setStaffNote("");
    } else {
      alert("スタッフ出欠の送信に失敗しました。もう一度お試しください。");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      <Link href={teamLink("/calendar")} className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2">
        <ArrowLeft className="w-4 h-4" />カレンダーに戻る
      </Link>

      <div className="bg-info/10 border-2 border-info/20 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-info" />
          <h1 className="font-black text-lg text-info">{dateLabel}のスタッフ出欠</h1>
        </div>
        <p className="text-[12px] text-muted font-bold leading-relaxed">
          この日に予定が複数あっても、スタッフ出欠はこの1日分の午前・午後だけ登録します。
        </p>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3">
        <h2 className="font-black text-[15px]">この日の予定</h2>
        {dayGames.length > 0 ? (
          <div className="space-y-2">
            {dayGames.map((game) => (
              <div key={game.id} className="rounded-xl border border-border p-3 bg-white">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <GameTypeBadge type={game.type} />
                  {game.grades.map((grade) => <GradeBadge key={grade} grade={grade} />)}
                </div>
                <p className="text-[13px] font-black">{game.title}</p>
                <p className="text-[11px] text-muted font-bold mt-0.5">
                  {format(new Date(game.dateStart), "HH:mm", { locale: ja })}　{game.venueName}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-muted">この日の予定はありません。</p>
        )}
      </div>

      <div className="bg-surface rounded-2xl border-2 border-info/20 p-4 space-y-4 shadow-sm">
        <h2 className="font-black text-[15px] flex items-center gap-1.5"><Users className="w-4.5 h-4.5 text-info" />回答済みスタッフ</h2>
        <div className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
          {staffAttendances.length > 0 ? staffAttendances.map((att) => (
            <div key={att.id} className="flex items-center justify-between px-3 py-2.5 bg-white">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold truncate">{att.staffName}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <PeriodStatusText morning={att.morningStatus ?? att.status} afternoon={att.afternoonStatus ?? att.status} />
                  {att.note && <span className="text-[9px] text-info font-medium truncate max-w-[140px]">メモ: {att.note}</span>}
                </div>
              </div>
              <div className="shrink-0 ml-2 flex items-center gap-1.5">
                <AttendanceBadge status={att.status} />
                {isAdmin && (
                  <button onClick={async () => {
                    if (!confirm(`${att.staffName} のスタッフ回答を削除しますか？`)) return;
                    setStaffAttendances((prev) => prev.filter((a) => a.id !== att.id));
                    const ok = await deleteStaffAttendance(att.id);
                    if (!ok) {
                      alert("削除に失敗しました");
                      const fresh = await fetchStaffAttendancesByDate(teamSlug, attendanceDate);
                      setStaffAttendances(fresh);
                    }
                  }} className="w-6 h-6 flex items-center justify-center rounded-lg bg-error/10 text-error active:scale-90 transition-transform">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="p-4 text-center text-[12px] text-muted">まだスタッフ出欠の回答はありません</div>
          )}
        </div>

        {submitSuccess && (
          <div className="bg-attend/10 border border-attend/20 rounded-xl p-3 text-center animate-fade-in-up">
            <p className="text-attend font-bold text-[13px]">✅ スタッフ出欠を保存しました！</p>
          </div>
        )}

        <div className="space-y-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-muted ml-1 mb-1 block">スタッフのお名前（必須）</label>
            <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="例: 佐藤 コーチ" className="w-full bg-background border border-border px-4 py-3 rounded-xl text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input" />
          </div>
          <PeriodStatusPicker label="午前" value={staffMorningStatus} onChange={setStaffMorningStatus} />
          <PeriodStatusPicker label="午後" value={staffAfternoonStatus} onChange={setStaffAfternoonStatus} />
          <div>
            <label className="text-[11px] font-bold text-muted ml-1 mb-1 block">スタッフメモ（任意）</label>
            <input type="text" value={staffNote} onChange={(e) => setStaffNote(e.target.value)} placeholder="例: 審判対応できます" className="w-full bg-background border border-border px-4 py-3 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input" />
          </div>
          <button type="button" onClick={handleSubmit} disabled={submitting || !anchorGame} className={cn("w-full py-3.5 rounded-xl font-black text-[15px] shadow-lg shadow-info/20 transition-all flex items-center justify-center gap-2 touch-active", submitting || !anchorGame ? "bg-info/50 text-white cursor-not-allowed" : "bg-info text-white active:scale-[0.98]")}>
            {submitting ? (<><Loader2 className="w-5 h-5 animate-spin" />送信中...</>) : (<><CheckCheck className="w-5 h-5" />この日のスタッフ出欠を送信する</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffAttendancePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
      <StaffAttendanceContent />
    </Suspense>
  );
}
