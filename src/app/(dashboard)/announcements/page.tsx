"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Megaphone, ChevronRight, Pin, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/lib/team-context";
import { fetchAnnouncements } from "@/lib/supabase-data";
import { GRADES } from "@/lib/constants";
import type { Announcement } from "@/lib/types";

/** お知らせ一覧ページ — Supabase接続版 */
export default function AnnouncementsPage() {
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id ?? "";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem("sk_admin") === "true");
    if (!teamId) return;
    async function load() {
      setLoading(true);
      const data = await fetchAnnouncements(teamId);
      setAnnouncements(data);
      setLoading(false);
    }
    load();
  }, [teamId]);

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

  const gradeColors: Record<number, string> = {
    1: "text-blue-700 bg-blue-50 border-blue-200",
    2: "text-emerald-700 bg-emerald-50 border-emerald-200",
    3: "text-purple-700 bg-purple-50 border-purple-200",
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-black text-lg flex items-center gap-1.5">
          <Megaphone className="w-5 h-5 text-primary" />
          お知らせ
        </h1>
        {isAdmin && (
          <Link
            href="/announcements/new"
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-[12px] font-bold rounded-lg active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            作成
          </Link>
        )}
      </div>

      {/* お知らせリスト */}
      {announcements.length > 0 ? (
        <div className="space-y-2.5">
          {announcements.map((ann, i) => {
            const isAllGrades = ann.targetGrades.length === 3;

            return (
              <Link
                key={ann.id}
                href={`/announcements/detail?id=${ann.id}`}
                className={cn(
                  "block bg-surface rounded-2xl border border-border p-3.5 shadow-sm touch-active focus:ring-2 focus:ring-primary/20 outline-none",
                  "animate-fade-in-up"
                )}
                style={{ animationDelay: `${(i % 5) * 0.08}s` }}
              >
                <div className="flex items-start gap-2.5">
                  {/* アイコン */}
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    ann.isPinned ? "bg-error/10 text-error" : "bg-primary-50 text-primary"
                  )}>
                    {ann.isPinned ? (
                      <Pin className="w-4.5 h-4.5" />
                    ) : (
                      <Megaphone className="w-4.5 h-4.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {ann.isPinned && (
                        <span className="text-[9px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded border border-error/20">
                          📌 固定
                        </span>
                      )}
                      {isAllGrades ? (
                        <span className="text-[11px] font-black text-slate-600 bg-gradient-to-r from-blue-50 via-emerald-50 to-purple-50 px-2 py-1 rounded-lg border-2 border-slate-200">
                          📨 宛先: 全学年
                        </span>
                      ) : (
                        ann.targetGrades.map(g => {
                          const gradeConfig = GRADES.find(gr => gr.value === g);
                          return (
                            <span key={g} className={cn("text-[11px] font-black px-2 py-1 rounded-lg border-2", gradeColors[g] || "text-primary bg-primary-50 border-primary/30")}>
                              📨 宛先: {gradeConfig?.label}
                            </span>
                          );
                        })
                      )}
                    </div>
                    <h3 className="font-bold text-[13px] truncate pr-1">{ann.title}</h3>
                    <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-relaxed">
                      {ann.body}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-muted mt-2">
                      <span className="font-bold">{format(new Date(ann.createdAt), "M月d日（E）", { locale: ja })}</span>
                      {ann.createdByName && <span>{ann.createdByName}</span>}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-2" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <Megaphone className="w-10 h-10 text-muted mx-auto mb-2" />
          <h3 className="font-bold text-sm mb-1">お知らせはまだありません</h3>
          <p className="text-[11px] text-muted">管理者がお知らせを投稿するとここに表示されます</p>
        </div>
      )}
    </div>
  );
}
