"use client";

import { useState } from "react";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { useTeam } from "@/lib/team-context";

export function GlobalLock({ children }: { children: React.ReactNode }) {
  const { currentTeam, isLoading, findTeamByPassphrase, setCurrentTeam } = useTeam();
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // チーム情報をlocalStorageから復元中
  if (isLoading) {
    return <div className="h-[100dvh] bg-background" />;
  }

  // 既にチーム選択済み → アプリ本体を表示
  if (currentTeam) {
    return <>{children}</>;
  }

  // 合言葉入力 → チーム判別
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || checking) return;

    setChecking(true);
    setError(false);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

      // 直接REST APIでテスト
      const restUrl = `${url}/rest/v1/teams?select=id,passphrase&passphrase=eq.${inputCode.trim()}`;
      const res = await fetch(restUrl, {
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      });

      const info = [
        `URL: ${url}`,
        `Key: ${key.substring(0, 15)}...`,
        `REST: ${res.status} ${res.statusText}`,
      ];

      if (res.ok) {
        const json = await res.json();
        info.push(`データ: ${JSON.stringify(json)}`);
      } else {
        const text = await res.text();
        info.push(`エラー本文: ${text.substring(0, 200)}`);
      }

      setDebugInfo(info.join("\n"));

      // 成功したら通常フローへ
      if (res.ok) {
        const team = await findTeamByPassphrase(inputCode.trim());
        if (team) {
          setCurrentTeam(team);
          return;
        }
      }
      setError(true);
    } catch (err) {
      setDebugInfo(`fetch例外: ${err instanceof Error ? err.message : String(err)}`);
      setError(true);
    }
    setChecking(false);
  };

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
            チームの合言葉を入力してください
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
                  合言葉が一致しません
                </p>
              )}
              {debugInfo && (
                <pre className="text-[10px] text-left text-muted mt-3 p-2 bg-gray-100 rounded-lg whitespace-pre-wrap break-all">
                  {debugInfo}
                </pre>
              )}
            </div>

            <button
              type="submit"
              disabled={checking}
              className="w-full bg-primary text-white font-bold text-[14px] py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {checking ? "確認中..." : "入室する"}
              {!checking && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-[10px] text-muted">
              ※一度入力すると次回からは自動で入室できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
