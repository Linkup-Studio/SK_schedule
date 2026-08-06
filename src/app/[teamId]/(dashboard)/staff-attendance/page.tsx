"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, CheckCheck, Loader2, Share2, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/components/team/team-provider";
import { useTeamLink } from "@/hooks/use-team-link";
import { isStaffModeActive, touchStaffMode } from "@/lib/staff-auth";
import { getMyStaffName, setMyStaffName } from "@/lib/my-name";
import {
  deleteStaffAttendance,
  fetchGames,
  fetchStaffAttendancesByDate,
  upsertStaffAttendance,
} from "@/lib/supabase-data";
import { GameTypeBadge, GradeBadge } from "@/components/common/badges";
import { renderStaffAttendanceImage } from "@/lib/attendance-image";
import type { AttendanceStatusValue } from "@/lib/constants";
import type { Game, StaffAttendance } from "@/lib/types";

const STATUS_OPTIONS = [
  { status: "attend" as AttendanceStatusValue, icon: "○", label: "参加", activeClass: "bg-attend text-white shadow-attend/30 border-attend" },
  { status: "absent" as AttendanceStatusValue, icon: "×", label: "欠席", activeClass: "bg-absent text-white shadow-absent/30 border-absent" },
  { status: "undecided" as AttendanceStatusValue, icon: "△", label: "未定", activeClass: "bg-undecided text-white shadow-undecided/30 border-undecided" },
] as const;

function getStatusIcon(status: AttendanceStatusValue) {
  return STATUS_OPTIONS.find((option) => option.status === status)?.icon ?? "";
}

function getOverallStatus(morning: AttendanceStatusValue, afternoon: AttendanceStatusValue): AttendanceStatusValue {
  if (morning === "attend" && afternoon === "attend") return "attend";
  if (morning === "absent" && afternoon === "absent") return "absent";
  return "undecided";
}

function getLocalDateKey(dateValue: string | Date) {
  return format(typeof dateValue === "string" ? new Date(dateValue) : dateValue, "yyyy-MM-dd");
}

/** LINEの吹き出しが折り返さない1行の目安（全角換算） */
const SHARE_LINE_WIDTH = 13;

/** 行頭に置きたくない文字（簡易禁則処理） */
const NO_LINE_START = "、。，．）」』！？・…ー";

function getTextWidth(text: string) {
  return [...text].reduce((width, char) => width + (/[\x20-\x7E]/.test(char) ? 0.5 : 1), 0);
}

/** LINE側で中途半端に折り返されないよう、あらかじめ改行を入れる */
function wrapText(text: string, indent = "") {
  const limit = SHARE_LINE_WIDTH - getTextWidth(indent);
  const lines: string[] = [];
  let current = "";
  for (const char of text) {
    if (current && getTextWidth(current + char) > limit && !NO_LINE_START.includes(char)) {
      lines.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current) lines.push(current);
  return lines.map((line) => indent + line).join("\n");
}

/** 名前を「・」で連結しつつ、名前の途中で折り返されない長さで改行する */
function packNames(names: string[]) {
  const lines: string[] = [];
  let current = "";
  for (const name of names) {
    const candidate = current ? `${current}・${name}` : name;
    if (current && getTextWidth(candidate) > SHARE_LINE_WIDTH) {
      lines.push(current);
      current = name;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.join("\n");
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

function PeriodStatusPill({ label, status }: { label: string; status: AttendanceStatusValue }) {
  const colorClasses = {
    attend: "bg-attend/10 text-attend border-attend/30",
    absent: "bg-absent/10 text-absent border-absent/30",
    undecided: "bg-undecided/10 text-undecided border-undecided/30",
  } satisfies Record<AttendanceStatusValue, string>;

  return (
    <span className={cn("inline-flex min-w-[76px] items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-black", colorClasses[status])}>
      <span>{label}</span>
      <span className="text-[18px] leading-none">{getStatusIcon(status)}</span>
    </span>
  );
}

function PeriodStatusText({ morning, afternoon }: { morning: AttendanceStatusValue; afternoon: AttendanceStatusValue }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <PeriodStatusPill label="午前" status={morning} />
      <PeriodStatusPill label="午後" status={afternoon} />
    </div>
  );
}

function StaffAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { team, teamSlug } = useTeam();
  const teamLink = useTeamLink();
  const storageKey = `${teamSlug}_admin`;
  const attendanceDate = searchParams.get("date") ?? "";

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [dayGames, setDayGames] = useState<Game[]>([]);
  const [staffAttendances, setStaffAttendances] = useState<StaffAttendance[]>([]);
  const [staffName, setStaffName] = useState(() => getMyStaffName(teamSlug));
  const [staffMorningStatus, setStaffMorningStatus] = useState<AttendanceStatusValue | null>(null);
  const [staffAfternoonStatus, setStaffAfternoonStatus] = useState<AttendanceStatusValue | null>(null);
  const [staffNote, setStaffNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const dateLabel = useMemo(() => {
    if (!attendanceDate) return "";
    const date = new Date(`${attendanceDate}T00:00:00`);
    return format(date, "M月d日（E）", { locale: ja });
  }, [attendanceDate]);

  // 共有テキスト用。LINEで折り返さないよう短く（例: 8/8(土)）
  const shortDateLabel = useMemo(() => {
    if (!attendanceDate) return "";
    return format(new Date(`${attendanceDate}T00:00:00`), "M/d(E)", { locale: ja });
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
      setMyStaffName(teamSlug, staffName.trim());
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      setStaffMorningStatus(null);
      setStaffAfternoonStatus(null);
      setStaffNote("");
    } else {
      alert("スタッフ出欠の送信に失敗しました。もう一度お試しください。");
    }
  };

  const buildShareText = () => {
    const getPeriod = (att: StaffAttendance, period: "morning" | "afternoon") =>
      (period === "morning" ? att.morningStatus : att.afternoonStatus) ?? att.status;

    // 0人の区分は書かず「○7 ×1」のように詰める
    const periodSummary = (period: "morning" | "afternoon") =>
      STATUS_OPTIONS.map((option) => ({
        icon: option.icon,
        count: staffAttendances.filter((att) => getPeriod(att, period) === option.status).length,
      }))
        .filter((entry) => entry.count > 0)
        .map((entry) => `${entry.icon}${entry.count}`)
        .join(" ");

    const scheduleLines = dayGames.flatMap((game) => {
      const time = format(new Date(game.dateStart), "HH:mm", { locale: ja });
      const oneLine = `${time} ${game.title}`;
      return [
        getTextWidth(oneLine) <= SHARE_LINE_WIDTH ? oneLine : `${time}\n${wrapText(game.title)}`,
        game.venueName ? wrapText(game.venueName, "　") : "",
      ];
    });

    // 午前・午後が同じ人はまとめ、違う人だけ個別に書く
    const sameAll = (status: AttendanceStatusValue) =>
      staffAttendances.filter((att) => getPeriod(att, "morning") === status && getPeriod(att, "afternoon") === status);
    const mixed = staffAttendances.filter((att) => getPeriod(att, "morning") !== getPeriod(att, "afternoon"));

    const groupBlock = (heading: string, members: StaffAttendance[]) =>
      members.length > 0 ? `${heading} ${members.length}名\n${packNames(members.map((att) => att.staffName))}` : "";

    const mixedBlock =
      mixed.length > 0
        ? `🔸 一部参加 ${mixed.length}名\n${mixed
            .map((att) => `${att.staffName} 午前${getStatusIcon(getPeriod(att, "morning"))}／午後${getStatusIcon(getPeriod(att, "afternoon"))}`)
            .join("\n")}`
        : "";

    const noteBlock = (() => {
      const notes = staffAttendances.filter((att) => att.note);
      return notes.length > 0 ? `📝 メモ\n${notes.map((att) => wrapText(`${att.staffName}：${att.note}`)).join("\n")}` : "";
    })();

    return [
      `👥 ${shortDateLabel} スタッフ出欠`,
      scheduleLines.length > 0 ? `📅 予定\n${scheduleLines.filter(Boolean).join("\n")}` : "",
      `📊 回答 ${staffAttendances.length}名\n午前 ${periodSummary("morning")}\n午後 ${periodSummary("afternoon")}`,
      groupBlock("✅ 終日参加", sameAll("attend")),
      mixedBlock,
      groupBlock("🔺 未定", sameAll("undecided")),
      groupBlock("❌ 欠席", sameAll("absent")),
      noteBlock,
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  /** 画像が使えない環境向けのフォールバック（テキスト共有 → クリップボード） */
  const shareAsText = async () => {
    const text = buildShareText();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
      } catch {
        // ユーザーが共有シートを閉じた場合は何もしない
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      alert("この環境では共有・コピーができません。");
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await renderStaffAttendanceImage({
        teamName: team?.name ?? "",
        dateLabel,
        games: dayGames.map((game) => ({
          time: format(new Date(game.dateStart), "HH:mm", { locale: ja }),
          title: game.title,
          venue: game.venueName ?? "",
        })),
        rows: staffAttendances.map((att) => ({
          name: att.staffName,
          morning: att.morningStatus ?? att.status,
          afternoon: att.afternoonStatus ?? att.status,
          note: att.note ?? undefined,
        })),
      });

      const file = blob ? new File([blob], `スタッフ出欠_${attendanceDate}.png`, { type: "image/png" }) : null;
      if (file && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      // 画像共有に非対応（PCブラウザなど）ならダウンロードさせる
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `スタッフ出欠_${attendanceDate}.png`;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      await shareAsText();
    } catch (error) {
      // 共有シートを閉じただけならエラー表示は不要
      if (error instanceof DOMException && error.name === "AbortError") return;
      await shareAsText();
    } finally {
      setSharing(false);
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
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-black text-[15px] flex items-center gap-1.5"><Users className="w-4.5 h-4.5 text-info" />回答済みスタッフ</h2>
          {staffAttendances.length > 0 && (
            <button type="button" onClick={handleShare} disabled={sharing} className={cn("shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-bold transition-all shadow-sm touch-active", shareCopied ? "bg-attend/10 border-attend/30 text-attend" : "border-border bg-surface text-muted active:bg-surface-variant", sharing && "opacity-60")}>
              {sharing ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />作成中</>) : shareCopied ? (<><CheckCheck className="w-3.5 h-3.5" />コピー完了</>) : (<><Share2 className="w-3.5 h-3.5" />画像で共有</>)}
            </button>
          )}
        </div>
        <div className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
          {staffAttendances.length > 0 ? staffAttendances.map((att) => (
            <div key={att.id} className="px-3 py-3 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[13px] font-bold truncate">{att.staffName}</p>
                  <PeriodStatusText morning={att.morningStatus ?? att.status} afternoon={att.afternoonStatus ?? att.status} />
                  {att.note && <p className="text-[9px] text-info font-medium break-words">メモ: {att.note}</p>}
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
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
