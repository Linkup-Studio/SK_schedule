"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ATTENDANCE_STATUS } from "@/lib/constants";
import type { AttendanceStatusValue } from "@/lib/constants";
import { Check, X, HelpCircle } from "lucide-react";

const iconMap = {
  attend: Check,
  absent: X,
  undecided: HelpCircle,
} as const;

interface AttendanceButtonsProps {
  /** 現在の出欠ステータス（null=未回答） */
  currentStatus: AttendanceStatusValue | null;
  /** 出欠回答時のコールバック */
  onAnswer: (status: AttendanceStatusValue, reason?: string) => void;
  /** 回答期限を過ぎているか */
  isLocked?: boolean;
  /** コンパクト表示（カード埋め込み用） */
  compact?: boolean;
}

/** 出欠回答ボタン（○ × △） */
export function AttendanceButtons({
  currentStatus,
  onAnswer,
  isLocked = false,
  compact = false,
}: AttendanceButtonsProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");
  const [isAnimating, setIsAnimating] = useState<AttendanceStatusValue | null>(null);

  const handleClick = (status: AttendanceStatusValue) => {
    if (isLocked) return;

    setIsAnimating(status);
    setTimeout(() => setIsAnimating(null), 300);

    if (status === "absent") {
      setShowReasonInput(true);
      onAnswer(status);
    } else {
      setShowReasonInput(false);
      setReason("");
      onAnswer(status);
    }
  };

  const handleReasonSubmit = () => {
    if (reason.trim()) {
      onAnswer("absent", reason.trim());
    }
    setShowReasonInput(false);
  };

  const buttonConfigs = [
    {
      status: "attend" as AttendanceStatusValue,
      icon: "○",
      label: "参加",
      activeClass: "bg-attend text-white shadow-lg shadow-attend/30 scale-105",
      hoverClass: "hover:bg-green-50 hover:border-attend hover:text-attend",
      ringClass: "ring-attend/30",
    },
    {
      status: "absent" as AttendanceStatusValue,
      icon: "×",
      label: "欠席",
      activeClass: "bg-absent text-white shadow-lg shadow-absent/30 scale-105",
      hoverClass: "hover:bg-red-50 hover:border-absent hover:text-absent",
      ringClass: "ring-absent/30",
    },
    {
      status: "undecided" as AttendanceStatusValue,
      icon: "△",
      label: "未定",
      activeClass: "bg-undecided text-white shadow-lg shadow-undecided/30 scale-105",
      hoverClass: "hover:bg-amber-50 hover:border-undecided hover:text-undecided",
      ringClass: "ring-undecided/30",
    },
  ];

  if (isLocked) {
    const current = buttonConfigs.find((b) => b.status === currentStatus);
    return (
      <div className="text-center">
        {current ? (
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold",
            current.activeClass.replace("scale-105", "")
          )}>
            <span className="text-lg">{current.icon}</span>
            {current.label}
          </div>
        ) : (
          <span className="text-sm text-muted">回答期限を過ぎています</span>
        )}
        <p className="text-[10px] text-muted mt-1">🔒 回答変更はできません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ボタングループ */}
      <div className={cn("grid grid-cols-3 gap-2", compact ? "gap-1.5" : "gap-3")}>
        {buttonConfigs.map((config) => {
          const isActive = currentStatus === config.status;
          const isAnimatingThis = isAnimating === config.status;

          return (
            <button
              key={config.status}
              type="button"
              onClick={() => handleClick(config.status)}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl border-2 font-bold transition-all duration-200",
                compact ? "py-3 px-2" : "py-4 px-3",
                isActive
                  ? config.activeClass
                  : cn("border-border bg-white text-muted", config.hoverClass),
                isAnimatingThis && "animate-bounce",
                "active:scale-95 focus:outline-none focus:ring-4",
                config.ringClass
              )}
              style={{ minHeight: compact ? "64px" : "80px" }}
            >
              <span className={cn("font-black", compact ? "text-2xl" : "text-3xl")}>
                {config.icon}
              </span>
              <span className={cn("mt-0.5", compact ? "text-[10px]" : "text-xs")}>
                {config.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 欠席理由入力 */}
      {showReasonInput && currentStatus === "absent" && (
        <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 space-y-2 animate-fade-in-up">
          <label className="text-xs font-bold text-absent flex items-center gap-1">
            <X className="w-3 h-3" />
            欠席理由（任意）
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例: 塾のため"
              className="flex-1 px-3 py-2 rounded-lg border border-red-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-absent/30 focus:border-absent transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={handleReasonSubmit}
              className="px-4 py-2 bg-absent text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors active:scale-95"
            >
              送信
            </button>
          </div>
        </div>
      )}

      {/* 回答済みメッセージ */}
      {currentStatus && (
        <p className="text-center text-[11px] text-muted">
          ✓ 回答済み（タップで変更できます）
        </p>
      )}
    </div>
  );
}
