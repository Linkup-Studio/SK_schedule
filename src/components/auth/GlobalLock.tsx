"use client";

import { useState, useEffect } from "react";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { useTeam } from "@/components/team/team-provider";

export function GlobalLock({ children }: { children: React.ReactNode }) {
  const { team, teamSlug, loading: teamLoading } = useTeam();
  const storageKey = `${teamSlug}_team_auth`;

  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem(storageKey) === "true";
    setIsUnlocked(isAuth);
  }, [storageKey]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (team && inputCode === team.passcode) {
      localStorage.setItem(storageKey, "true");
      setIsUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (isUnlocked === null || teamLoading) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted mt-3 font-bold">読み込み中...</p>
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  const teamName = team?.name ?? teamSlug;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[50%] bg-primary/20 blur-[100px] rounded-full" />
        <div className="absolute top-[60%] -right-[20%] w-[80%] h-[60%] bg-blue-400/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-surface rounded-3xl p-8 shadow-2xl shadow-primary/10 border border-white box-border text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-inner">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-xl font-black text-foreground mb-2">チーム専用ページ</h1>
          <p className="text-[12px] text-muted mb-8 leading-relaxed">
            このページは {teamName} の<br />関係者専用です。合言葉を入力してください。
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="合言葉を入力"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className={`w-full bg-surface-variant font-bold text-center text-[15px] px-4 py-4 rounded-xl border-2 outline-none transition-all placeholder:text-muted/50 placeholder:font-medium
                    ${error ? "border-error/50 bg-error/5 text-error" : "border-transparent focus:border-primary/30 focus:bg-white"}`}
                />
              </div>
              {error && (
                <p className="text-[11px] font-bold text-error mt-2 animate-fade-in-up">
                  合言葉が間違っています
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white font-bold text-[14px] py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              入室する
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-[10px] text-muted">
              ※一度入力すると次回からは自動で入室できます。<br />
              （ログアウトしたい場合はブラウザの履歴を削除してください）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
