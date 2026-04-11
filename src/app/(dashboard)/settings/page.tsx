"use client";

import { useState, useEffect } from "react";
import { Settings, Shield, ChevronRight } from "lucide-react";

/** 簡易的な管理設定ページ */
export default function SettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passcode, setPasscode] = useState("");

  // マウント時に状態を読み込む
  useEffect(() => {
    setIsAdmin(localStorage.getItem("sk_admin") === "true");
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "1234") { // 後でSupabase環境変数などに変更
      localStorage.setItem("sk_admin", "true");
      setIsAdmin(true);
      alert("管理者モードになりました。画面下部に「予定登録」ボタンが表示されます！");
    } else {
      alert("パスコードが違います");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sk_admin");
    setIsAdmin(false);
    alert("管理者モードを終了しました。");
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      <div className="flex items-center gap-1.5">
        <Settings className="w-5 h-5 text-primary" />
        <h1 className="font-black text-lg">管理設定</h1>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
        <div className="flex items-center gap-2 text-primary font-bold mb-3">
          <Shield className="w-5 h-5" />
          <h2 className="text-[15px]">チーム代表者（管理者）モード</h2>
        </div>

        {isAdmin ? (
          <div className="space-y-4">
            <p className="text-[13px] text-green-600 font-bold bg-green-50 px-3 py-2 rounded-xl border border-green-200">
              ✓ 現在、管理者としてロック解除されています。<br/>
              下部メニューから「予定登録」が可能です。
            </p>
            <button 
              onClick={handleLogout}
              className="w-full py-3 bg-surface-variant text-muted text-[13px] font-bold rounded-xl active:bg-border transition-colors"
            >
              管理者モードを終了する
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <p className="text-[12px] text-muted leading-relaxed">
              代表者パスコードを入力すると、予定の登録や削除が可能になります。
            </p>
            <div className="space-y-2">
              <input 
                type="password" 
                placeholder="パスコード"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2.5 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
              />
              <button 
                type="submit"
                className="w-full py-3 bg-primary text-white font-bold text-[14px] rounded-xl active:scale-95 transition-all shadow-sm"
              >
                🔓 パスコードで解除
              </button>
            </div>
            <p className="text-[10px] text-muted">※テスト用パスコード: 1234</p>
          </form>
        )}
      </div>
      
      {/* その他の設定項目リスト */}
      <div className="bg-surface rounded-2xl border border-border divide-y divide-border/50 shadow-sm overflow-hidden">
        <button className="w-full flex items-center justify-between px-4 py-3.5 active:bg-surface-variant transition-colors text-left">
          <span className="text-[13px] font-bold">アプリについて</span>
          <ChevronRight className="w-4 h-4 text-muted" />
        </button>
        <button className="w-full flex items-center justify-between px-4 py-3.5 active:bg-surface-variant transition-colors text-left">
          <span className="text-[13px] font-bold">使い方ガイド</span>
          <ChevronRight className="w-4 h-4 text-muted" />
        </button>
      </div>

    </div>
  );
}
