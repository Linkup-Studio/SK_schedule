"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TEAM_NAME } from "@/lib/constants";
import { Home, Calendar, Megaphone, Plus } from "lucide-react";

/** モバイル専用ヘッダー — ロゴ5回タップで管理者モード切替 */
export function Header() {
  const [tapCount, setTapCount] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsAdmin(localStorage.getItem("sk_admin") === "true");
  }, []);

  const handleLogoTap = useCallback(() => {
    const next = tapCount + 1;
    setTapCount(next);

    // タイマーリセット（2秒以内に5回タップ必要）
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => setTapCount(0), 2000);

    if (next >= 5) {
      setTapCount(0);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

      if (isAdmin) {
        // 管理者モード終了
        localStorage.removeItem("sk_admin");
        setIsAdmin(false);
        window.dispatchEvent(new Event("storage"));
        alert("管理者モードを終了しました。");
      } else {
        // パスコード入力ダイアログ表示
        setShowDialog(true);
        setPasscode("");
      }
    }
  }, [tapCount, isAdmin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "1234") {
      localStorage.setItem("sk_admin", "true");
      setIsAdmin(true);
      setShowDialog(false);
      window.dispatchEvent(new Event("storage"));
      alert("管理者モードになりました！\n画面下部に「予定登録」ボタンが表示されます。");
    } else {
      alert("パスコードが違います");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-card safe-top">
        <div className="px-4 h-12 flex items-center justify-center">
          <button
            type="button"
            onClick={handleLogoTap}
            className="flex items-center gap-2.5 select-none"
          >
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
              isAdmin ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-gradient-hero"
            )}>
              <span className="text-white font-black text-[11px]">SK</span>
            </div>
            <span className="font-black text-sm text-primary">{TEAM_NAME}</span>
            {isAdmin && <Link href="/members" className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 active:scale-95 transition-transform">管理者</Link>}
          </button>
        </div>
      </header>

      {/* パスコード入力ダイアログ */}
      {showDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-2xl p-5 mx-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-black text-base text-center mb-1">🔒 管理者ログイン</h3>
            <p className="text-[11px] text-muted text-center mb-4">代表者パスコードを入力してください</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="パスコード"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                className="w-full bg-background border border-border px-4 py-3 rounded-xl text-[15px] text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 py-3 bg-surface-variant text-muted text-[13px] font-bold rounded-xl active:bg-border transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white font-bold text-[13px] rounded-xl active:scale-95 transition-all shadow-sm"
                >
                  解除
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/** 
 * ボトムナビ（管理設定タブなし）
 * 管理者モードのときだけ「予定登録」が表示される
 */
export function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = () => {
      setIsAdmin(localStorage.getItem("sk_admin") === "true");
    };
    checkAdmin();
    window.addEventListener("storage", checkAdmin);
    return () => window.removeEventListener("storage", checkAdmin);
  }, [pathname]);

  const tabs = [
    { href: "/dashboard", icon: Home, label: "ホーム" },
    { href: "/calendar", icon: Calendar, label: "予定" },
    { href: "/announcements", icon: Megaphone, label: "連絡" },
    ...(isAdmin ? [{ href: "/games/new", icon: Plus, label: "予定登録", isAction: true }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 safe-bottom">
      <div className="flex items-end justify-around px-1 pt-1 pb-1">
        {tabs.map((tab) => {
          const isActive = tab.href === "/dashboard"
            ? pathname === "/dashboard"
            : !tab.isAction && pathname.startsWith(tab.href);

          if (tab.isAction) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center -mt-4 touch-active"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center transition-transform">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-[9px] font-bold text-primary mt-0.5">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-xl transition-all touch-active",
                isActive ? "text-primary" : "text-muted"
              )}
            >
              <div className={cn(
                "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                isActive && "bg-primary-50"
              )}>
                <tab.icon
                  className="w-[22px] h-[22px]"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span className={cn(
                "text-[9px] mt-0.5",
                isActive ? "font-black" : "font-bold"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar() {
  return null;
}
