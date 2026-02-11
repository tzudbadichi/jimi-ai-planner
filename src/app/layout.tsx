import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jimi AI",
  description: "Your AI Life OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 'dir="rtl"' ensures correct layout for Hebrew interface
    <html lang="he" dir="rtl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}