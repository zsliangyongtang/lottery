import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "抽奖",
  description: "新年抽奖活动",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
