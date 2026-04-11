"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Minus, Plus } from "lucide-react";
import { GRADES } from "@/lib/constants";

/** 管理者専用 — 学年別人数設定ページ */
export default function MembersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [counts, setCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });

  useEffect(() => {
    const admin = localStorage.getItem("sk_admin") === "true";
    if (!admin) { router.replace("/dashboard"); return; }
    setIsAdmin(true);

    // 保存済みの人数を読み込む
    const saved = localStorage.getItem("sk_player_counts");
    if (saved) setCounts(JSON.parse(saved));
  }, [router]);

  const update = (grade: number, delta: number) => {
    setCounts(prev => {
      const next = { ...prev, [grade]: Math.max(0, (prev[grade] ?? 0) + delta) };
      localStorage.setItem("sk_player_counts", JSON.stringify(next));
      return next;
    });
  };

  if (!isAdmin) return null;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2">
        <ArrowLeft className="w-4 h-4" />ホームに戻る
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-black text-lg flex items-center gap-1.5">
          <Users className="w-5 h-5 text-primary" />
          選手人数
        </h1>
        <span className="text-[12px] font-bold text-primary bg-primary-50 px-2.5 py-1 rounded-lg border border-primary/20">
          合計 {total}名
        </span>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border/50">
        {GRADES.map((g) => (
          <div key={g.value} className="flex items-center justify-between px-4 py-4">
            <span className="font-black text-[15px]">{g.label}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => update(g.value, -1)}
                className="w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"
              >
                <Minus className="w-4 h-4 text-muted" />
              </button>
              <span className="w-10 text-center font-black text-xl">{counts[g.value] ?? 0}</span>
              <button
                onClick={() => update(g.value, 1)}
                className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center active:scale-90 transition-transform shadow-sm"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted text-center leading-relaxed">
        ※ 各学年の選手人数を設定すると、<br/>試合ごとの「未回答」人数が自動的に計算されます
      </p>
    </div>
  );
}
