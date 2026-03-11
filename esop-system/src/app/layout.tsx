import type { Metadata } from "next";
import "./globals.css";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "股权激励系统 | ESOP System",
  description: "公司股权激励计划管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50">
        <div className="min-h-screen">
          <NavBar />
          <main className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}