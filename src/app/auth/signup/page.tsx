"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TEAM_NAME, GRADES } from "@/lib/constants";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, ArrowLeft, Shield, Users } from "lucide-react";
import type { GradeValue } from "@/lib/constants";

type Role = "player" | "parent";

/** サインアップページ */
export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<GradeValue | null>(null);
  const [playerName, setPlayerName] = useState(""); // 保護者用: 選手名
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    alert("アカウントを作成しました（モック）");
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 px-4 py-8">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        {/* ロゴ */}
        <div className="text-center space-y-2 animate-fade-in-up">
          <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <span className="text-white font-black text-xl">SK</span>
          </div>
          <h1 className="text-xl font-black text-foreground">新規アカウント登録</h1>
          <p className="text-xs text-muted">{TEAM_NAME}</p>
        </div>

        {/* ステップインジケーター */}
        <div className="flex items-center gap-2 px-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step >= s
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface-variant text-muted"
              )}>
                {s}
              </div>
              <span className={cn(
                "text-xs font-bold transition-colors",
                step >= s ? "text-primary" : "text-muted"
              )}>
                {s === 1 ? "種別選択" : "情報入力"}
              </span>
              {s === 1 && (
                <div className={cn(
                  "flex-1 h-0.5 rounded-full transition-colors",
                  step >= 2 ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: ロール選択 */}
          {step === 1 && (
            <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-sm animate-fade-in-up">
              <h2 className="font-bold text-base text-center">あなたの種別を選択してください</h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setRole("player"); setStep(2); }}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all hover:shadow-lg active:scale-[0.98]",
                    role === "player"
                      ? "border-primary bg-primary-50 shadow-md"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">選手</p>
                    <p className="text-[10px] text-muted mt-0.5">出欠回答・スケジュール確認</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setRole("parent"); setStep(2); }}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all hover:shadow-lg active:scale-[0.98]",
                    role === "parent"
                      ? "border-primary bg-primary-50 shadow-md"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">保護者</p>
                    <p className="text-[10px] text-muted mt-0.5">お子様の出欠管理・連絡確認</p>
                  </div>
                </button>
              </div>

              <p className="text-[10px] text-center text-muted">
                ※ 管理者アカウントは監督・コーチが発行します
              </p>
            </div>
          )}

          {/* Step 2: 情報入力 */}
          {step === 2 && role && (
            <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-sm animate-fade-in-up">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                種別選択に戻る
              </button>

              <h2 className="font-bold text-base">
                {role === "player" ? "選手" : "保護者"}情報を入力
              </h2>

              {/* 名前 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-muted">
                  <User className="w-3.5 h-3.5" />
                  {role === "player" ? "選手名" : "保護者名"}
                  <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "player" ? "山田 太郎" : "山田 花子"}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* 保護者用: 選手名 */}
              {role === "parent" && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-muted">
                    <User className="w-3.5 h-3.5" />
                    お子様の名前 <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="山田 太郎"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              )}

              {/* 学年 */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-muted">
                  <Shield className="w-3.5 h-3.5" />
                  学年 <span className="text-error">*</span>
                </label>
                <div className="flex gap-2">
                  {GRADES.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGrade(g.value)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all",
                        grade === g.value
                          ? "bg-primary text-white border-primary shadow-md"
                          : "border-border text-muted hover:border-primary/30"
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* メールアドレス */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-muted">
                  <Mail className="w-3.5 h-3.5" />
                  メールアドレス <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* パスワード */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-muted">
                  <Lock className="w-3.5 h-3.5" />
                  パスワード <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8文字以上"
                    autoComplete="new-password"
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
                {password && (
                  <div className="flex gap-1.5 mt-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "flex-1 h-1 rounded-full transition-colors",
                          password.length >= level * 3
                            ? level <= 2 ? "bg-error" : level === 3 ? "bg-undecided" : "bg-attend"
                            : "bg-border"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 登録ボタン */}
              <button
                type="submit"
                disabled={isLoading || !name || !email || !password || !grade}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all",
                  isLoading || !name || !email || !password || !grade
                    ? "bg-primary/30 text-white/70 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20 hover:shadow-xl active:scale-[0.98]"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    登録中...
                  </>
                ) : (
                  <>
                    アカウントを作成
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* ログインリンク */}
        <p className="text-center text-sm text-muted">
          すでにアカウントをお持ちの方は
          <Link href="/auth/login" className="text-primary font-bold hover:underline ml-1">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
