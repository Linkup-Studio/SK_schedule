import { cn } from "@/lib/utils";
import { GAME_TYPES, ATTENDANCE_STATUS, GRADES } from "@/lib/constants";
import type { GameType, AttendanceStatusValue, GradeValue } from "@/lib/constants";

/** 試合種別バッジ */
export function GameTypeBadge({ type, size = "sm" }: { type: GameType; size?: "sm" | "md" }) {
  const config = GAME_TYPES.find((t) => t.value === type);
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-full whitespace-nowrap",
        `badge-${config.color}`,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      )}
    >
      {config.label}
    </span>
  );
}

/** 出欠ステータスバッジ */
export function AttendanceBadge({ status }: { status: AttendanceStatusValue }) {
  const config = ATTENDANCE_STATUS.find((s) => s.value === status);
  if (!config) return null;

  const colorClasses = {
    attend: "bg-green-50 text-attend border-green-200",
    absent: "bg-red-50 text-absent border-red-200",
    undecided: "bg-amber-50 text-undecided border-amber-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border",
        colorClasses[status]
      )}
    >
      <span className="text-sm">{config.icon}</span>
      {config.label}
    </span>
  );
}

/** 学年バッジ */
export function GradeBadge({ grade }: { grade: GradeValue }) {
  const config = GRADES.find((g) => g.value === grade);
  if (!config) return null;

  const colors = {
    1: "bg-blue-50 text-blue-700 border-blue-200",
    2: "bg-emerald-50 text-emerald-700 border-emerald-200",
    3: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border", colors[grade])}>
      {config.label}
    </span>
  );
}

/** 出欠サマリーバー */
export function AttendanceSummaryBar({
  attend,
  absent,
  undecided,
  noAnswer,
  total,
}: {
  attend: number;
  absent: number;
  undecided: number;
  noAnswer: number;
  total: number;
}) {
  if (total === 0) return null;

  const segments = [
    { count: attend, color: "bg-attend", label: "参加" },
    { count: absent, color: "bg-absent", label: "欠席" },
    { count: noAnswer, color: "bg-gray-300", label: "未回答" },
  ];

  return (
    <div className="space-y-2">
      {/* プログレスバー */}
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
        {segments.map((seg) =>
          seg.count > 0 ? (
            <div
              key={seg.label}
              className={cn("h-full transition-all duration-500", seg.color)}
              style={{ width: `${(seg.count / total) * 100}%` }}
            />
          ) : null
        )}
      </div>
      {/* ラベル */}
      <div className="flex flex-wrap gap-3 text-[11px]">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-full", seg.color)} />
            <span className="text-muted">{seg.label}</span>
            <span className="font-bold">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** スケルトンローダー */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/** エンプティステート */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted max-w-xs">{description}</p>}
    </div>
  );
}
