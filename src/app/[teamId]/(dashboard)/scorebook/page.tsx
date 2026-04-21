"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Loader2, ClipboardList, Trophy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/components/team/team-provider";
import { useTeamLink } from "@/hooks/use-team-link";
import { fetchGames, fetchAttendancesByGame } from "@/lib/supabase-data";
import { fetchScorebookByGameId, fetchScorebookGames, createScorebookGame } from "@/lib/scorebook-data";
import type { Game } from "@/lib/types";
import type { ScorebookGame } from "@/lib/scorebook-types";

export default function ScorebookPage() {
  const router = useRouter();
  const { teamSlug } = useTeam();
  const teamLink = useTeamLink();
  const [games, setGames] = useState<Game[]>([]);
  const [scorebooks, setScorebooks] = useState<ScorebookGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [gameList, sbList] = await Promise.all([
        fetchGames(teamSlug),
        fetchScorebookGames(teamSlug),
      ]);
      const matchGames = gameList.filter(
        (g) => g.type === "official" || g.type === "practice"
      );
      setGames(matchGames);
      setScorebooks(sbList);
      setLoading(false);
    }
    load();
  }, [teamSlug]);

  const handleStartScorebook = async (game: Game) => {
    setCreating(game.id);

    const existing = await fetchScorebookByGameId(game.id);
    if (existing) {
      if (existing.status === "lineup" || existing.status === "setup") {
        router.push(teamLink(`/scorebook/setup?id=${existing.id}`));
      } else {
        router.push(teamLink(`/scorebook/live?id=${existing.id}`));
      }
      return;
    }

    const attendances = await fetchAttendancesByGame(game.id);
    const attendCount = attendances.filter((a) => a.status === "attend").length;
    if (attendCount === 0) {
      alert("出席者がいません。先に出欠を登録してください。");
      setCreating(null);
      return;
    }

    const sb = await createScorebookGame(
      teamSlug,
      game.id,
      game.opponent ?? "相手チーム",
      true
    );
    if (sb) {
      router.push(teamLink(`/scorebook/setup?id=${sb.id}`));
    } else {
      alert("スコアブックの作成に失敗しました");
      setCreating(null);
    }
  };

  const getScorebook = (gameId: string) =>
    scorebooks.find((sb) => sb.gameId === gameId);

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
      <Link
        href={teamLink("/dashboard")}
        className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2"
      >
        <ArrowLeft className="w-4 h-4" />
        ホームに戻る
      </Link>

      <div className="bg-gradient-hero rounded-2xl p-4 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5" />
          <h1 className="text-lg font-black">スコアブック</h1>
        </div>
        <p className="text-[12px] text-primary-100">
          試合を選んでスコアを記録しましょう
        </p>
      </div>

      {scorebooks.filter((sb) => sb.status !== "completed").length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[13px] font-black text-primary flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            記録中の試合
          </h2>
          {scorebooks
            .filter((sb) => sb.status !== "completed")
            .map((sb) => {
              const game = games.find((g) => g.id === sb.gameId);
              return (
                <button
                  key={sb.id}
                  onClick={() =>
                    router.push(
                      teamLink(
                        sb.status === "lineup" || sb.status === "setup"
                          ? `/scorebook/setup?id=${sb.id}`
                          : `/scorebook/live?id=${sb.id}`
                      )
                    )
                  }
                  className="w-full bg-primary-50 border-2 border-primary/20 rounded-xl p-3 text-left active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-black text-primary">
                        vs {sb.opponent}
                      </p>
                      {game && (
                        <p className="text-[11px] text-primary-light mt-0.5">
                          {format(new Date(game.dateStart), "M/d（E）", {
                            locale: ja,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {sb.status === "live" && (
                        <span className="text-[15px] font-black text-primary">
                          {sb.totalScoreUs} - {sb.totalScoreThem}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-primary-light" />
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      )}

      {scorebooks.filter((sb) => sb.status === "completed").length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[13px] font-black text-muted flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            完了した試合
          </h2>
          {scorebooks
            .filter((sb) => sb.status === "completed")
            .map((sb) => {
              const game = games.find((g) => g.id === sb.gameId);
              const won = sb.totalScoreUs > sb.totalScoreThem;
              const lost = sb.totalScoreUs < sb.totalScoreThem;
              return (
                <button
                  key={sb.id}
                  onClick={() =>
                    router.push(teamLink(`/scorebook/live?id=${sb.id}`))
                  }
                  className="w-full bg-surface border border-border rounded-xl p-3 text-left active:scale-[0.98] transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-bold">vs {sb.opponent}</p>
                      {game && (
                        <p className="text-[11px] text-muted mt-0.5">
                          {format(new Date(game.dateStart), "M/d（E）", {
                            locale: ja,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[15px] font-black",
                          won && "text-primary",
                          lost && "text-error",
                          !won && !lost && "text-muted"
                        )}
                      >
                        {sb.totalScoreUs} - {sb.totalScoreThem}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-black px-1.5 py-0.5 rounded",
                          won && "bg-primary-50 text-primary",
                          lost && "bg-error/10 text-error",
                          !won && !lost && "bg-gray-100 text-muted"
                        )}
                      >
                        {won ? "勝" : lost ? "負" : "引"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-[13px] font-black text-muted">
          試合を選んでスコア記録を開始
        </h2>
        {games.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-[13px] text-muted">試合が登録されていません</p>
          </div>
        ) : (
          games.map((game) => {
            const sb = getScorebook(game.id);
            const hasScorebook = !!sb;
            return (
              <button
                key={game.id}
                onClick={() => handleStartScorebook(game)}
                disabled={creating === game.id}
                className={cn(
                  "w-full bg-surface border border-border rounded-xl p-3 text-left transition-all shadow-sm",
                  creating === game.id
                    ? "opacity-50"
                    : "active:scale-[0.98]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded",
                          game.type === "official"
                            ? "badge-official"
                            : "badge-practice"
                        )}
                      >
                        {game.type === "official" ? "公式戦" : "練習試合"}
                      </span>
                      {hasScorebook && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary-50 text-primary border border-primary/20">
                          記録済み
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-bold truncate">
                      {game.title}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {format(new Date(game.dateStart), "M/d（E） HH:mm", {
                        locale: ja,
                      })}
                      {game.opponent && ` vs ${game.opponent}`}
                    </p>
                  </div>
                  <div className="shrink-0 ml-2">
                    {creating === game.id ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
