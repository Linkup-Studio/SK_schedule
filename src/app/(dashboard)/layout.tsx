import { Header, BottomNav } from "@/components/layout/navigation";

/** モバイル専用レイアウト */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="pb-nav overflow-x-hidden">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
