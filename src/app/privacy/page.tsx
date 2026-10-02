import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | SKアプリ（teamnote）",
};

/** Googleの同意画面から参照するプライバシーポリシー（Googleカレンダー連携の扱いを明記） */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5 text-[15px] leading-relaxed">
        <h1 className="text-xl font-black">プライバシーポリシー</h1>
        <p>SKアプリ（teamnote）は、チームの予定と出欠を共有するためのアプリです。このページでは、Googleカレンダー連携で受け取る情報の扱いを説明します。</p>

        <section className="space-y-2">
          <h2 className="text-lg font-black">Googleカレンダー連携で行うこと</h2>
          <p>スタッフが出欠を送信したあと「Googleカレンダーに追加」を押した場合にだけ、その方のGoogleカレンダーに、その日の予定を1件追加します。</p>
          <p>Googleアカウントから受け取る権限は、カレンダーの予定に関するもの（calendar.events）だけです。このアプリが行うのは予定の追加のみで、既存の予定の読み取り・変更・削除は行いません。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black">保存しないもの</h2>
          <p>Googleから受け取る一時的な許可（アクセストークン）は、予定を追加するその場でだけ使い、サーバーにも端末にも保存しません。カレンダーの内容をこのアプリのサーバーに送ったり、保存したりすることはありません。</p>
          <p>Googleから受け取った情報を、第三者に販売・提供したり、広告に使ったりすることはありません。このアプリによるGoogle APIから受け取った情報の利用は、限定的使用の要件を含む Google API Services User Data Policy に従います。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black">連携をやめたいとき</h2>
          <p>Googleアカウントの「サードパーティ製のアプリとサービス」から、いつでもこのアプリへの許可を取り消せます。</p>
          <p>
            <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer" className="font-bold text-info underline">Googleアカウントの接続の管理を開く</a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black">お問い合わせ</h2>
          <p>srs.hironori1422@gmail.com</p>
        </section>

        <p className="text-[13px] text-muted">制定日：2026年10月2日</p>
      </div>
    </main>
  );
}
