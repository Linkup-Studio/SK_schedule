"use client";

import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, List, CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/components/team/team-provider";
import { fetchGames } from "@/lib/supabase-data";
import { GAME_TYPES } from "@/lib/constants";
import type { GradeValue } from "@/lib/constants";
import type { Game } from "@/lib/types";
import { GradeFilter } from "@/components/common/grade-filter";
import { GameCard } from "@/components/games/game-card";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const gameTypeDotClasses = {
  official: "bg-official",
  practice: "bg-practice",
  training: "bg-training",
  off: "bg-off",
  other: "bg-other",
} as const;

export default function CalendarPage() {
  const { teamSlug } = useTeam();
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [gradeFilter, setGradeFilter] = useState<GradeValue | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const games = await fetchGames(teamSlug);
      setAllGames(games);
      setLoading(false);
    }
    load();
  }, [teamSlug]);

  const filteredGames = gradeFilter
    ? allGames.filter((g) => g.grades.includes(gradeFilter))
    : allGames;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const gamesByDate = useMemo(() => {
    const map = new Map<string, Game[]>();
    filteredGames.forEach((game) => {
      const key = format(new Date(game.dateStart), "yyyy-MM-dd");
      const existing = map.get(key) || [];
      existing.push(game);
      map.set(key, existing);
    });
    return map;
  }, [filteredGames]);

  const selectedGames = selectedDate
    ? gamesByDate.get(format(selectedDate, "yyyy-MM-dd")) || []
    : [];

  const now = new Date();
  const upcomingGames = filteredGames
    .filter((g) => new Date(g.dateStart) >= now)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

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
    <div className="px-4 py-4 space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="font-black text-lg flex items-center gap-1.5">
          <CalendarDays className="w-5 h-5 text-primary" />
          予定
        </h1>
        <div className="flex items-center bg-surface-variant rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "p-1.5 rounded-md transition-all active:scale-95",
              viewMode === "calendar" ? "bg-primary text-white shadow-sm" : "text-muted"
            )}
          >
            <CalendarDays className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-md transition-all active:scale-95",
              viewMode === "list" ? "bg-primary text-white shadow-sm" : "text-muted"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar py-0.5">
        <GradeFilter value={gradeFilter} onChange={setGradeFilter} />
      </div>

      {viewMode === "calendar" ? (
        <>
          <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 -ml-2 rounded-full active:bg-surface-variant transition-colors">
                <ChevronLeft className="w-5 h-5 text-muted" />
              </button>
              <h2 className="font-black text-sm">{format(currentMonth, "yyyy年 M月", { locale: ja })}</h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 -mr-2 rounded-full active:bg-surface-variant transition-colors">
                <ChevronRight className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((day, i) => (
                <div key={day} className={cn("py-1.5 text-center text-[10px] font-bold bg-surface-variant/30", i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted")}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayGames = gamesByDate.get(dayKey) || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const dayOfWeek = getDay(day);

                return (
                  <button key={dayKey} onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={cn("relative min-h-[48px] p-1 border-b border-r border-border/30 transition-colors touch-active",
                      !isCurrentMonth && "opacity-30 bg-surface-variant/10",
                      isSelected && "bg-primary-50 ring-1 ring-inset ring-primary/20",
                      isToday(day) && "bg-primary-50/50",
                      "active:bg-surface-variant"
                    )}>
                    <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold mx-auto",
                      isToday(day) && "bg-primary text-white shadow-sm",
                      !isToday(day) && dayOfWeek === 0 && "text-red-500",
                      !isToday(day) && dayOfWeek === 6 && "text-blue-500",
                      !isToday(day) && dayOfWeek !== 0 && dayOfWeek !== 6 && "text-foreground"
                    )}>{format(day, "d")}</span>
                    {dayGames.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-1 px-0.5">
                        {dayGames.map((g) => (
                          <span key={g.id} className={cn("w-1.5 h-1.5 rounded-full",
                            gameTypeDotClasses[g.type] ?? "bg-other"
                          )} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-[10px] text-muted">
            {GAME_TYPES.map((t) => (
              <div key={t.value} className="flex items-center gap-1 bg-surface py-0.5 px-2 rounded-full border border-border">
                <span className={cn("w-1.5 h-1.5 rounded-full", `bg-${t.color}`)} />
                {t.label}
              </div>
            ))}
          </div>

          {selectedDate && (
            <div className="space-y-2.5 animate-fade-in-up">
              <h3 className="font-bold text-xs text-muted flex items-center gap-1 before:content-[''] before:block before:w-1 before:h-3 before:bg-primary before:rounded-full">
                {format(selectedDate, "M月d日（E）", { locale: ja })}の予定
              </h3>
              {selectedGames.length > 0 ? (
                selectedGames.map((game, i) => (
                  <GameCard key={game.id} game={game} index={i} teamSlug={teamSlug} />
                ))
              ) : (
                <div className="bg-surface rounded-xl border border-border p-4 text-center">
                  <p className="text-[11px] text-muted">この日の予定はありません</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2.5">
          {upcomingGames.length > 0 ? (
            upcomingGames.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} teamSlug={teamSlug} />
            ))
          ) : (
            <div className="bg-surface rounded-2xl border border-border p-8 text-center">
              <CalendarDays className="w-10 h-10 text-muted mx-auto mb-2" />
              <h3 className="font-bold text-sm mb-1">予定はありません</h3>
              <p className="text-[11px] text-muted">新しい予定を追加しましょう</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
