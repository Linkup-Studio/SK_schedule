"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Shield,
  User,
  MoreVertical,
  Mail,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_USERS } from "@/lib/mock-data";
import { GRADES } from "@/lib/constants";
import type { GradeValue } from "@/lib/constants";
import { GradeFilter } from "@/components/common/grade-filter";

const roleLabels = {
  admin: { label: "管理者", icon: Shield, color: "bg-primary text-white" },
  player: { label: "選手", icon: User, color: "bg-blue-100 text-blue-700" },
  parent: { label: "保護者", icon: Users, color: "bg-emerald-100 text-emerald-700" },
};

/** メンバー管理ページ — モバイル最適化 */
export default function MembersPage() {
  const [gradeFilter, setGradeFilter] = useState<GradeValue | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // フィルタリング
  const filtered = MOCK_USERS.filter((user) => {
    if (gradeFilter && user.grade !== gradeFilter) return false;
    if (roleFilter && user.role !== roleFilter) return false;
    if (searchQuery && !user.name.includes(searchQuery)) return false;
    return true;
  });

  const admins = filtered.filter((u) => u.role === "admin");
  const players = filtered.filter((u) => u.role === "player");
  const parents = filtered.filter((u) => u.role === "parent");

  const groups = [
    { title: "管理者（監督・コーチ）", users: admins, icon: Shield },
    { title: "選手", users: players, icon: User },
    { title: "保護者", users: parents, icon: Users },
  ].filter((g) => g.users.length > 0);

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-black text-lg flex items-center gap-1.5">
          <Users className="w-5 h-5 text-primary" />
          メンバー
        </h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-[11px] font-bold shadow-sm active:scale-95 transition-transform"
        >
          <UserPlus className="w-3.5 h-3.5" />
          招待する
        </button>
      </div>

      {/* メンバー数サマリー */}
      <div className="grid grid-cols-3 gap-2 animate-fade-in-up">
        {[{ label: "管理者", count: MOCK_USERS.filter((u) => u.role === "admin").length, color: "bg-primary-50 text-primary border-primary/20", icon: Shield },
          { label: "選手", count: MOCK_USERS.filter((u) => u.role === "player").length, color: "bg-blue-50 text-blue-700 border-blue-200", icon: User },
          { label: "保護者", count: MOCK_USERS.filter((u) => u.role === "parent").length, color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Users }
        ].map((stat) => (
          <div key={stat.label} className={cn("bg-surface rounded-xl border p-2 text-center shadow-sm", stat.color)}>
            <stat.icon className="w-3.5 h-3.5 mx-auto mb-0.5 opacity-70" />
            <p className="text-xl font-black leading-none mb-1">{stat.count}</p>
            <p className="text-[9px] font-bold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 検索 + フィルター */}
      <div className="space-y-3 animate-fade-in-up animate-fade-in-up-delay-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="名前で検索..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-sm"
          />
        </div>

        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar py-0.5">
          <GradeFilter value={gradeFilter} onChange={setGradeFilter} />
        </div>

        {/* ロールフィルター */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-0.5 pb-1">
          {[null, "admin", "player", "parent"].map((r) => (
            <button
              key={r ?? "all"}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap active:scale-95 shrink-0 border",
                roleFilter === r
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface text-muted border-border active:bg-surface-variant"
              )}
            >
              {r === null ? "すべて" : roleLabels[r as keyof typeof roleLabels]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* メンバーリスト */}
      <div className="space-y-4 animate-fade-in-up animate-fade-in-up-delay-2">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-muted mb-1.5 px-1">
              <group.icon className="w-3.5 h-3.5" />
              {group.title}（{group.users.length}）
            </h2>
            <div className="bg-surface rounded-2xl border border-border divide-y divide-border/50 overflow-hidden shadow-sm">
              {group.users.map((user) => {
                const config = roleLabels[user.role];
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-3 py-2.5 active:bg-surface-variant transition-colors touch-active"
                  >
                    {/* アバター */}
                    <div className="w-9 h-9 rounded-full bg-gradient-hero flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-white font-black text-[13px]">
                        {user.name.charAt(0)}
                      </span>
                    </div>

                    {/* 情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-[13px] truncate">{user.name}</p>
                        {user.grade && (
                          <span className="text-[9px] font-bold text-muted bg-surface-variant px-1 rounded-sm border border-border">
                            中{user.grade}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 max-w-full">
                        <Mail className="w-3 h-3 text-muted shrink-0" />
                        <span className="text-[10px] text-muted truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    {/* ロールバッジ + メニュー */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-current/10",
                        config.color
                      )}>
                        {config.label}
                      </span>
                      <button className="p-1.5 -mr-1.5 rounded-lg active:bg-black/5 transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="bg-surface rounded-2xl border border-border p-8 text-center shadow-sm">
            <Users className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-[11px] text-muted">メンバーが見つかりません</p>
          </div>
        )}
      </div>

      {/* 招待モーダル */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowInviteModal(false)}
          />

          <div className="relative w-full max-w-md bg-surface rounded-t-3xl sm:rounded-2xl border-t border-white/20 p-5 space-y-4 animate-fade-in-up safe-bottom shadow-2xl">
            <div className="w-10 h-1.25 rounded-full bg-border mx-auto mb-2 sm:hidden" />

            <h2 className="font-black text-[15px] flex items-center gap-1.5">
              <UserPlus className="w-4.5 h-4.5 text-primary" />
              メンバーを招待
            </h2>

            <p className="text-[11px] text-muted leading-relaxed">
              招待リンクを共有するか、メールアドレスを入力してメンバーを追加できます。
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted">📎 招待リンク</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value="https://ballpark.app/invite/sk-abc123"
                  readOnly
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-surface-variant text-[11px] font-mono text-muted focus:outline-none"
                />
                <button className="px-4 py-2 bg-primary text-white rounded-xl text-[11px] font-bold active:bg-primary-light transition-colors active:scale-95 shadow-sm">
                  コピー
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted">✉️ メールで招待</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <button className="px-5 py-2 bg-primary text-white rounded-xl text-[11px] font-bold active:bg-primary-light transition-colors active:scale-95 shadow-sm">
                  送信
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full mt-2 py-3.5 rounded-xl bg-surface-variant text-[13px] font-bold text-muted active:opacity-70 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
