"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  CalendarDays,
  TrendingUp,
  Megaphone,
  ChevronRight,
  Trophy,
  MapPin,
  Clock,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAM_NAME } from "@/lib/constants";
import { fetchThisWeekGames, fetchAnnouncements, fetchAttendanceSummary } from "@/lib/supabase-data";
import { GameTypeBadge, GradeBadge, AttendanceSummaryBar } from "@/components/common/badges";
import type { Game, Announcement, AttendanceSummary } from "@/lib/types";

/** 管理者ダッシュボード — Supabase接続版 */
export default function DashboardPage() {
  const [thisWeekGames, setThisWeekGames] = useState<Game[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [summaries, setSummaries] = useState<Record<string, AttendanceSummary>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [games, anns] = await Promise.all([
          fetchThisWeekGames(),
          fetchAnnouncements(),
        ]);
        setThisWeekGames(games);
        setAnnouncements(anns);

        // 各試合の出欠サマリーを取得
        const sums: Record<string, AttendanceSummary> = {};
        await Promise.all(
          games.map(async (g) => {
            sums[g.id] = await fetchAttendanceSummary(g.id, g.grades);
          })
        );
        setSummaries(sums);
      } catch (err) {
        console.error("データの読み込みに失敗しました:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const gradeStats = [
    { grade: "中3", rate: 92, color: "bg-purple-500" },
    { grade: "中2", rate: 85, color: "bg-emerald-500" },
    { grade: "中1", rate: 78, color: "bg-blue-500" },
  ];

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

  return (
    <div className="px-4 py-4 space-y-4">
      {/* ウェルカムバナー */}
      <section className="bg-gradient-hero rounded-2xl p-4 text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
          <Trophy className="w-full h-full" />
        </div>
        <div className="relative z-10">
          <p className="text-primary-100 text-[11px] font-medium mb-0.5">
            {format(new Date(), "M月d日（E）", { locale: ja })}
          </p>
          <h1 className="text-lg font-black mb-0.5">
            おはようございます 👋
          </h1>
          <p className="text-xs text-primary-100">
            {TEAM_NAME}の今週の予定をチェック
          </p>
        </div>
      </section>

      {/* クイックアクション（横スクロール） */}
      <section className="flex gap-2 overflow-x-auto -mx-4 px-4 no-scrollbar animate-fade-in-up animate-fade-in-up-delay-1">
        <Link
          href="/calendar"
          className="flex-shrink-0 flex items-center gap-2 bg-surface rounded-xl border border-border px-3.5 py-2.5 active:scale-95 transition-transform"
        >
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold whitespace-nowrap">スケジュール</span>
        </Link>
        <Link
          href="/announcements"
          className="flex-shrink-0 flex items-center gap-2 bg-surface rounded-xl border border-border px-3.5 py-2.5 active:scale-95 transition-transform"
        >
          <Megaphone className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold whitespace-nowrap">お知らせ</span>
        </Link>
      </section>

      {/* 今週の試合 */}
      <section className="animate-fade-in-up animate-fade-in-up-delay-2">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="flex items-center gap-1.5 font-black text-[15px]">
            <CalendarDays className="w-4.5 h-4.5 text-primary" />
            今週の試合
          </h2>
          <Link
            href="/calendar"
            className="flex items-center gap-0.5 text-[11px] text-primary font-bold active:opacity-60"
          >
            すべて見る
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {thisWeekGames.length > 0 ? (
          <div className="space-y-2.5">
            {thisWeekGames.map((game) => {
              const summary = summaries[game.id] ?? { attend: 0, absent: 0, undecided: 0, noAnswer: 0, total: 0 };
              const dateStart = new Date(game.dateStart);
              return (
                <Link
                  key={game.id}
                  href={`/games/detail?id=${game.id}`}
                  className="block bg-surface rounded-2xl border border-border p-3.5 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start gap-2.5 mb-2.5">
                    {/* 日付ブロック */}
                    <div className="w-11 h-[52px] rounded-xl bg-gradient-hero text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-medium leading-tight">
                        {format(dateStart, "M月", { locale: ja })}
                      </span>
                      <span className="text-lg font-black leading-tight">
                        {format(dateStart, "d")}
                      </span>
                      <span className="text-[9px] font-medium leading-tight">
                        {format(dateStart, "E", { locale: ja })}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                        <GameTypeBadge type={game.type} />
                        {game.grades.map((g) => (
                          <GradeBadge key={g} grade={g} />
                        ))}
                      </div>
                      <h3 className="font-bold text-[13px] truncate">{game.title}</h3>
                      <div className="flex flex-wrap gap-x-2.5 gap-y-0 text-[10px] text-muted mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {game.venueName}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {format(dateStart, "HH:mm")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-2" />
                  </div>
                  <AttendanceSummaryBar {...summary} />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border p-6 text-center">
            <CalendarDays className="w-8 h-8 text-muted mx-auto mb-1.5" />
            <p className="text-xs text-muted">今週の試合はありません</p>
          </div>
        )}
      </section>


      {/* 最新のお知らせ */}
      <section className="animate-fade-in-up animate-fade-in-up-delay-3">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="flex items-center gap-1.5 font-black text-[15px]">
            <Megaphone className="w-4.5 h-4.5 text-primary" />
            最新のお知らせ
          </h2>
          <Link
            href="/announcements"
            className="flex items-center gap-0.5 text-[11px] text-primary font-bold active:opacity-60"
          >
            すべて見る
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {announcements.length > 0 ? (
          <div className="space-y-1.5">
            {announcements.slice(0, 3).map((ann) => (
              <Link
                key={ann.id}
                href={`/announcements/detail?id=${ann.id}`}
                className="flex items-center gap-2.5 bg-surface rounded-xl border border-border p-3 active:scale-[0.98] transition-transform"
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  ann.isPinned ? "bg-error" : "bg-primary"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {ann.isPinned && (
                      <span className="text-[9px] font-bold text-error bg-red-50 px-1 py-0.5 rounded">
                        📌 固定
                      </span>
                    )}
                    <h3 className="font-bold text-[13px] truncate">{ann.title}</h3>
                  </div>
                  <p className="text-[10px] text-muted mt-0.5">
                    {format(new Date(ann.createdAt), "M/d", { locale: ja })} · {ann.createdByName}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border p-6 text-center">
            <Megaphone className="w-8 h-8 text-muted mx-auto mb-1.5" />
            <p className="text-xs text-muted">お知らせはまだありません</p>
          </div>
        )}
      </section>
    </div>
  );
}
