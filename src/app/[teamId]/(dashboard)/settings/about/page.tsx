"use client";

import Link from "next/link";
import { ArrowLeft, Info, CalendarDays, Users, ShieldCheck } from "lucide-react";
import { useTeam } from "@/components/team/team-provider";
import { useTeamLink } from "@/hooks/use-team-link";

export default function AboutPage() {
  const { team } = useTeam();
  const teamLink = useTeamLink();
  const teamName = team?.name ?? "チーム";

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      <Link href={teamLink("/settings")} className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2">
        <ArrowLeft className="w-4 h-4" />設定に戻る
      </Link>

      <div className="flex items-center gap-1.5">
        <Info className="w-5 h-5 text-primary" />
        <h1 className="font-black text-lg">アプリについて</h1>
      </div>

      <section className="bg-gradient-hero rounded-2xl p-5 text-white shadow-sm">
        <p className="text-[12px] font-bold text-primary-100 mb-1">TeamNote</p>
        <h2 className="text-xl font-black leading-tight">{teamName}の予定と出欠をまとめるアプリです</h2>
        <p className="text-[13px] leading-relaxed text-primary-100 mt-3">
          予定確認、出欠回答、連絡確認をスマホからすぐ行えるようにしています。
        </p>
      </section>

      <section className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <InfoRow icon={<CalendarDays className="w-5 h-5 text-primary" />} title="予定管理" body="公式戦、練習試合、練習、休日、その他の予定をカレンダーで確認できます。" />
        <InfoRow icon={<Users className="w-5 h-5 text-info" />} title="出欠確認" body="選手は予定ごと、スタッフは日ごとの午前・午後で出欠を登録できます。" />
        <InfoRow icon={<ShieldCheck className="w-5 h-5 text-success" />} title="表示の分離" body="保護者画面ではスタッフ出欠を表示しません。スタッフPINを入力した端末だけ、スタッフ出欠を確認できます。" />
      </section>

      <section className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-2">
        <h2 className="font-black text-[15px]">管理者モードについて</h2>
        <p className="text-[13px] leading-relaxed text-muted">
          チーム代表者と開発者だけが使う編集用モードです。トップのロゴを5回タップし、代表者パスコードを入力すると予定登録や編集ができます。
        </p>
      </section>
    </div>
  );
}

function InfoRow({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 px-4 py-4 border-b border-border/50 last:border-b-0">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="space-y-1">
        <h3 className="font-black text-[14px]">{title}</h3>
        <p className="text-[12px] leading-relaxed text-muted">{body}</p>
      </div>
    </div>
  );
}
