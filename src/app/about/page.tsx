import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SKアプリ（teamnote）について",
  description: "一色SKクラブの予定と出欠を共有するアプリ。スタッフ出欠を送ったあと、その日の予定を自分のGoogleカレンダーに追加できます。",
  // Googleの審査で参照される公開ページなので、ここだけ検索に載せてよい（2026-10-07）
  robots: { index: true, follow: true },
};

/** アプリのホームページ（Googleの同意画面・審査から参照。合言葉なしで見られる説明ページ） */
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5 text-[15px] leading-relaxed">
        <h1 className="text-xl font-black">SKアプリ（teamnote）</h1>
        <p>一色SKクラブの予定と出欠を、選手の保護者・スタッフで共有するためのアプリです。チームの関係者だけが、チームの合言葉で入って使います。</p>

        <section className="space-y-2">
          <h2 className="text-lg font-black">できること</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>練習・試合の予定の確認</li>
            <li>試合ごとの出欠の回答（保護者）</li>
            <li>日付ごとの午前・午後の出欠の回答（スタッフ）</li>
            <li>チームからのお知らせの確認</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black">Googleカレンダー連携</h2>
          <p>スタッフが出欠を送ったあと「Googleカレンダーに追加」を押すと、その日の予定を、その方自身のGoogleカレンダーに1件追加します。押した時だけ動き、予定の追加以外のこと（読み取り・変更・削除）はしません。</p>
          <p>受け取る情報の扱いは、プライバシーポリシーに書いています。</p>
          <p>
            <a href="/privacy/" className="font-bold text-info underline">プライバシーポリシーを見る</a>
          </p>
        </section>

        <section className="space-y-2" lang="en">
          <h2 className="text-lg font-black">About (English)</h2>
          <p>teamnote (SK app) is a team scheduling and attendance app for the Isshiki SK Club, a youth baseball team in Japan. Team members sign in with a team passcode to view schedules and reply to attendance requests.</p>
          <p>Google Calendar integration: after a staff member submits their attendance for a day, they can tap &quot;Add to Google Calendar&quot;. The app then uses the calendar.events scope only to insert that single event into the user&apos;s own primary calendar. It does not read, modify, or delete any existing events, and the access token is used once in the browser and never stored.</p>
          <p>
            <a href="/privacy/" className="font-bold text-info underline">Privacy Policy</a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black">お問い合わせ</h2>
          <p>srs.hironori1422@gmail.com</p>
        </section>
      </div>
    </main>
  );
}
