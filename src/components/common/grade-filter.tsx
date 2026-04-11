"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { GRADES, GRADE_ALL_LABEL } from "@/lib/constants";
import type { GradeValue } from "@/lib/constants";

interface GradeFilterProps {
  value: GradeValue | null;
  onChange: (grade: GradeValue | null) => void;
}

/** 学年フィルタータブ */
export function GradeFilter({ value, onChange }: GradeFilterProps) {
  const options = [
    { value: null as GradeValue | null, label: GRADE_ALL_LABEL },
    ...GRADES.map((g) => ({ value: g.value as GradeValue | null, label: g.label })),
  ];

  return (
    <div className="flex bg-surface-variant rounded-xl p-1 gap-0.5">
      {options.map((option) => (
        <button
          key={option.label}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all min-w-[48px]",
            value === option.value
              ? "bg-primary text-on-primary shadow-md"
              : "text-muted hover:text-primary hover:bg-white/50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
