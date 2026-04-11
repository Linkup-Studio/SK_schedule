import { redirect } from "next/navigation";

/** ルートページ - ダッシュボードへリダイレクト */
export default function Home() {
  redirect("/dashboard");
}
