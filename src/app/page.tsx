"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // クライアントサイドでダッシュボードへ遷移
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent flex-shrink-0 animate-spin rounded-full"></div>
    </div>
  );
}
