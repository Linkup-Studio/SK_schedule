"use client";

import { useState, useEffect } from "react";
import { Settings, Users, CheckCircle2 } from "lucide-react";
import { useTeam } from "@/components/team/team-provider";
import { activateStaffMode, deactivateStaffMode, isStaffModeActive } from "@/lib/staff-auth";

export default function SettingsPage() {
  const { team, teamSlug } = useTeam();
  const [isStaff, setIsStaff] = useState(false);
  const [staffPin, setStaffPin] = useState("");

  useEffect(() => {
    async function loadAuthState() {
      setIsStaff(isStaffModeActive(teamSlug));
    }
    loadAuthState();
  }, [teamSlug]);

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

    </div>
  );
}
