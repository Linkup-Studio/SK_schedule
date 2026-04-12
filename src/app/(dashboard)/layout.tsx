import { Header, BottomNav } from "@/components/layout/navigation";
import { GlobalLock } from "@/components/auth/GlobalLock";

/** モバイル専用レイアウト */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalLock>
      <Header />
      <main className="pb-nav overflow-x-hidden">
        {children}
      </main>
      <BottomNav />
    </GlobalLock>
  );
}
