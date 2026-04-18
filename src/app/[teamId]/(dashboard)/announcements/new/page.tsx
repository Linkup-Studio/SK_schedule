"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Megaphone, Users, FileText, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES } from "@/lib/constants";
import type { GradeValue } from "@/lib/constants";
import { useTeam } from "@/components/team/team-provider";
import { useTeamLink } from "@/hooks/use-team-link";
import { createAnnouncement } from "@/lib/supabase-data";

export default function NewAnnouncementPage() {
  const router = useRouter();
  const { teamSlug } = useTeam();
  const teamLink = useTeamLink();
  const [selectedGrades, setSelectedGrades] = useState<GradeValue[]>([1, 2, 3]);
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const toggleGrade = (grade: GradeValue) => {
    setSelectedGrades((prev) => prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]);
  };
  const selectAll = () => { setSelectedGrades([1, 2, 3]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { alert("タイトルと本文を入力してください"); return; }
    if (selectedGrades.length === 0) { alert("対象学年を1つ以上選択してください"); return; }

    setIsSaving(true);
    const newAnnouncement = await createAnnouncement(teamSlug, {
      title: title.trim(), body: body.trim(), targetGrades: selectedGrades, isPinned,
    });
    setIsSaving(false);

    if (newAnnouncement) {
      router.push(teamLink("/announcements"));
    } else {
      alert("投稿に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <Link href={teamLink("/announcements")} className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2">
        <ArrowLeft className="w-4 h-4" />お知らせ一覧に戻る
      </Link>
      <h1 className="font-black text-lg flex items-center gap-1.5"><Megaphone className="w-5 h-5 text-primary" />お知らせを投稿</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-4 shadow-sm animate-fade-in-up">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted pl-0.5"><FileText className="w-4 h-4 text-primary" />タイトル <span className="text-error">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: GW合宿のお知らせ" className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input" />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted pl-0.5"><FileText className="w-4 h-4 text-primary" />本文 <span className="text-error">*</span></label>
            <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="お知らせの内容を入力してください..." className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none shadow-input leading-relaxed" />
            <p className="text-[10px] font-bold text-muted text-right">現在 {body.length} 文字</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-4 shadow-sm animate-fade-in-up animate-fade-in-up-delay-1">
          <div className="space-y-2.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted pl-0.5"><Users className="w-4 h-4 text-primary" />対象学年 <span className="text-error">*</span></label>
            <div className="flex gap-2">
              <button type="button" onClick={selectAll} className={cn("px-3 py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all active:scale-95 touch-active outline-none", selectedGrades.length === 3 ? "bg-primary text-white border-primary shadow-sm" : "border-border text-muted bg-surface active:bg-surface-variant")}>全学年</button>
              {GRADES.map((g) => (
                <button key={g.value} type="button" onClick={() => toggleGrade(g.value)} className={cn("flex-1 px-2 py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all active:scale-95 touch-active outline-none", selectedGrades.includes(g.value) ? "bg-primary text-white border-primary shadow-sm" : "border-border text-muted bg-surface active:bg-surface-variant")}>{g.label}</button>
              ))}
            </div>
          </div>
          <div className="h-px bg-border/50 -mx-3.5" />
          <button type="button" onClick={() => setIsPinned(!isPinned)} className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-all active:scale-[0.98] touch-active outline-none", isPinned ? "border-error bg-red-50 text-error shadow-sm" : "border-border text-muted bg-surface active:bg-surface-variant")}>
            <Pin className={cn("w-5 h-5 shrink-0", isPinned && "fill-current")} />
            <div className="text-left font-sans"><p className="text-[13px] font-bold leading-tight mb-0.5">ピン留めする</p><p className="text-[10px] font-medium opacity-80 leading-tight">未読見逃しを防ぐため、一覧の最上部に固定表示されます</p></div>
          </button>
        </div>

        {(title || body) && (
          <div className="bg-surface-variant/30 rounded-2xl border border-border p-3.5 space-y-2 animate-fade-in-up">
            <h3 className="text-[11px] font-bold text-muted mb-1 pl-0.5 flex items-center gap-1">📋 プレビュー</h3>
            <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
              {title && <h4 className="font-black text-[15px] mb-2 leading-tight">{title}</h4>}
              {body && <p className="text-[13px] text-muted whitespace-pre-line leading-relaxed">{body}</p>}
            </div>
          </div>
        )}

        <div className="pt-2">
          <button type="submit" disabled={isSaving || !title.trim() || !body.trim()} className={cn("w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[15px] transition-all outline-none", isSaving || !title.trim() || !body.trim() ? "bg-primary/30 text-white cursor-not-allowed" : "bg-primary text-white active:bg-primary-light shadow-lg active:scale-[0.98] touch-active")}>
            <Save className="w-5 h-5" />{isSaving ? "投稿中..." : "お知らせを投稿する"}
          </button>
        </div>
      </form>
    </div>
  );
}
