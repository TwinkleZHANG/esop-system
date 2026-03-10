export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      {/* 侧边栏 */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        <nav className="space-y-1">
          <a href="/admin" className="block px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium">
            📊 概览
          </a>
          <a href="/admin/plans" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            📋 激励计划
          </a>
          <a href="/admin/employees" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            👥 员工档案
          </a>
          <a href="/admin/grants" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            📝 授予管理
          </a>
          <a href="/admin/tax-events" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            💰 税务事件
          </a>
          <a href="/admin/assets" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            🏦 资产管理
          </a>
          <a href="/admin/audit" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            📑 审计日志
          </a>
        </nav>
      </aside>
      
      {/* 主内容区 */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  )
}