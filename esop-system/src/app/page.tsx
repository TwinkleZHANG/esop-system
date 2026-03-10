export default function Home() {
  return (
    <div className="space-y-8">
      {/* 标题区 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          欢迎使用股权激励系统
        </h1>
        <p className="text-gray-600">
          管理 RSU、期权、虚拟股权等多种激励工具，支持多法域税务合规。
        </p>
      </div>

      {/* 快速入口 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-3xl mb-3">📋</div>
          <h3 className="font-semibold text-gray-900 mb-1">激励计划</h3>
          <p className="text-sm text-gray-500">管理 RSU、Option 等激励计划池</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-semibold text-gray-900 mb-1">员工档案</h3>
          <p className="text-sm text-gray-500">维护员工税务身份、法域信息</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-3xl mb-3">📝</div>
          <h3 className="font-semibold text-gray-900 mb-1">授予管理</h3>
          <p className="text-sm text-gray-500">创建授予、追踪归属状态</p>
        </div>
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">--</div>
          <div className="text-sm text-gray-500">激励计划</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">--</div>
          <div className="text-sm text-gray-500">在册员工</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-orange-600">--</div>
          <div className="text-sm text-gray-500">授予记录</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">--</div>
          <div className="text-sm text-gray-500">待处理税务</div>
        </div>
      </div>

      {/* 系统状态 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">系统状态</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">数据库连接</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">待配置</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">当前版本</span>
            <span className="text-gray-900 font-mono">v0.1.0-demo</span>
          </div>
        </div>
      </div>
    </div>
  );
}