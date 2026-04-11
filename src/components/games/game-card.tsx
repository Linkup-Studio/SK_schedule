"use client";

import Link from "next/link";
import { format, isToday, isTomorrow, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import { MapPin, Clock, Users, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameTypeBadge, GradeBadge, AttendanceSummaryBar } from "@/components/common/badges";
import type { Game, AttendanceSummary } from "@/lib/types";

function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "今日";
  if (isTomorrow(date)) return "明日";
  const diff = differenceInDays(date, new Date());
  if (diff > 0 && diff <= 7) return `${diff}日後`;
  return "";
}

/** 試合カードコンポーネント — モバイル最適化 */
export function GameCard({ game, index = 0, attendanceSummary }: { game: Game; index?: number; attendanceSummary?: AttendanceSummary }) {
  const summary = attendanceSummary ?? { attend: 0, absent: 0, undecided: 0, noAnswer: 0, total: 0 };
  const dateStart = new Date(game.dateStart);
  const relative = getRelativeDate(game.dateStart);
  const isPast = dateStart < new Date();
  const isUrgent = !isPast && differenceInDays(dateStart, new Date()) <= 2;

  return (
    <Link
      href={`/games/${game.id}`}
      className={cn(
        "block bg-surface rounded-2xl border border-border p-3.5 shadow-sm touch-active",
        "animate-fade-in-up focus:ring-2 focus:ring-primary/20 outline-none",
        isPast && "opacity-60"
      )}
      style={{ animationDelay: `${(index % 4) * 0.08}s` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* 日付ブロック */}
          <div className={cn(
            "w-11 h-[52px] rounded-xl flex flex-col items-center justify-center text-center shrink-0",
            isUrgent ? "bg-gradient-hero text-white shadow-sm" : "bg-primary-50 text-primary"
          )}>
            <span className="text-[9px] font-medium leading-none">
              {format(dateStart, "M月", { locale: ja })}
            </span>
            <span className="text-lg font-black leading-tight my-0.5">
              {format(dateStart, "d")}
            </span>
            <span className="text-[9px] font-medium leading-none">
              {format(dateStart, "E", { locale: ja })}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <GameTypeBadge type={game.type} />
              {game.grades.map((g) => (
                <GradeBadge key={g} grade={g} />
              ))}
              {relative && (
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-md ml-auto shrink-0",
                  isUrgent ? "bg-error/10 text-error" : "bg-primary-50 text-primary"
                )}>
                  {relative}
                </span>
              )}
            </div>
            <h3 className="font-bold text-[14px] text-foreground truncate pr-1">{game.title}</h3>
            {game.opponent && (
              <p className="text-[11px] text-muted truncate pr-1">vs {game.opponent}</p>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-3" />
      </div>

      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-muted mb-2">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-[120px]">{game.venueName}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" />
          {format(dateStart, "HH:mm")}
          {game.meetingTime && ` (集合 ${game.meetingTime})`}
        </span>
      </div>

      {!isPast && (
        <div className="pt-2.5 border-t border-border/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              出欠
            </span>
            {summary.noAnswer > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-warning font-bold bg-warning/10 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-2.5 h-2.5" />
                未回答 {summary.noAnswer}
              </span>
            )}
          </div>
          <AttendanceSummaryBar {...summary} />
        </div>
      )}
    </Link>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-2.5 shadow-sm">
      <div className="flex items-start gap-2.5">
        <div className="skeleton w-11 h-[52px] rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="skeleton h-3.5 w-20 rounded" />
          <div className="skeleton h-4 w-[70%] rounded" />
          <div className="skeleton h-3 w-[40%] rounded" />
        </div>
      </div>
      <div className="skeleton h-2 w-full rounded-full" />
    </div>
  );
}
