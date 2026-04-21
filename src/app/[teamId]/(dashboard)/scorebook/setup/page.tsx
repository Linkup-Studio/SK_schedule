"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users, ChevronUp, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/components/team/team-provider";
import { useTeamLink } from "@/hooks/use-team-link";
import { fetchAttendancesByGame } from "@/lib/supabase-data";
import {
  fetchScorebookById,
  fetchLineup,
  saveLineup,
  updateScorebookGame,
} from "@/lib/scorebook-data";
import { POSITIONS } from "@/lib/scorebook-types";
import type { ScorebookGame } from "@/lib/scorebook-types";
import type { Attendance } from "@/lib/types";

interface LineupPlayer {
  name: string;
  battingOrder: number;
  position: number | null;
  selected: boolean;
}

function SetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { teamSlug } = useTeam();
  const teamLink = useTeamLink();
  const scorebookId = searchParams.get("id") ?? "";

  const [scorebook, setScorebook] = useState<ScorebookGame | null>(null);
  const [attendees, setAttendees] = useState<Attendance[]>([]);
  const [players, setPlayers] = useState<LineupPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!scorebookId) return;
    async function load() {
      const sb = await fetchScorebookById(scorebookId);
      if (!sb) {
        setLoading(false);
        return;
      }
      setScorebook(sb);

      const [atts, existingLineup] = await Promise.all([
        fetchAttendancesByGame(sb.gameId),
        fetchLineup(scorebookId),
      ]);

      const attending = atts.filter((a) => a.status === "attend");
      setAttendees(attending);

      if (existingLineup.length > 0) {
        const lineupNames = new Set(existingLineup.map((l) => l.playerName));
        const fromLineup: LineupPlayer[] = existingLineup.map((l) => ({
          name: l.playerName,
          battingOrder: l.battingOrder,
          position: l.position,
          selected: true,
        }));
        const remaining: LineupPlayer[] = attending
          .filter((a) => !lineupNames.has(a.userName ?? a.userId))
          .map((a, i) => ({
            name: a.userName ?? a.userId,
            battingOrder: fromLineup.length + i + 1,
            position: null,
            selected: false,
          }));
        setPlayers([...fromLineup, ...remaining]);
      } else {
        setPlayers(
          attending.map((a, i) => ({
            name: a.userName ?? a.userId,
            battingOrder: i + 1,
            position: null,
            selected: i < 9,
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, [scorebookId]);

  const togglePlayer = (idx: number) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], selected: !next[idx].selected };
      let order = 1;
      for (let i = 0; i < next.length; i++) {
        if (next[i].selected) {
          next[i] = { ...next[i], battingOrder: order++ };
        }
      }
      return next;
    });
  };

  const moveUp = (idx: number) => {
    const selected = players.filter((p) => p.selected);
    const selectedIdx = selected.findIndex((p) => p.name === players[idx].name);
    if (selectedIdx <= 0) return;

    setPlayers((prev) => {
      const next = [...prev];
      const currentOrder = next[idx].battingOrder;
      const prevPlayer = next.find(
        (p) => p.selected && p.battingOrder === currentOrder - 1
      );
      if (prevPlayer) {
        const prevIdx = next.indexOf(prevPlayer);
        next[prevIdx] = { ...next[prevIdx], battingOrder: currentOrder };
        next[idx] = { ...next[idx], battingOrder: currentOrder - 1 };
      }
      return next;
    });
  };

  const moveDown = (idx: number) => {
    const selectedCount = players.filter((p) => p.selected).length;
    const selectedPlayers = players.filter((p) => p.selected);
    const selectedIdx = selectedPlayers.findIndex(
      (p) => p.name === players[idx].name
    );
    if (selectedIdx >= selectedCount - 1) return;

    setPlayers((prev) => {
      const next = [...prev];
      const currentOrder = next[idx].battingOrder;
      const nextPlayer = next.find(
        (p) => p.selected && p.battingOrder === currentOrder + 1
      );
      if (nextPlayer) {
        const nextIdx = next.indexOf(nextPlayer);
        next[nextIdx] = { ...next[nextIdx], battingOrder: currentOrder };
        next[idx] = { ...next[idx], battingOrder: currentOrder + 1 };
      }
      return next;
    });
  };

  const setPosition = (idx: number, pos: number | null) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], position: pos };
      return next;
    });
  };

  const handleSave = async () => {
    const selected = players.filter((p) => p.selected);
    if (selected.length < 9) {
      alert("9人以上選択してください");
      return;
    }

    setSaving(true);
    const lineup = selected.map((p) => ({
      playerName: p.name,
      battingOrder: p.battingOrder,
      position: p.position,
    }));

    const ok = await saveLineup(scorebookId, lineup);
    if (ok) {
      await updateScorebookGame(scorebookId, { status: "live" });
      router.push(teamLink(`/scorebook/live?id=${scorebookId}`));
    } else {
      alert("保存に失敗しました");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!scorebook) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-[13px] text-muted">スコアブックが見つかりません</p>
      </div>
    );
  }

  const selectedPlayers = players
    .filter((p) => p.selected)
    .sort((a, b) => a.battingOrder - b.battingOrder);
  const benchPlayers = players.filter((p) => !p.selected);

  return (
    <div className="px-4 py-4 space-y-4 pb-28">
      <Link
        href={teamLink("/scorebook")}
        className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2"
      >
        <ArrowLeft className="w-4 h-4" />
        試合一覧に戻る
      </Link>

      <div className="bg-gradient-hero rounded-2xl p-4 text-white shadow-sm">
        <h1 className="text-lg font-black mb-1">打順・守備位置</h1>
        <p className="text-[12px] text-primary-100">
          vs {scorebook.opponent} ・ 出席者: {attendees.length}人
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-[13px] font-black text-primary flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          スタメン（{selectedPlayers.length}人）
        </h2>

        {selectedPlayers.map((player) => {
          const idx = players.indexOf(player);
          return (
            <div
              key={player.name}
              className="bg-surface border border-border rounded-xl p-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-[13px] font-black shrink-0">
                  {player.battingOrder}
                </span>
                <span className="text-[14px] font-bold flex-1 truncate">
                  {player.name}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveUp(idx)}
                    className="w-7 h-7 rounded-lg bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <ChevronUp className="w-4 h-4 text-muted" />
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    className="w-7 h-7 rounded-lg bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <ChevronDown className="w-4 h-4 text-muted" />
                  </button>
                  <button
                    onClick={() => togglePlayer(idx)}
                    className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center active:scale-90 transition-transform text-[11px] font-bold text-error"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(POSITIONS).map(([num, pos]) => (
                  <button
                    key={num}
                    onClick={() =>
                      setPosition(
                        idx,
                        player.position === Number(num) ? null : Number(num)
                      )
                    }
                    className={cn(
                      "px-2 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95",
                      player.position === Number(num)
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-border text-muted"
                    )}
                  >
                    {pos.short}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {benchPlayers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[13px] font-black text-muted">
            控え（{benchPlayers.length}人）
          </h2>
          {benchPlayers.map((player) => {
            const idx = players.indexOf(player);
            return (
              <button
                key={player.name}
                onClick={() => togglePlayer(idx)}
                className="w-full bg-surface border border-dashed border-border rounded-xl p-3 text-left active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted">{player.name}</span>
                  <span className="text-[11px] text-primary font-bold">
                    + 追加
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-[72px] left-0 right-0 z-[60] p-4 bg-white/95 backdrop-blur-md border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving || selectedPlayers.length < 9}
          className={cn(
            "w-full py-3.5 rounded-xl font-black text-[15px] shadow-lg transition-all flex items-center justify-center gap-2",
            saving || selectedPlayers.length < 9
              ? "bg-gray-300 text-gray-500"
              : "bg-primary text-white shadow-primary/30 active:scale-[0.98]"
          )}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              この打順で試合開始（{selectedPlayers.length}人）
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <SetupContent />
    </Suspense>
  );
}
