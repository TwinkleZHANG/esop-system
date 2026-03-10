import type { Metadata } from "next";
import "./globals.css";

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
          <nav className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="text-xl font-bold text-gray-900">
                📊 股权激励系统
              </div>
              <div className="flex gap-6 text-sm">
                <a href="/" className="text-gray-600 hover:text-gray-900">首页</a>
                <a href="/admin" className="text-gray-600 hover:text-gray-900">管理后台</a>
                <a href="/employee" className="text-gray-600 hover:text-gray-900">员工视图</a>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}