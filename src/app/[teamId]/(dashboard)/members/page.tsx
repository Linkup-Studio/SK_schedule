"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Users, Minus, Plus, Settings, Megaphone, Trash2, Loader2, Pencil } from "lucide-react";
import { GRADES } from "@/lib/constants";
import { useTeam } from "@/components/team/team-provider";
import { useTeamLink } from "@/hooks/use-team-link";
import { fetchAnnouncements, deleteAnnouncement, cleanupOldAnnouncements, fetchPlayerCounts, updatePlayerCounts } from "@/lib/supabase-data";
import type { Announcement } from "@/lib/types";

export default function AdminMenuPage() {
  const router = useRouter();
  const { teamSlug } = useTeam();
  const teamLink = useTeamLink();
  const storageKey = `${teamSlug}_admin`;

  const [isAdmin, setIsAdmin] = useState(false);
  const [counts, setCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  useEffect(() => {
    const admin = localStorage.getItem(storageKey) === "true";
    if (!admin) { router.replace(teamLink("/dashboard")); return; }
    setIsAdmin(true);

    fetchPlayerCounts(teamSlug).then((saved) => {
      if (Object.keys(saved).length > 0) {
        const parsed: Record<number, number> = {};
        for (const [k, v] of Object.entries(saved)) parsed[Number(k)] = v;
        setCounts(parsed);
      }
    });

    loadAnnouncements();
  }, [router, storageKey, teamSlug, teamLink]);

  async function loadAnnouncements() {
    setLoadingAnnouncements(true);
    await cleanupOldAnnouncements(teamSlug);
    const data = await fetchAnnouncements(teamSlug);
    setAnnouncements(data);
    setLoadingAnnouncements(false);
  }

  const updateCount = (grade: number, delta: number) => {
    setCounts(prev => {
      const next = { ...prev, [grade]: Math.max(0, (prev[grade] ?? 0) + delta) };
      updatePlayerCounts(teamSlug, next);
      return next;
    });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("本当にこのお知らせを削除しますか？\n（この操作は取り消せません）")) return;
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    const success = await deleteAnnouncement(id);
    if (!success) { alert("削除に失敗しました。"); loadAnnouncements(); }
  };

  if (!isAdmin) return null;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="px-4 py-4 space-y-6 pb-24">
      <Link href={teamLink("/dashboard")} className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2">
        <ArrowLeft className="w-4 h-4" />ホームに戻る
      </Link>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center"><Settings className="w-4 h-4 text-white" /></div>
        <h1 className="font-black text-xl">管理者メニュー</h1>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-base flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" />選手人数の設定</h2>
          <span className="text-[12px] font-bold text-primary bg-primary-50 px-2.5 py-1 rounded-lg border border-primary/20">合計 {total}名</span>
        </div>
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border/50">
          {GRADES.map((g) => (
            <div key={g.value} className="flex items-center justify-between px-4 py-4">
              <span className="font-black text-[15px]">{g.label}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => updateCount(g.value, -1)} className="w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center active:scale-90 transition-transform"><Minus className="w-4 h-4 text-muted" /></button>
                <span className="w-10 text-center font-black text-xl">{counts[g.value] ?? 0}</span>
                <button onClick={() => updateCount(g.value, 1)} className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center active:scale-90 transition-transform shadow-sm"><Plus className="w-4 h-4 text-white" /></button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted text-center leading-relaxed">※ 各学年の選手人数を設定すると、<br/>試合ごとの「未回答」人数が自動的に計算されます</p>
      </section>

      <section className="space-y-3 pt-4 border-t border-border/50">
        <h2 className="font-black text-base flex items-center gap-1.5"><Megaphone className="w-4 h-4 text-primary" />お知らせの管理</h2>
        <div className="space-y-2">
          {loadingAnnouncements ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
          ) : announcements.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border p-6 text-center shadow-sm"><p className="text-[12px] font-bold text-muted">お知らせはありません</p></div>
          ) : (
            announcements.map((ann) => (
              <div key={ann.id} className="bg-surface rounded-2xl border border-border p-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-black leading-snug truncate">{ann.title}</h3>
                    <p className="text-[10px] text-muted mt-1">{format(new Date(ann.createdAt), "yyyy/MM/dd HH:mm", { locale: ja })}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <Link href={teamLink(`/announcements/edit?id=${ann.id}`)} className="flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary rounded-xl font-bold text-[11px] active:scale-95 transition-transform"><Pencil className="w-3.5 h-3.5" />編集</Link>
                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="flex items-center gap-1 px-3 py-2 bg-error/10 text-error rounded-xl font-bold text-[11px] active:scale-95 transition-transform"><Trash2 className="w-3.5 h-3.5" />削除</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
