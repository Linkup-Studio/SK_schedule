import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a237e",
};

export const metadata: Metadata = {
  title: "BallPark | 一色SKクラブ",
  description: "一色SKクラブの予定管理・出欠確認アプリ",
  appleWebApp: {
    capable: false,
    title: "BallPark",
  },
  formatDetection: {
    telephone: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${inter.variable} antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="BallPark" />
      </head>
      <body>{children}</body>
    </html>
  );
}
