import { Header, BottomNav } from "@/components/layout/navigation";
import { GlobalLock } from "@/components/auth/GlobalLock";
import { PullToRefresh } from "@/components/common/pull-to-refresh";

/** モバイル専用レイアウト */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalLock>
      <PullToRefresh />
      <Header />
      <main className="pb-nav overflow-x-clip">
        {children}
      </main>
      <BottomNav />
    </GlobalLock>
  );
}
