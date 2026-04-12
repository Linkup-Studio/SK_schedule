import { Header, BottomNav } from "@/components/layout/navigation";

/** モバイル専用レイアウト */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-[100dvh]">
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ（スクロール領域） */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-nav">
        {children}
      </main>

      {/* ボトムナビ */}
      <BottomNav />
    </div>
  );
}
