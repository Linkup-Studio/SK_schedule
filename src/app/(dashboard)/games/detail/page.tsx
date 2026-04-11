"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Users,
  Package,
  FileText,
  ExternalLink,
  Share2,
  Copy,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchGameById, fetchAttendancesByGame, upsertAttendance } from "@/lib/supabase-data";
import { GameTypeBadge, GradeBadge, AttendanceBadge } from "@/components/common/badges";
import type { AttendanceStatusValue } from "@/lib/constants";
import type { Game, Attendance } from "@/lib/types";
import { Suspense } from "react";

function GameDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const [game, setGame] = useState<Game | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatusValue | null>(null);
  const [reason, setReason] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const [gameData, attData] = await Promise.all([
        fetchGameById(id),
        fetchAttendancesByGame(id),
      ]);
      setGame(gameData);
      setAttendances(attData);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleFinalSubmit = async () => {
    if (!playerName.trim()) { alert("選手のお名前を入力してください"); return; }
    if (!selectedStatus) { alert("出欠（○・×・△）のいずれかを選択してください"); return; }
    setSubmitting(true);
    const result = await upsertAttendance({ gameId: id, playerName: playerName.trim(), status: selectedStatus, reason: selectedStatus === "absent" ? reason : undefined });
    setSubmitting(false);
    if (result) {
      const fresh = await fetchAttendancesByGame(id);
      setAttendances(fresh);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      setPlayerName(""); setSelectedStatus(null); setReason("");
    } else { alert("送信に失敗しました。もう一度お試しください。"); }
  };

  const handleCopyInfo = useCallback(() => {
    if (!game) return;
    const dateStart = new Date(game.dateStart);
    const text = [`📅 ${game.title}`, `日時: ${format(dateStart, "M月d日（E） HH:mm", { locale: ja })}`, game.meetingTime ? `集合: ${game.meetingTime}${game.meetingPlace ? ` @ ${game.meetingPlace}` : ""}` : "", `会場: ${game.venueName}`, game.venueAddress ? `住所: ${game.venueAddress}` : "", game.items ? `持ち物: ${game.items}` : ""].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => { setShowCopied(true); setTimeout(() => setShowCopied(false), 2000); });
  }, [game]);

  if (loading) {
    return (<div className="flex items-center justify-center h-[60vh]"><div className="text-center space-y-3"><Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" /><p className="text-sm text-muted font-bold">読み込み中...</p></div></div>);
  }
  if (!game) {
    return (<div className="px-4 py-12 text-center"><h1 className="text-base font-bold mb-2">試合が見つかりません</h1><Link href="/calendar" className="text-primary font-bold text-sm">カレンダーに戻る</Link></div>);
  }

  const dateStart = new Date(game.dateStart);
  const isPast = dateStart < new Date();
  const daysUntil = differenceInDays(dateStart, new Date());
  const attendCnt = attendances.filter((a) => a.status === "attend").length;
  const absentCnt = attendances.filter((a) => a.status === "absent").length;
  // localStorage から登録人数を取得し、試合の対象学年の人数だけで未回答を計算
  const savedCounts = typeof window !== "undefined" ? localStorage.getItem("sk_player_counts") : null;
  const gradeCounts = savedCounts ? JSON.parse(savedCounts) as Record<string, number> : {};
  const totalPlayers = game.grades.reduce((sum, g) => sum + (gradeCounts[String(g)] ?? 0), 0);
  const noAnswerCnt = Math.max(0, totalPlayers - attendCnt - absentCnt);

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      <Link href="/calendar" className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2"><ArrowLeft className="w-4 h-4" />カレンダーに戻る</Link>

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
        <button className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border bg-surface text-[13px] font-bold text-muted active:bg-surface-variant transition-all shadow-sm touch-active"><Share2 className="w-4 h-4" />共有</button>
      </div>

      <div className="bg-surface rounded-2xl border border-border divide-y divide-border/50 shadow-sm overflow-hidden">
        <InfoRow icon={<Calendar className="w-4.5 h-4.5 text-primary" />} label="日時" value={<div><p className="font-bold text-[14px]">{format(dateStart, "M月d日（E）", { locale: ja })}</p><p className="text-[12px] text-muted mt-0.5">{format(dateStart, "HH:mm")}{game.dateEnd && ` 〜 ${format(new Date(game.dateEnd), "HH:mm")}`}</p></div>} />
        {game.meetingTime && (<InfoRow icon={<Clock className="w-4.5 h-4.5 text-warning" />} label="集合" value={<div><p className="font-bold text-[14px]">{game.meetingTime}</p>{game.meetingPlace && <p className="text-[12px] text-muted mt-0.5">{game.meetingPlace}</p>}</div>} />)}
        <InfoRow icon={<MapPin className="w-4.5 h-4.5 text-error" />} label="会場" value={<div><p className="font-bold text-[14px]">{game.venueName}</p>{game.venueAddress && <p className="text-[12px] text-muted mt-0.5 leading-relaxed">{game.venueAddress}</p>}{game.venueUrl && <a href={game.venueUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-primary font-bold mt-1.5"><ExternalLink className="w-3.5 h-3.5" />Google Maps</a>}</div>} />
        {game.items && (<InfoRow icon={<Package className="w-4.5 h-4.5 text-info" />} label="持ち物" value={<p className="text-[13px] leading-relaxed">{game.items}</p>} />)}
        {game.notes && (<InfoRow icon={<FileText className="w-4.5 h-4.5 text-muted" />} label="備考" value={<p className="text-[13px] leading-relaxed whitespace-pre-wrap">{game.notes}</p>} />)}
      </div>

      {!isPast && (
        <div className="bg-surface rounded-2xl border-2 border-primary/20 p-4 space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-light" />
          {submitSuccess && (<div className="bg-attend/10 border border-attend/20 rounded-xl p-3 text-center animate-fade-in-up"><p className="text-attend font-bold text-[13px]">✅ 出欠を保存しました！</p></div>)}
          <div className="text-center mb-2"><h2 className="font-black text-[15px] mb-1">出欠を送信</h2><p className="text-[11px] text-muted">{game.rsvpDeadline ? `締切: ${format(new Date(game.rsvpDeadline), "M月d日（E）", { locale: ja })}まで` : "いつでも回答・変更できます"}</p></div>
          <div className="space-y-3">
            <div><label className="text-[11px] font-bold text-muted ml-1 mb-1 block">選手のお名前（必須）</label><input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="例: 佐藤 太郎" className="w-full bg-background border border-border px-4 py-3 rounded-xl text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input" /></div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {([{ status: "attend" as AttendanceStatusValue, icon: "○", label: "参加", activeClass: "bg-attend text-white shadow-attend/30 border-attend" }, { status: "absent" as AttendanceStatusValue, icon: "×", label: "欠席", activeClass: "bg-absent text-white shadow-absent/30 border-absent" }]).map((config) => (<button key={config.status} type="button" onClick={() => setSelectedStatus(config.status)} className={cn("flex flex-col items-center justify-center py-4 px-2 rounded-xl border-2 font-bold transition-all shadow-sm active:scale-95 outline-none touch-active", selectedStatus === config.status ? cn(config.activeClass, "scale-[1.02] shadow-md") : "border-border bg-white text-muted hover:bg-surface-variant active:bg-border")}><span className="text-2xl font-black">{config.icon}</span><span className="text-[10px] mt-0.5">{config.label}</span></button>))}
              </div>
              {selectedStatus === "absent" && (<div className="bg-red-50/50 border border-red-100 rounded-xl p-3 animate-fade-in-up"><label className="text-[10px] font-bold text-absent flex items-center gap-1 mb-1">欠席理由（任意）</label><input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="例: 塾のため" className="w-full px-3 py-2.5 rounded-xl border border-red-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-absent/30 shadow-sm" /></div>)}
              <div className="pt-2"><button type="button" onClick={handleFinalSubmit} disabled={submitting} className={cn("w-full py-3.5 rounded-xl font-black text-[15px] shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 touch-active", submitting ? "bg-primary/50 text-white cursor-not-allowed" : "bg-primary text-white active:bg-primary-light active:scale-[0.98]")}>{submitting ? (<><Loader2 className="w-5 h-5 animate-spin" />送信中...</>) : (<><CheckCheck className="w-5 h-5" />この出欠を送信する</>)}</button></div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border p-4 space-y-3 shadow-sm">
        <h2 className="font-black text-[15px] flex items-center gap-1.5"><Users className="w-4.5 h-4.5 text-primary" />回答済み一覧</h2>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-attend/10 text-attend border border-attend/20 rounded-lg py-2 text-center"><span className="text-[10px] font-bold block mb-0.5">参加</span><span className="text-[16px] font-black">{attendCnt}</span></div>
          <div className="flex-1 bg-absent/10 text-absent border border-absent/20 rounded-lg py-2 text-center"><span className="text-[10px] font-bold block mb-0.5">欠席</span><span className="text-[16px] font-black">{absentCnt}</span></div>
          <div className="flex-1 bg-gray-100 text-muted border border-gray-200 rounded-lg py-2 text-center"><span className="text-[10px] font-bold block mb-0.5">未回答</span><span className="text-[16px] font-black">{noAnswerCnt}</span></div>
        </div>
        <div className="pt-2">
          <div className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
            {attendances.length > 0 ? attendances.map((att) => (<div key={att.id} className="flex items-center justify-between px-3 py-2.5 bg-white"><div className="flex items-center gap-2.5 min-w-0 flex-1"><p className="text-[13px] font-bold truncate flex-1">{att.userName}</p>{att.reason && <span className="text-[9px] text-error font-medium truncate max-w-[120px]">理由: {att.reason}</span>}</div><div className="shrink-0 ml-2"><AttendanceBadge status={att.status} /></div></div>)) : (<div className="p-4 text-center text-[12px] text-muted">まだ出欠の回答はありません</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (<div className="flex gap-3 px-3.5 py-3"><div className="mt-0.5 shrink-0">{icon}</div><div className="flex-1 min-w-0"><span className="text-[10px] font-bold text-muted block mb-0.5">{label}</span>{value}</div></div>);
}

export default function GameDetailPage() {
  return (<Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}><GameDetailContent /></Suspense>);
}
