"use client";

import { useState, useEffect } from "react";
import { Settings, Shield, ChevronRight, Users, CheckCircle2 } from "lucide-react";
import { useTeam } from "@/components/team/team-provider";
import { activateStaffMode, deactivateStaffMode, isStaffModeActive } from "@/lib/staff-auth";

export default function SettingsPage() {
  const { team, teamSlug } = useTeam();
  const storageKey = `${teamSlug}_admin`;
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [staffPin, setStaffPin] = useState("");

  useEffect(() => {
    async function loadAuthState() {
      setIsAdmin(localStorage.getItem(storageKey) === "true");
      setIsStaff(isStaffModeActive(teamSlug));
    }
    loadAuthState();
  }, [storageKey, teamSlug]);

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team?.staffPin) {
      alert("スタッフPINがまだ設定されていません。代表者に確認してください。");
      return;
    }
    if (staffPin === team.staffPin) {
      activateStaffMode(teamSlug);
      setIsStaff(true);
      setStaffPin("");
      alert("スタッフモードになりました。予定詳細でスタッフ出欠を確認できます。");
    } else {
      alert("スタッフPINが違います");
    }
  };

  const handleStaffLogout = () => {
    deactivateStaffMode(teamSlug);
    setIsStaff(false);
    alert("スタッフモードを終了しました。");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (team && passcode === team.adminPasscode) {
      localStorage.setItem(storageKey, "true");
      setIsAdmin(true);
      alert("管理者モードになりました。画面下部に「予定登録」ボタンが表示されます！");
    } else {
      alert("パスコードが違います");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
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
          <Users className="w-5 h-5" />
          <h2 className="text-[15px]">スタッフモード</h2>
        </div>

        {isStaff ? (
          <div className="space-y-4">
            <p className="text-[13px] text-info font-bold bg-info/10 px-3 py-2 rounded-xl border border-info/20 flex gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                スタッフモード中です。予定詳細でスタッフ出欠を確認できます。<br />
                30日間スタッフ出欠を見なかった場合は、再度PIN入力が必要です。
              </span>
            </p>
            <button onClick={handleStaffLogout} className="w-full py-3 bg-surface-variant text-muted text-[13px] font-bold rounded-xl active:bg-border transition-colors">
              スタッフモードを終了する
            </button>
          </div>
        ) : (
          <form onSubmit={handleStaffLogin} className="space-y-3">
            <p className="text-[12px] text-muted leading-relaxed">スタッフPINを入力すると、スタッフ出欠を確認・回答できます。予定の編集はできません。</p>
            <div className="space-y-2">
              <input type="password" placeholder="スタッフPIN" value={staffPin} onChange={(e) => setStaffPin(e.target.value)} className="w-full bg-background border border-border px-3 py-2.5 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm" />
              <button type="submit" className="w-full py-3 bg-primary text-white font-bold text-[14px] rounded-xl active:scale-95 transition-all shadow-sm">スタッフモードに入る</button>
            </div>
          </form>
        )}
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
            <button onClick={handleLogout} className="w-full py-3 bg-surface-variant text-muted text-[13px] font-bold rounded-xl active:bg-border transition-colors">
              管理者モードを終了する
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <p className="text-[12px] text-muted leading-relaxed">代表者パスコードを入力すると、予定の登録や削除が可能になります。</p>
            <div className="space-y-2">
              <input type="password" placeholder="パスコード" value={passcode} onChange={(e) => setPasscode(e.target.value)} className="w-full bg-background border border-border px-3 py-2.5 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm" />
              <button type="submit" className="w-full py-3 bg-primary text-white font-bold text-[14px] rounded-xl active:scale-95 transition-all shadow-sm">🔓 パスコードで解除</button>
            </div>
          </form>
        )}
      </div>

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
