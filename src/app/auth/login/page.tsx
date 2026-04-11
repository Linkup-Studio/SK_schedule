"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TEAM_NAME } from "@/lib/constants";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

/** ログインページ */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    setError("");
    setIsLoading(true);
    // モック: 認証処理（将来 Supabase Auth に置き換え）
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    // モックでは直接ダッシュボードへ
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 px-4 py-8">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        {/* ロゴセクション */}
        <div className="text-center space-y-3 animate-fade-in-up">
          <div className="w-20 h-20 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
            <span className="text-white font-black text-2xl">SK</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">BallPark</h1>
            <p className="text-sm text-muted mt-1">{TEAM_NAME} スケジュール管理</p>
          </div>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up animate-fade-in-up-delay-1">
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-lg text-center">ログイン</h2>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-sm text-error font-medium animate-fade-in-up">
                {error}
              </div>
            )}

            {/* メールアドレス */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-muted">
                <Mail className="w-3.5 h-3.5" />
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* パスワード */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-muted">
                <Lock className="w-3.5 h-3.5" />
                パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* パスワードリセット */}
            <div className="text-right">
              <Link
                href="/auth/reset-password"
                className="text-xs text-primary font-bold hover:underline"
              >
                パスワードを忘れた方
              </Link>
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all",
                isLoading
                  ? "bg-primary/50 text-white cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20 hover:shadow-xl active:scale-[0.98]"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                <>
                  ログイン
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* デモアカウント */}
          <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-primary text-center">🎮 デモアカウント</p>
            <div className="space-y-1.5">
              {[
                { label: "管理者", email: "admin@sk-baseball.com", desc: "全機能アクセス" },
                { label: "選手", email: "player@sk-baseball.com", desc: "出欠回答・閲覧" },
                { label: "保護者", email: "parent@sk-baseball.com", desc: "閲覧・出欠回答" },
              ].map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword("demo1234");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-blue-100 hover:border-primary transition-colors text-left"
                >
                  <div>
                    <span className="text-xs font-bold text-foreground">{demo.label}</span>
                    <span className="text-[10px] text-muted ml-2">{demo.desc}</span>
                  </div>
                  <span className="text-[10px] text-primary font-mono">{demo.email}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-center text-muted">パスワード: demo1234</p>
          </div>
        </form>

        {/* サインアップリンク */}
        <p className="text-center text-sm text-muted animate-fade-in-up animate-fade-in-up-delay-2">
          アカウントをお持ちでない方は
          <Link href="/auth/signup" className="text-primary font-bold hover:underline ml-1">
            新規登録
          </Link>
        </p>

        {/* フッター */}
        <p className="text-center text-[10px] text-muted/50 animate-fade-in-up animate-fade-in-up-delay-3">
          BallPark v1.0.0 · © 2026 {TEAM_NAME}
        </p>
      </div>
    </div>
  );
}
