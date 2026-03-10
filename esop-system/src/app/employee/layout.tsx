export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* 员工视图头部 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">我的权益</h1>
            <p className="text-gray-500">查看您的股权激励详情</p>
          </div>
        </div>
      </div>
      
      {children}
    </div>
  )
}