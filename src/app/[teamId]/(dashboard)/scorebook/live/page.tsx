"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Plus, Minus, Check, RotateCcw, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/components/team/team-provider";
import { useTeamLink } from "@/hooks/use-team-link";
import {
  fetchScorebookById,
  fetchLineup,
  fetchAtBats,
  updateScorebookGame,
  addAtBat,
  deleteAtBat,
} from "@/lib/scorebook-data";
import { AT_BAT_RESULTS, POSITIONS } from "@/lib/scorebook-types";
import type { ScorebookGame, LineupEntry, AtBat, AtBatResult } from "@/lib/scorebook-types";

function LiveContent() {
  const searchParams = useSearchParams();
  const { teamSlug } = useTeam();
  const teamLink = useTeamLink();
  const scorebookId = searchParams.get("id") ?? "";

  const [scorebook, setScorebook] = useState<ScorebookGame | null>(null);
  const [lineup, setLineup] = useState<LineupEntry[]>([]);
  const [atBats, setAtBats] = useState<AtBat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAtBatModal, setShowAtBatModal] = useState(false);
  const [selectedBatter, setSelectedBatter] = useState<LineupEntry | null>(null);
  const [selectedInning, setSelectedInning] = useState(1);

  useEffect(() => {
    if (!scorebookId) return;
    async function load() {
      const [sb, lu, ab] = await Promise.all([
        fetchScorebookById(scorebookId),
        fetchLineup(scorebookId),
        fetchAtBats(scorebookId),
      ]);
      setScorebook(sb);
      setLineup(lu);
      setAtBats(ab);
      setLoading(false);
    }
    load();
  }, [scorebookId]);

  const updateScore = useCallback(
    async (inning: number, isUs: boolean, delta: number) => {
      if (!scorebook) return;
      setSaving(true);

      const scores = isUs
        ? [...scorebook.inningScoresUs]
        : [...scorebook.inningScoresThem];

      while (scores.length < inning) scores.push(0);
      scores[inning - 1] = Math.max(0, (scores[inning - 1] ?? 0) + delta);

      const total = scores.reduce((s, v) => s + v, 0);
      const updates = isUs
        ? { inningScoresUs: scores, totalScoreUs: total }
        : { inningScoresThem: scores, totalScoreThem: total };

      const updated = await updateScorebookGame(scorebookId, updates);
      if (updated) setScorebook(updated);
      setSaving(false);
    },
    [scorebook, scorebookId]
  );

  const handleEndGame = async () => {
    if (!confirm("試合を終了しますか？")) return;
    setSaving(true);
    const updated = await updateScorebookGame(scorebookId, {
      status: "completed",
    });
    if (updated) setScorebook(updated);
    setSaving(false);
  };

  const handleReopenGame = async () => {
    if (!confirm("試合を再開しますか？")) return;
    setSaving(true);
    const updated = await updateScorebookGame(scorebookId, {
      status: "live",
    });
    if (updated) setScorebook(updated);
    setSaving(false);
  };

  const handleAddAtBat = async (result: AtBatResult, rbi: number) => {
    if (!selectedBatter) return;
    setSaving(true);
    const ab = await addAtBat(
      scorebookId,
      selectedBatter.playerName,
      selectedInning,
      result,
      rbi
    );
    if (ab) setAtBats((prev) => [...prev, ab]);
    setShowAtBatModal(false);
    setSelectedBatter(null);
    setSaving(false);
  };

  const handleDeleteAtBat = async (id: string) => {
    if (!confirm("この打席結果を削除しますか？")) return;
    const ok = await deleteAtBat(id);
    if (ok) setAtBats((prev) => prev.filter((a) => a.id !== id));
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

  const innings = Array.from(
    { length: scorebook.totalInnings },
    (_, i) => i + 1
  );
  const isCompleted = scorebook.status === "completed";
  const won = scorebook.totalScoreUs > scorebook.totalScoreThem;
  const lost = scorebook.totalScoreUs < scorebook.totalScoreThem;

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      <Link
        href={teamLink("/scorebook")}
        className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2"
      >
        <ArrowLeft className="w-4 h-4" />
        試合一覧に戻る
      </Link>

      {/* ヘッダー */}
      <div
        className={cn(
          "rounded-2xl p-4 text-white shadow-sm",
          isCompleted
            ? won
              ? "bg-gradient-to-r from-attend to-green-600"
              : lost
                ? "bg-gradient-to-r from-red-500 to-rose-600"
                : "bg-gradient-to-r from-gray-500 to-gray-600"
            : "bg-gradient-hero"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] opacity-80 font-bold">
              {isCompleted ? "試合終了" : "試合中"}
            </p>
            <p className="text-[13px] font-bold mt-0.5">
              vs {scorebook.opponent}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black tracking-wider">
              {scorebook.totalScoreUs} - {scorebook.totalScoreThem}
            </div>
            {isCompleted && (
              <span className="text-[11px] font-bold opacity-90">
                {won ? "🎉 勝利" : lost ? "😤 惜敗" : "🤝 引き分け"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 得点板 */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-[10px] font-black text-muted py-2 px-2 text-left sticky left-0 bg-gray-50 z-10 min-w-[64px]">
                  チーム
                </th>
                {innings.map((inn) => (
                  <th
                    key={inn}
                    className="text-[10px] font-black text-muted py-2 px-1 min-w-[32px]"
                  >
                    {inn}
                  </th>
                ))}
                <th className="text-[10px] font-black text-primary py-2 px-2 min-w-[36px] border-l border-border">
                  計
                </th>
              </tr>
            </thead>
            <tbody>
              {/* 相手チーム */}
              <tr className="border-b border-border/50">
                <td className="text-[11px] font-bold py-2.5 px-2 text-left sticky left-0 bg-surface z-10">
                  {scorebook.isHome
                    ? scorebook.opponent
                    : scorebook.ourTeamName}
                </td>
                {innings.map((inn) => {
                  const scores = scorebook.isHome
                    ? scorebook.inningScoresThem
                    : scorebook.inningScoresUs;
                  const score = scores[inn - 1];
                  const isUs = !scorebook.isHome;
                  return (
                    <td key={inn} className="py-1 px-0.5">
                      {!isCompleted ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => updateScore(inn, isUs, 1)}
                            className="w-6 h-5 rounded bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Plus className="w-2.5 h-2.5 text-muted" />
                          </button>
                          <span className="text-[14px] font-black min-w-[20px]">
                            {score !== undefined ? score : "-"}
                          </span>
                          <button
                            onClick={() => updateScore(inn, isUs, -1)}
                            className="w-6 h-5 rounded bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Minus className="w-2.5 h-2.5 text-muted" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[14px] font-black">
                          {score !== undefined ? score : "-"}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="text-[16px] font-black py-2.5 px-2 border-l border-border text-primary">
                  {scorebook.isHome
                    ? scorebook.totalScoreThem
                    : scorebook.totalScoreUs}
                </td>
              </tr>
              {/* 自チーム */}
              <tr>
                <td className="text-[11px] font-bold py-2.5 px-2 text-left sticky left-0 bg-surface z-10">
                  {scorebook.isHome
                    ? scorebook.ourTeamName
                    : scorebook.opponent}
                </td>
                {innings.map((inn) => {
                  const scores = scorebook.isHome
                    ? scorebook.inningScoresUs
                    : scorebook.inningScoresThem;
                  const score = scores[inn - 1];
                  const isUs = scorebook.isHome;
                  return (
                    <td key={inn} className="py-1 px-0.5">
                      {!isCompleted ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => updateScore(inn, isUs, 1)}
                            className="w-6 h-5 rounded bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Plus className="w-2.5 h-2.5 text-muted" />
                          </button>
                          <span className="text-[14px] font-black min-w-[20px]">
                            {score !== undefined ? score : "-"}
                          </span>
                          <button
                            onClick={() => updateScore(inn, isUs, -1)}
                            className="w-6 h-5 rounded bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Minus className="w-2.5 h-2.5 text-muted" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[14px] font-black">
                          {score !== undefined ? score : "-"}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="text-[16px] font-black py-2.5 px-2 border-l border-border text-primary">
                  {scorebook.isHome
                    ? scorebook.totalScoreUs
                    : scorebook.totalScoreThem}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ラインナップ & 打席結果 */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border bg-gray-50">
          <h2 className="text-[13px] font-black">打順・成績</h2>
        </div>
        <div className="divide-y divide-border/50">
          {lineup.map((entry) => {
            const playerAtBats = atBats.filter(
              (ab) => ab.playerName === entry.playerName
            );
            const hits = playerAtBats.filter((ab) =>
              ["single", "double", "triple", "homerun"].includes(ab.result)
            ).length;
            const totalAB = playerAtBats.filter(
              (ab) => !["walk", "hit_by_pitch", "sacrifice"].includes(ab.result)
            ).length;

            return (
              <div key={entry.id} className="px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                    {entry.battingOrder}
                  </span>
                  {entry.position && (
                    <span className="text-[10px] font-bold text-muted bg-surface-variant px-1.5 py-0.5 rounded">
                      {POSITIONS[entry.position]?.short}
                    </span>
                  )}
                  <span className="text-[13px] font-bold flex-1 truncate">
                    {entry.playerName}
                  </span>
                  {totalAB > 0 && (
                    <span className="text-[10px] font-bold text-muted">
                      {hits}/{totalAB}
                    </span>
                  )}
                  {!isCompleted && (
                    <button
                      onClick={() => {
                        setSelectedBatter(entry);
                        setSelectedInning(scorebook.currentInning);
                        setShowAtBatModal(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-primary-50 border border-primary/20 text-primary text-[10px] font-bold active:scale-95 transition-transform"
                    >
                      + 打席
                    </button>
                  )}
                </div>
                {playerAtBats.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-7">
                    {playerAtBats.map((ab) => {
                      const info = AT_BAT_RESULTS[ab.result];
                      return (
                        <button
                          key={ab.id}
                          onClick={() => handleDeleteAtBat(ab.id)}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all active:scale-90",
                            info?.color ?? "text-gray-500",
                            "bg-white border-border"
                          )}
                          title="タップで削除"
                        >
                          {info?.short ?? ab.result}
                          {ab.rbi > 0 && (
                            <span className="text-error ml-0.5">
                              {ab.rbi}点
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 試合終了/再開ボタン */}
      {!isCompleted ? (
        <button
          onClick={handleEndGame}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-gray-800 text-white font-black text-[14px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          試合終了
        </button>
      ) : (
        <button
          onClick={handleReopenGame}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-surface border-2 border-border text-muted font-bold text-[13px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          試合を再開する
        </button>
      )}

      {/* 打席記録モーダル */}
      {showAtBatModal && selectedBatter && (
        <AtBatModal
          playerName={selectedBatter.playerName}
          inning={selectedInning}
          onSelectInning={setSelectedInning}
          totalInnings={scorebook.totalInnings}
          onSubmit={handleAddAtBat}
          onClose={() => {
            setShowAtBatModal(false);
            setSelectedBatter(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}

function AtBatModal({
  playerName,
  inning,
  onSelectInning,
  totalInnings,
  onSubmit,
  onClose,
  saving,
}: {
  playerName: string;
  inning: number;
  onSelectInning: (i: number) => void;
  totalInnings: number;
  onSubmit: (result: AtBatResult, rbi: number) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [rbi, setRbi] = useState(0);
  const innings = Array.from({ length: totalInnings }, (_, i) => i + 1);

  const hitResults: AtBatResult[] = [
    "single",
    "double",
    "triple",
    "homerun",
  ];
  const outResults: AtBatResult[] = [
    "strikeout",
    "groundout",
    "flyout",
    "fielders_choice",
  ];
  const otherResults: AtBatResult[] = [
    "walk",
    "hit_by_pitch",
    "sacrifice",
    "error",
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-4 pb-8 safe-bottom max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-[15px]">
            {playerName} の打席結果
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-muted active:scale-90 transition-transform"
          >
            ×
          </button>
        </div>

        <div className="mb-3">
          <p className="text-[11px] font-bold text-muted mb-1.5">イニング</p>
          <div className="flex flex-wrap gap-1.5">
            {innings.map((inn) => (
              <button
                key={inn}
                onClick={() => onSelectInning(inn)}
                className={cn(
                  "w-8 h-8 rounded-lg text-[12px] font-bold border transition-all active:scale-90",
                  inning === inn
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-border text-muted"
                )}
              >
                {inn}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-[11px] font-bold text-muted mb-1.5">打点</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRbi(Math.max(0, rbi - 1))}
              className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"
            >
              <Minus className="w-4 h-4 text-muted" />
            </button>
            <span className="text-[18px] font-black w-8 text-center">
              {rbi}
            </span>
            <button
              onClick={() => setRbi(rbi + 1)}
              className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-4 h-4 text-muted" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold text-blue-600 mb-1.5">
              ヒット
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {hitResults.map((r) => {
                const info = AT_BAT_RESULTS[r];
                return (
                  <button
                    key={r}
                    onClick={() => onSubmit(r, rbi)}
                    disabled={saving}
                    className="py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[12px] font-bold active:scale-95 transition-all"
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-500 mb-1.5">
              アウト
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {outResults.map((r) => {
                const info = AT_BAT_RESULTS[r];
                return (
                  <button
                    key={r}
                    onClick={() => onSubmit(r, rbi)}
                    disabled={saving}
                    className="py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-[12px] font-bold active:scale-95 transition-all"
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-green-600 mb-1.5">
              その他
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {otherResults.map((r) => {
                const info = AT_BAT_RESULTS[r];
                return (
                  <button
                    key={r}
                    onClick={() => onSubmit(r, rbi)}
                    disabled={saving}
                    className="py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-[12px] font-bold active:scale-95 transition-all"
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <LiveContent />
    </Suspense>
  );
}
