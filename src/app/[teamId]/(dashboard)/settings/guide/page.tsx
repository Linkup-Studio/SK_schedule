"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Users, ShieldCheck } from "lucide-react";
import { useTeamLink } from "@/hooks/use-team-link";

export default function GuidePage() {
  const teamLink = useTeamLink();

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      <Link href={teamLink("/settings")} className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2">
        <ArrowLeft className="w-4 h-4" />設定に戻る
      </Link>

      <div className="flex items-center gap-1.5">
        <BookOpen className="w-5 h-5 text-primary" />
        <h1 className="font-black text-lg">使い方ガイド</h1>
      </div>

      <GuideSection
        title="保護者（選手）版"
        description="予定確認と選手の出欠回答に使います。スタッフ出欠は表示されません。"
        icon={<CalendarDays className="w-5 h-5 text-primary" />}
        items={[
          { title: "予定を見る", body: "下部メニューの「予定」からカレンダーを開き、確認したい日や予定を選びます。" },
          { title: "出欠を送る", body: "予定詳細で選手名を入力し、午前・午後それぞれの参加、欠席、未定を選んで送信します。" },
          { title: "回答を直す", body: "同じ選手名でもう一度送信すると、前回の回答を更新できます。" },
          { title: "連絡を見る", body: "下部メニューの「連絡」からチームのお知らせを確認できます。" },
        ]}
      />

      <GuideSection
        title="スタッフ版"
        description="スタッフPINで入室した端末だけ、スタッフ出欠を確認・回答できます。"
        icon={<Users className="w-5 h-5 text-info" />}
        items={[
          { title: "スタッフモードに入る", body: "設定画面でスタッフPINを入力します。一度入ると、30日間スタッフ出欠を見なかった場合だけ再入力が必要です。" },
          { title: "スタッフ出欠を見る", body: "予定詳細を開くと「この日のスタッフ出欠」が表示されます。保護者画面には表示されません。" },
          { title: "日ごとに回答する", body: "同じ日に予定が複数あっても、スタッフ出欠はその日の午前・午後で共通です。" },
          { title: "スタッフモードを終了する", body: "設定画面の「スタッフモードを終了する」から通常表示に戻せます。" },
        ]}
      />

      <GuideSection
        title="管理者版"
        description="代表者と開発者だけが使う編集モードです。"
        icon={<ShieldCheck className="w-5 h-5 text-success" />}
        items={[
          { title: "管理者モードに入る", body: "画面上部のチームロゴを5回タップし、代表者パスコードを入力します。" },
          { title: "予定を登録する", body: "管理者モードになると下部に「予定登録」ボタンが表示されます。" },
          { title: "予定を編集する", body: "予定詳細から編集できます。公式戦、練習試合、練習、休日、その他を選べます。" },
        ]}
      />
    </div>
  );
}

function GuideSection({
  title,
  description,
  icon,
  items,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: { title: string; body: string }[];
}) {
  return (
    <section className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 text-primary mb-2">
          {icon}
          <h2 className="font-black text-[15px]">{title}</h2>
        </div>
        <p className="text-[12px] leading-relaxed text-muted">{description}</p>
      </div>
      <div className="divide-y divide-border/50">
        {items.map((item) => (
          <div key={item.title} className="flex gap-3 px-4 py-3.5">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-[13px]">{item.title}</h3>
              <p className="text-[12px] leading-relaxed text-muted">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
