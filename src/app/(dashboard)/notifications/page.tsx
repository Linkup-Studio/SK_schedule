"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Bell,
  CalendarDays,
  Megaphone,
  Clock,
  CheckCheck,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";

const typeConfig = {
  new_game: { icon: CalendarDays, label: "新規試合", color: "text-info bg-blue-50" },
  rsvp_reminder: { icon: Clock, label: "出欠リマインド", color: "text-warning bg-amber-50" },
  game_reminder: { icon: CalendarDays, label: "試合リマインド", color: "text-error bg-red-50" },
  new_announcement: { icon: Megaphone, label: "お知らせ", color: "text-primary bg-primary-50" },
  new_comment: { icon: Megaphone, label: "コメント", color: "text-success bg-green-50" },
};

/** 通知一覧ページ */
export default function NotificationsPage() {
  const sorted = [...MOCK_NOTIFICATIONS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="font-black text-xl flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          通知
        </h1>
        <button className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
          <CheckCheck className="w-4 h-4" />
          すべて既読
        </button>
      </div>

      {/* 通知リスト */}
      <div className="space-y-2">
        {sorted.map((notif, i) => {
          const config = typeConfig[notif.type];
          const Icon = config.icon;
          const href = notif.referenceType === "game"
            ? `/games/${notif.referenceId}`
            : notif.referenceType === "announcement"
              ? `/announcements/${notif.referenceId}`
              : "#";

          return (
            <Link
              key={notif.id}
              href={href}
              className={cn(
                "flex items-start gap-3 bg-surface rounded-xl border border-border p-3 hover:shadow-md transition-all",
                "animate-fade-in-up",
                !notif.isRead && "border-l-4 border-l-primary",
                i === 1 && "animate-fade-in-up-delay-1",
                i === 2 && "animate-fade-in-up-delay-2",
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", config.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm leading-snug", !notif.isRead && "font-bold")}>
                  {notif.message}
                </p>
                <p className="text-[10px] text-muted mt-1">
                  {format(new Date(notif.createdAt), "M月d日 HH:mm", { locale: ja })}
                </p>
              </div>
              {!notif.isRead && (
                <Circle className="w-2 h-2 fill-primary text-primary shrink-0 mt-2" />
              )}
            </Link>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <Bell className="w-12 h-12 text-muted mx-auto mb-3" />
          <h3 className="font-bold text-base mb-1">通知はありません</h3>
          <p className="text-sm text-muted">新しい通知があればここに表示されます</p>
        </div>
      )}
    </div>
  );
}
