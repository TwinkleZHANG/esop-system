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
              <div className="flex items-center gap-6">
                <div className="flex gap-6 text-sm">
                  <a href="/" className="text-gray-600 hover:text-gray-900">首页</a>
                  <a href="/admin" className="text-gray-600 hover:text-gray-900">管理后台</a>
                  <a href="/employee" className="text-gray-600 hover:text-gray-900">员工视图</a>
                </div>
                {/* 角色切换器占位 - 客户端组件会在这里渲染 */}
                <div id="role-switcher" suppressHydrationWarning>
                  <noscript>
                    <span className="text-sm text-gray-500">👥 HR 管理员</span>
                  </noscript>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </main>
          {/* 客户端脚本：渲染角色切换器 */}
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              var roles = {
                HR: { label: 'HR 管理员', icon: '👥' },
                FINANCE: { label: '财务/税务', icon: '💰' },
                LEGAL: { label: '法务/合规', icon: '⚖️' },
                AUDITOR: { label: '审计', icon: '📑' },
                EMPLOYEE: { label: '员工', icon: '👤' }
              };
              var savedRole = localStorage.getItem('userRole') || 'HR';
              var roleInfo = roles[savedRole] || roles.HR;
              var container = document.getElementById('role-switcher');
              if (container) {
                container.innerHTML = '<button onclick="window.toggleRole && window.toggleRole()" class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"><span class="text-lg">' + roleInfo.icon + '</span><span class="text-sm font-medium text-gray-700">' + roleInfo.label + '</span><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button>';
              }
            })();
          `}} />
        </div>
      </body>
    </html>
  );
}