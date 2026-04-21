"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Plus, Minus, RotateCcw, Trophy, ArrowLeftRight, Lock, Unlock,
} from "lucide-react";
import confetti from "canvas-confetti";
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
  substitutePlayer,
} from "@/lib/scorebook-data";
import { fetchAttendancesByGame } from "@/lib/supabase-data";
import { AT_BAT_RESULTS, POSITIONS } from "@/lib/scorebook-types";
import type { ScorebookGame, LineupEntry, AtBat, AtBatResult } from "@/lib/scorebook-types";
import type { Attendance } from "@/lib/types";

function getActiveLineup(allLineup: LineupEntry[]): LineupEntry[] {
  const byOrder: Record<number, LineupEntry> = {};
  for (const entry of allLineup) {
    const existing = byOrder[entry.battingOrder];
    if (!existing || new Date(entry.createdAt) > new Date(existing.createdAt)) {
      byOrder[entry.battingOrder] = entry;
    }
  }
  return Object.values(byOrder).sort((a, b) => a.battingOrder - b.battingOrder);
}

function LiveContent() {
  const searchParams = useSearchParams();
  const { team } = useTeam();
  const teamLink = useTeamLink();
  const scorebookId = searchParams.get("id") ?? "";

  const [scorebook, setScorebook] = useState<ScorebookGame | null>(null);
  const [allLineup, setAllLineup] = useState<LineupEntry[]>([]);
  const [atBats, setAtBats] = useState<AtBat[]>([]);
  const [attendees, setAttendees] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const [showAtBatModal, setShowAtBatModal] = useState(false);
  const [selectedBatter, setSelectedBatter] = useState<LineupEntry | null>(null);
  const [selectedInning, setSelectedInning] = useState(1);

  const [showSubModal, setShowSubModal] = useState(false);
  const [subTarget, setSubTarget] = useState<LineupEntry | null>(null);

  useEffect(() => {
    if (!scorebookId) return;
    async function load() {
      const [sb, lu, ab] = await Promise.all([
        fetchScorebookById(scorebookId),
        fetchLineup(scorebookId),
        fetchAtBats(scorebookId),
      ]);
      setScorebook(sb);
      setAllLineup(lu);
      setAtBats(ab);

      if (sb) {
        const atts = await fetchAttendancesByGame(sb.gameId);
        setAttendees(atts.filter((a) => a.status === "attend"));
      }
      setLoading(false);
    }
    load();
  }, [scorebookId]);

  const activeLineup = getActiveLineup(allLineup);
  const activeNames = new Set(activeLineup.map((e) => e.playerName));
  const benchPlayers = attendees.filter(
    (a) => !activeNames.has(a.userName ?? a.userId)
  );

  const handleLockToggle = () => {
    if (editMode) {
      setEditMode(false);
    } else {
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = (pin: string) => {
    if (team && pin === team.adminPasscode) {
      setEditMode(true);
      setShowPinModal(false);
    } else {
      alert("PINが正しくありません");
    }
  };

  const launchFireworks = useCallback(() => {
    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ["#FF0000", "#FF6600", "#FFDD00", "#00FF00", "#00CCFF", "#FF00FF", "#FF1493", "#FFD700", "#7B68EE", "#00FF7F"];

    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors,
      startVelocity: 45,
    });

    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, colors, startVelocity: 50 });
      confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors, startVelocity: 50 });
    }, 300);

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.7 },
        colors,
        startVelocity: 40,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.7 },
        colors,
        startVelocity: 40,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

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
    if (updated) {
      setScorebook(updated);
      if (updated.totalScoreUs > updated.totalScoreThem) {
        launchFireworks();
      }
    }
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

  const handleSubstitute = async (newPlayerName: string, position: number | null) => {
    if (!subTarget) return;
    setSaving(true);
    const newEntry = await substitutePlayer(
      scorebookId,
      subTarget.battingOrder,
      newPlayerName,
      position
    );
    if (newEntry) {
      setAllLineup((prev) => [...prev, newEntry]);
    }
    setShowSubModal(false);
    setSubTarget(null);
    setSaving(false);
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
  const canEdit = editMode && !isCompleted;

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
      <div className="bg-gradient-hero rounded-2xl p-4 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-primary-100 font-bold">
              {isCompleted ? "試合終了" : "試合中"}
            </p>
            <p className="text-[13px] font-bold mt-0.5">
              vs {scorebook.opponent}
            </p>
          </div>
          <div className="text-right flex items-start gap-2">
            <div>
              <div className="text-3xl font-black tracking-wider">
                {scorebook.totalScoreUs} - {scorebook.totalScoreThem}
              </div>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 bg-white/20">
                  {won ? "勝利" : lost ? "惜敗" : "引き分け"}
                </span>
              )}
            </div>
            {/* 編集モード鍵アイコン */}
            <button
              onClick={handleLockToggle}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all",
                editMode ? "bg-white/30" : "bg-white/10"
              )}
            >
              {editMode ? (
                <Unlock className="w-4 h-4 text-white" />
              ) : (
                <Lock className="w-4 h-4 text-white/60" />
              )}
            </button>
          </div>
        </div>
        {editMode && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] text-white/80 font-bold">編集モード</span>
          </div>
        )}
      </div>

      {/* 得点板 */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead>
              <tr className="bg-primary-50 border-b border-border">
                <th className="text-[10px] font-black text-primary py-2 px-2 text-left sticky left-0 bg-primary-50 z-10 min-w-[64px]">
                  チーム
                </th>
                {innings.map((inn) => (
                  <th
                    key={inn}
                    className="text-[10px] font-black text-primary py-2 px-1 min-w-[32px]"
                  >
                    {inn}
                  </th>
                ))}
                <th className="text-[10px] font-black text-primary py-2 px-2 min-w-[36px] border-l border-primary/20">
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
                      {canEdit ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => updateScore(inn, isUs, 1)}
                            className="w-6 h-5 rounded bg-primary-50 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Plus className="w-2.5 h-2.5 text-primary" />
                          </button>
                          <span className="text-[14px] font-black min-w-[20px]">
                            {score !== undefined ? score : "-"}
                          </span>
                          <button
                            onClick={() => updateScore(inn, isUs, -1)}
                            className="w-6 h-5 rounded bg-primary-50 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Minus className="w-2.5 h-2.5 text-primary" />
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
                <td className="text-[16px] font-black py-2.5 px-2 border-l border-primary/20 text-primary">
                  {scorebook.isHome
                    ? scorebook.totalScoreThem
                    : scorebook.totalScoreUs}
                </td>
              </tr>
              {/* 自チーム */}
              <tr>
                <td className="text-[11px] font-bold py-2.5 px-2 text-left sticky left-0 bg-surface z-10 text-primary">
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
                      {canEdit ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => updateScore(inn, isUs, 1)}
                            className="w-6 h-5 rounded bg-primary-50 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Plus className="w-2.5 h-2.5 text-primary" />
                          </button>
                          <span className="text-[14px] font-black min-w-[20px]">
                            {score !== undefined ? score : "-"}
                          </span>
                          <button
                            onClick={() => updateScore(inn, isUs, -1)}
                            className="w-6 h-5 rounded bg-primary-50 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Minus className="w-2.5 h-2.5 text-primary" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[14px] font-black text-primary">
                          {score !== undefined ? score : "-"}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="text-[16px] font-black py-2.5 px-2 border-l border-primary/20 text-primary">
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
        <div className="px-3 py-2.5 border-b border-border bg-primary-50">
          <h2 className="text-[13px] font-black text-primary">打順・成績</h2>
        </div>
        <div className="divide-y divide-border/50">
          {activeLineup.map((entry) => {
            const playerAtBats = atBats.filter(
              (ab) => ab.playerName === entry.playerName
            );
            const hits = playerAtBats.filter((ab) =>
              ["single", "double", "triple", "homerun"].includes(ab.result)
            ).length;
            const totalAB = playerAtBats.filter(
              (ab) => !["walk", "hit_by_pitch", "sacrifice"].includes(ab.result)
            ).length;

            const isSubstitute = !entry.isStarter;
            const prevPlayers = allLineup
              .filter((e) => e.battingOrder === entry.battingOrder && e.id !== entry.id)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return (
              <div key={entry.id} className="px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">
                    {entry.battingOrder}
                  </span>
                  {entry.position && (
                    <span className="text-[10px] font-bold text-primary bg-primary-50 px-1.5 py-0.5 rounded">
                      {POSITIONS[entry.position]?.short}
                    </span>
                  )}
                  <span className="text-[13px] font-bold flex-1 truncate">
                    {entry.playerName}
                    {isSubstitute && (
                      <span className="text-[9px] text-primary-light ml-1">途中出場</span>
                    )}
                  </span>
                  {totalAB > 0 && (
                    <span className="text-[10px] font-bold text-muted">
                      {hits}/{totalAB}
                    </span>
                  )}
                  {canEdit && (
                    <>
                      <button
                        onClick={() => {
                          setSubTarget(entry);
                          setShowSubModal(true);
                        }}
                        className="w-7 h-7 rounded-lg bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"
                        title="選手交代"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
                      </button>
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
                    </>
                  )}
                </div>
                {/* 交代前の選手の打席結果 */}
                {prevPlayers.map((prev) => {
                  const prevAtBats = atBats.filter(
                    (ab) => ab.playerName === prev.playerName
                  );
                  if (prevAtBats.length === 0) return null;
                  return (
                    <div key={prev.id} className="ml-7 mb-1">
                      <span className="text-[10px] text-muted mr-1">{prev.playerName}:</span>
                      <span className="inline-flex flex-wrap gap-1">
                        {prevAtBats.map((ab) => {
                          const info = AT_BAT_RESULTS[ab.result];
                          return (
                            <span
                              key={ab.id}
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                                info?.color ?? "text-gray-500",
                                "bg-white border-border opacity-60"
                              )}
                            >
                              {info?.short ?? ab.result}
                            </span>
                          );
                        })}
                      </span>
                    </div>
                  );
                })}
                {/* 現在の選手の打席結果 */}
                {playerAtBats.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-7">
                    {playerAtBats.map((ab) => {
                      const info = AT_BAT_RESULTS[ab.result];
                      return (
                        <button
                          key={ab.id}
                          onClick={() => editMode && handleDeleteAtBat(ab.id)}
                          disabled={!editMode}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all",
                            info?.color ?? "text-gray-500",
                            "bg-white border-border",
                            editMode && "active:scale-90"
                          )}
                          title={editMode ? "タップで削除" : ""}
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

      {/* 試合終了/再開ボタン（編集モード時のみ） */}
      {editMode && !isCompleted && (
        <button
          onClick={handleEndGame}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-primary-dark text-white font-black text-[14px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          試合終了
        </button>
      )}

      {editMode && isCompleted && (
        <button
          onClick={handleReopenGame}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-surface border-2 border-primary/20 text-primary font-bold text-[13px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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

      {/* 選手交代モーダル */}
      {showSubModal && subTarget && (
        <SubstitutionModal
          currentPlayer={subTarget}
          benchPlayers={benchPlayers}
          onSubmit={handleSubstitute}
          onClose={() => {
            setShowSubModal(false);
            setSubTarget(null);
          }}
          saving={saving}
        />
      )}

      {/* PIN入力モーダル */}
      {showPinModal && (
        <PinModal
          onSubmit={handlePinSubmit}
          onClose={() => setShowPinModal(false)}
        />
      )}
    </div>
  );
}

function PinModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (pin: string) => void;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-[300px] p-5 shadow-xl">
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-black text-[15px]">管理者PIN</h3>
          <p className="text-[11px] text-muted mt-1">
            編集モードを有効にするにはPINを入力してください
          </p>
        </div>

        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PINを入力"
          className="w-full px-4 py-3 rounded-xl border border-border text-center text-[18px] font-bold tracking-[0.3em] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 mb-3"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && pin) onSubmit(pin);
          }}
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-muted font-bold text-[13px] active:scale-[0.98] transition-all"
          >
            キャンセル
          </button>
          <button
            onClick={() => pin && onSubmit(pin)}
            disabled={!pin}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-bold text-[13px] active:scale-[0.98] transition-all",
              pin ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
            )}
          >
            解除
          </button>
        </div>
      </div>
    </div>
  );
}

function SubstitutionModal({
  currentPlayer,
  benchPlayers,
  onSubmit,
  onClose,
  saving,
}: {
  currentPlayer: LineupEntry;
  benchPlayers: Attendance[];
  onSubmit: (playerName: string, position: number | null) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(currentPlayer.position);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-4 pb-8 safe-bottom max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-[15px]">選手交代</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary active:scale-90 transition-transform"
          >
            ×
          </button>
        </div>

        <div className="bg-primary-50 rounded-xl p-3 mb-3">
          <p className="text-[11px] text-muted mb-0.5">交代する選手</p>
          <p className="text-[14px] font-black text-primary">
            {currentPlayer.battingOrder}番 {currentPlayer.playerName}
            {currentPlayer.position && (
              <span className="text-[11px] font-bold ml-1">
                （{POSITIONS[currentPlayer.position]?.label}）
              </span>
            )}
          </p>
        </div>

        <div className="mb-3">
          <p className="text-[11px] font-bold text-muted mb-1.5">交代先の選手</p>
          {benchPlayers.length === 0 ? (
            <p className="text-[13px] text-muted py-4 text-center">控え選手がいません</p>
          ) : (
            <div className="space-y-1.5">
              {benchPlayers.map((player) => {
                const name = player.userName ?? player.userId;
                return (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(name)}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl border text-left text-[13px] font-bold transition-all active:scale-[0.98]",
                      selectedPlayer === name
                        ? "bg-primary text-white border-primary"
                        : "bg-surface border-border text-foreground"
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedPlayer && (
          <div className="mb-4">
            <p className="text-[11px] font-bold text-muted mb-1.5">守備位置</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(POSITIONS).map(([num, pos]) => (
                <button
                  key={num}
                  onClick={() =>
                    setPosition(position === Number(num) ? null : Number(num))
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all active:scale-95",
                    position === Number(num)
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border text-muted"
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedPlayer && (
          <button
            onClick={() => onSubmit(selectedPlayer, position)}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary text-white font-black text-[14px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowLeftRight className="w-4 h-4" />
            )}
            {currentPlayer.playerName} → {selectedPlayer} に交代
          </button>
        )}
      </div>
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
            className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary active:scale-90 transition-transform"
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
              className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Minus className="w-4 h-4 text-primary" />
            </button>
            <span className="text-[18px] font-black w-8 text-center">
              {rbi}
            </span>
            <button
              onClick={() => setRbi(rbi + 1)}
              className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold text-primary mb-1.5">
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
                    className="py-2.5 rounded-xl bg-primary-50 border border-primary/20 text-primary text-[12px] font-bold active:scale-95 transition-all"
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-muted mb-1.5">
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
            <p className="text-[11px] font-bold text-primary-light mb-1.5">
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
                    className="py-2.5 rounded-xl bg-surface-variant border border-border text-foreground text-[12px] font-bold active:scale-95 transition-all"
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
