"use client";

import { useState, useEffect } from "react";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { TEAM_NAME } from "@/lib/constants";

// ==========================================
// 【重要】部外者ブロック用のチーム共通パスワード
// ==========================================
const TEAM_PASSCODE = "sk2026"; 

export function GlobalLock({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    // 初回アクセス時に、以前ロック解除した記録があるかチェック
    const isAuth = localStorage.getItem("sk_team_auth") === "true";
    setIsUnlocked(isAuth);
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode === TEAM_PASSCODE) {
      localStorage.setItem("sk_team_auth", "true");
      setIsUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  // SSR時のハイドレーション不一致を防ぐため、判定前は何も表示しない（またはローディング）
  if (isUnlocked === null) {
    return <div className="h-[100dvh] bg-background" />;
  }

  // ロック解除済みの場合は中身（アプリ本体）を表示
  if (isUnlocked) {
    return <>{children}</>;
  }

  // ロック画面
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* 背景装飾 */}
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
            このページは {TEAM_NAME} の<br />関係者専用です。合言葉を入力してください。
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
