"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeamLink } from "@/hooks/use-team-link";
import { fetchAnnouncementById } from "@/lib/supabase-data";
import { GRADES } from "@/lib/constants";
import type { Announcement } from "@/lib/types";

function AnnouncementDetailContent() {
  const searchParams = useSearchParams();
  const teamLink = useTeamLink();
  const id = searchParams.get("id") ?? "";
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const data = await fetchAnnouncementById(id);
      setAnn(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (<div className="flex items-center justify-center h-[60vh]"><div className="text-center space-y-3"><Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" /><p className="text-sm text-muted font-bold">読み込み中...</p></div></div>);
  }

  if (!ann) {
    return (<div className="px-4 py-12 text-center"><h1 className="text-base font-bold mb-2">お知らせが見つかりません</h1><Link href={teamLink("/announcements")} className="text-primary font-bold text-[13px]">お知らせ一覧に戻る</Link></div>);
  }

  const isAllGrades = ann.targetGrades.length === 3;
  const gradeColors: Record<number, string> = {
    1: "text-blue-700 bg-blue-50 border-blue-200",
    2: "text-emerald-700 bg-emerald-50 border-emerald-200",
    3: "text-purple-700 bg-purple-50 border-purple-200",
  };
  const authorName = ann.createdByName ?? "管理者";

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      <Link href={teamLink("/announcements")} className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2"><ArrowLeft className="w-4 h-4" />お知らせ一覧に戻る</Link>

      <article className="bg-surface rounded-2xl border border-border overflow-hidden animate-fade-in-up shadow-sm">
        <div className="bg-gradient-subtle p-4 border-b border-border/50">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {ann.isPinned && (<span className="text-[9px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded-md border border-error/20">📌 固定</span>)}
            {isAllGrades ? (
              <span className="text-[11px] font-black text-slate-600 bg-gradient-to-r from-blue-50 via-emerald-50 to-purple-50 px-2 py-1 rounded-lg border-2 border-slate-200">📨 宛先: 全学年</span>
            ) : (
              ann.targetGrades.map(g => {
                const gradeConfig = GRADES.find(gr => gr.value === g);
                return (<span key={g} className={cn("text-[11px] font-black px-2 py-1 rounded-lg border-2", gradeColors[g] || "text-primary bg-primary-50 border-primary/30")}>📨 宛先: {gradeConfig?.label}</span>);
              })
            )}
          </div>
          <h1 className="text-base font-black leading-tight mb-2">{ann.title}</h1>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-muted bg-white/50 py-1.5 px-2 rounded-xl border border-white/60">
            <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0"><span className="text-[10px] font-bold text-primary">{authorName.charAt(0)}</span></div>
            <div className="flex flex-col min-w-0"><span className="font-bold text-foreground truncate">{authorName}</span><span>{format(new Date(ann.createdAt), "yyyy年M月d日（E） HH:mm", { locale: ja })}</span></div>
          </div>
        </div>
        <div className="p-4 sm:p-5"><div className="text-[14px] leading-loose whitespace-pre-wrap text-foreground">{ann.body}</div></div>
      </article>
    </div>
  );
}

export default function AnnouncementDetailPage() {
  return (<Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}><AnnouncementDetailContent /></Suspense>);
}
