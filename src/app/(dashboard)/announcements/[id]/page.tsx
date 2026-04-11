"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Loader2 } from "lucide-react";
import { fetchAnnouncementById } from "@/lib/supabase-data";
import { GRADES } from "@/lib/constants";
import type { Announcement } from "@/lib/types";

/** お知らせ詳細ページ — Supabase接続版 */
export default function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchAnnouncementById(id);
      setAnn(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted font-bold">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!ann) {
    return (
      <div className="px-4 py-12 text-center">
        <h1 className="text-base font-bold mb-2">お知らせが見つかりません</h1>
        <Link href="/announcements" className="text-primary font-bold text-[13px] hover:underline">
          お知らせ一覧に戻る
        </Link>
      </div>
    );
  }

  const gradeLabels = ann.targetGrades.length === 3
    ? "全学年"
    : ann.targetGrades.map(g => GRADES.find(gr => gr.value === g)?.label).join("・");

  const authorName = ann.createdByName ?? "管理者";

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      {/* 戻るボタン */}
      <Link
        href="/announcements"
        className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2"
      >
        <ArrowLeft className="w-4 h-4" />
        お知らせ一覧に戻る
      </Link>

      {/* メインコンテンツ */}
      <article className="bg-surface rounded-2xl border border-border overflow-hidden animate-fade-in-up shadow-sm">
        {/* ヘッダー */}
        <div className="bg-gradient-subtle p-4 border-b border-border/50">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {ann.isPinned && (
              <span className="text-[9px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded-md border border-error/20">
                📌 固定
              </span>
            )}
            <span className="text-[9px] font-medium text-muted bg-white px-1.5 py-0.5 rounded-md border border-border shadow-sm">
              宛先: {gradeLabels}
            </span>
          </div>
          <h1 className="text-base font-black leading-tight mb-2">{ann.title}</h1>
          
          {/* 投稿者・日時情報 */}
          <div className="flex items-center gap-2 mt-3 text-[11px] text-muted bg-white/50 py-1.5 px-2 rounded-xl border border-white/60">
            <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary">{authorName.charAt(0)}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-foreground truncate">{authorName}</span>
              <span>{format(new Date(ann.createdAt), "yyyy年M月d日（E） HH:mm", { locale: ja })}</span>
            </div>
          </div>
        </div>

        {/* 本文 */}
        <div className="p-4 sm:p-5">
          <div className="text-[14px] leading-loose whitespace-pre-wrap text-foreground">
            {ann.body}
          </div>
        </div>
      </article>

      {/* コメントセクション（将来実装） */}
      <div className="bg-surface rounded-2xl border border-border p-4 animate-fade-in-up animate-fade-in-up-delay-1 shadow-sm">
        <h2 className="font-black text-[13px] mb-2 flex items-center gap-1.5">
          💬 コメント
        </h2>
        <div className="bg-surface-variant/30 rounded-xl p-5 text-center border border-border/50">
          <p className="text-[12px] font-bold text-muted mb-0.5">コメントはまだありません</p>
          <p className="text-[10px] text-muted leading-relaxed">質問や連絡がある場合は<br/>ここに投稿できるようになります</p>
        </div>
      </div>
    </div>
  );
}
