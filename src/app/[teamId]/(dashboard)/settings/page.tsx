"use client";

import { useState, useEffect } from "react";
import { Settings, Users, CheckCircle2, UserRound } from "lucide-react";
import { useTeam } from "@/components/team/team-provider";
import { PushNotificationCard } from "@/components/settings/push-notification-card";
import { activateStaffMode, deactivateStaffMode, isStaffModeActive } from "@/lib/staff-auth";
import { getMyName, setMyName, clearMyName } from "@/lib/my-name";

export default function SettingsPage() {
  const { team, teamSlug } = useTeam();
  const [isStaff, setIsStaff] = useState(false);
  const [staffPin, setStaffPin] = useState("");
  // この端末が「自分（選手）」として覚えている名前。予定一覧の「回答済み（緑）」の判定に使われる
  const [myName, setMyNameState] = useState("");
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    async function loadAuthState() {
      setIsStaff(isStaffModeActive(teamSlug));
      setMyNameState(getMyName(teamSlug));
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

      <PushNotificationCard />

      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
        <div className="flex items-center gap-2 text-primary font-bold mb-3">
          <UserRound className="w-5 h-5" />
          <h2 className="text-[15px]">この端末の選手名</h2>
        </div>
        <p className="text-[12px] text-muted leading-relaxed mb-3">
          予定一覧の「✓ 回答済み」（緑）は、この名前で出欠を出した予定に付きます。
          代理で他の選手の出欠を入れた端末に、その選手の名前が残っていることがあります。心当たりが無ければ消してください。
        </p>
        {myName ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-background border border-border px-3 py-2.5 rounded-xl">
              <span className="text-[15px] font-bold">{myName}</span>
              <button
                type="button"
                onClick={() => { if (!confirm(`「${myName}」をこの端末から消しますか？\n（出欠の記録は消えません。緑の表示だけが消えます）`)) return; clearMyName(teamSlug); setMyNameState(""); }}
                className="text-[12px] font-bold text-error bg-error/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
              >
                消す
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); const v = nameInput.trim(); if (!v) return; setMyName(teamSlug, v); setMyNameState(v); setNameInput(""); }}
            className="space-y-2"
          >
            <p className="text-[12px] text-muted">登録なし。自分（またはお子さん）の名前で出欠を出すと自動で登録されます。ここで先に入れておくこともできます。</p>
            <div className="flex gap-2">
              <input type="text" placeholder="選手の名前" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="flex-1 bg-background border border-border px-3 py-2.5 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm" />
              <button type="submit" className="px-4 py-2.5 bg-primary text-white font-bold text-[13px] rounded-xl active:scale-95 transition-all shadow-sm">登録</button>
            </div>
          </form>
        )}
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
