import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | SKアプリ（teamnote）",
  // Googleの審査で参照される公開ページなので、ここだけ検索に載せてよい（2026-10-07）
  robots: { index: true, follow: true },
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
          <p>スタッフまたは保護者が、出欠の画面やチームの予定から「Googleカレンダーに追加」を押した場合にだけ、その方ご本人のGoogleカレンダーに、その日の予定を1件追加します。</p>
          <p>Googleアカウントから受け取る権限は、カレンダーの予定に関するもの（calendar.events.owned）だけです。このアプリが行うのは予定の追加のみで、既存の予定の読み取り・変更・削除は行いません。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black">アクセスするGoogleユーザーデータ</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Googleが発行する一時的な許可（アクセストークン）：予定を1件追加するためだけに使います。</li>
            <li>ご本人の「メインのカレンダー」への予定の作成：チームの予定の名前・日付・開始と終了の時刻・場所・メモを書き込みます。</li>
            <li>作成した予定のリンク（Googleが返す1件分のURL）：完了画面の「Googleカレンダーで見る」に表示するためだけに使います。</li>
          </ul>
          <p>カレンダーの一覧、ほかの予定、メールアドレス、氏名、連絡先など、それ以外のGoogleユーザーデータにはアクセスしません。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black">Googleユーザーデータの共有・移転・開示</h2>
          <p>Googleから受け取ったデータを、第三者（チームの他のメンバーや他の保護者、運営者、広告事業者、データ販売事業者、AIの学習を含む）に共有・移転・開示することはありません。データはご本人の端末とGoogleの間だけでやり取りされ、このアプリのサーバーを通りません。</p>
          <p>法令に基づき開示が求められた場合を除き、販売・貸与・提供は行いません。このアプリによるGoogle APIから受け取った情報の利用は、限定的使用の要件を含む Google API Services User Data Policy に従います。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-black">データの保護</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Googleとの通信はすべて暗号化（HTTPS）されます。</li>
            <li>アクセストークンはサーバーにも端末にも保存しません。受け取った直後にブラウザのアドレス欄から消し、予定を追加し終えたら破棄します（有効期限は最長1時間）。</li>
            <li>求める権限は予定の作成に必要な最小のもの（calendar.events.owned）だけで、毎回ご本人がGoogleの画面で許可した時にだけ動きます。</li>
            <li>このアプリのデータベースには、Googleユーザーデータを一切保存しません。</li>
          </ul>
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

        <section className="space-y-2 border-t border-border pt-5" lang="en">
          <h2 className="text-lg font-black">English summary (Google user data)</h2>
          <p><b>Data accessed:</b> Only when a staff member or a parent taps &quot;Add to Google Calendar&quot; on an attendance screen or a team event, the app uses a short-lived OAuth access token (scope: calendar.events.owned) to create one event in the user&apos;s primary calendar (title, date, start/end time, location, notes of the team event). It receives only the link (htmlLink) of the event it created, to show &quot;Open in Google Calendar&quot;. It does not read, modify, or delete any other events, and does not access calendar lists, email address, name, or contacts.</p>
          <p><b>Data sharing:</b> Google user data is not shared, transferred, or disclosed to any third party (including other team members, the operator, advertisers, data brokers, or for AI/ML model training). Data flows only between the user&apos;s device and Google and never passes through our servers. Use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.</p>
          <p><b>Data protection:</b> All communication with Google uses HTTPS. The access token is never stored on our servers or on the device; it is removed from the address bar immediately and discarded after the event is created (valid for at most 1 hour). The app requests only the minimum scope needed and acts only after the user approves on Google&apos;s consent screen each time. No Google user data is stored in our database.</p>
          <p><b>Revoking access:</b> https://myaccount.google.com/connections ・ <b>Contact:</b> srs.hironori1422@gmail.com</p>
        </section>

        <p className="text-[13px] text-muted">制定日：2026年10月2日／改定日：2026年10月14日</p>
      </div>
    </main>
  );
}
