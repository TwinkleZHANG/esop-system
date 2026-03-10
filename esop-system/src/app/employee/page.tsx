export default function EmployeePage() {
  return (
    <div className="space-y-6">
      {/* 权益概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">已归属权益</p>
          <p className="text-3xl font-bold text-green-600 mt-1">0</p>
          <p className="text-sm text-gray-400 mt-1">股</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">待归属权益</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">0</p>
          <p className="text-sm text-gray-400 mt-1">股</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">已行权权益</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">0</p>
          <p className="text-sm text-gray-400 mt-1">股</p>
        </div>
      </div>
      
      {/* 授予记录 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">我的授予记录</h2>
        <div className="text-center py-8 text-gray-500">
          暂无授予记录
        </div>
      </div>
      
      {/* 归属日历 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">归属日历</h2>
        <div className="text-center py-8 text-gray-500">
          暂无归属事件
        </div>
      </div>
      
      {/* 税务记录 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">税务记录</h2>
        <div className="text-center py-8 text-gray-500">
          暂无税务记录
        </div>
      </div>
      
      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="text-sm text-blue-700">
            <p>此页面为员工视图，您只能查看自己的股权激励信息。</p>
            <p className="mt-1">如有疑问，请联系 HR 部门。</p>
          </div>
        </div>
      </div>
    </div>
  )
}