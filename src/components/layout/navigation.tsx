"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TEAM_NAME } from "@/lib/constants";
import { Home, Calendar, Megaphone, Plus, Settings } from "lucide-react";

/** モバイル専用ヘッダー（ログイン・通知を撤廃） */
export function Header() {
  return (
    <header className="sticky top-0 z-50 glass-card safe-top">
      <div className="px-4 h-12 flex items-center justify-center">
        {/* ロゴ */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-hero flex items-center justify-center">
            <span className="text-white font-black text-[11px]">SK</span>
          </div>
          <span className="font-black text-sm text-primary">{TEAM_NAME}</span>
        </Link>
      </div>
    </header>
  );
}

/** 
 * ボトムナビ（超シンプル版）
 * ※通知、メンバー管理を撤廃
 */
export function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 状態の確認と監視
    const checkAdmin = () => {
      setIsAdmin(localStorage.getItem("sk_admin") === "true");
    };
    checkAdmin();
    
    // 設定画面等で状態が変わった時用（同じウィンドウ内での簡易な反映）
    window.addEventListener("storage", checkAdmin);
    return () => window.removeEventListener("storage", checkAdmin);
  }, [pathname]); // ページ遷移時にも再確認する

  const tabs = [
    { href: "/dashboard", icon: Home, label: "ホーム" },
    { href: "/calendar", icon: Calendar, label: "予定" },
    ...(isAdmin ? [{ href: "/games/new", icon: Plus, label: "予定登録", isAction: true }] : []),
    { href: "/announcements", icon: Megaphone, label: "連絡" },
    { href: "/settings", icon: Settings, label: "管理設定" },
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
