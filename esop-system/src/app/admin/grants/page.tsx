'use client'

import { useEffect, useState } from 'react'
import { PlanType, GrantStatus } from '@prisma/client'

interface Grant {
  id: string
  planId: string
  employeeId: string
  quantity: string
  strikePrice: string | null
  grantDate: string
  status: GrantStatus
  type: PlanType
  plan?: { title: string }
  employee?: { name: string; employeeId: string }
}

export default function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGrants() {
      try {
        const res = await fetch('/api/grants')
        const data = await res.json()
        if (Array.isArray(data)) {
          setGrants(data)
        }
      } catch (err) {
        console.error('Failed to fetch grants:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGrants()
  }, [])

  const typeLabels: Record<PlanType, string> = {
    RSU: 'RSU',
    OPTION: '期权',
    VIRTUAL_SHARE: '虚拟股权',
    LP_SHARE: 'LP份额',
  }

  const statusLabels: Record<GrantStatus, string> = {
    DRAFT: '草稿',
    GRANTED: '已授予',
    VESTING: '归属中',
    VESTED: '已归属',
    EXERCISED: '已行权',
    SETTLED: '已交割',
    CANCELLED: '已取消',
    FORFEITED: '已失效',
  }

  const statusColors: Record<GrantStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    GRANTED: 'bg-blue-100 text-blue-800',
    VESTING: 'bg-orange-100 text-orange-800',
    VESTED: 'bg-green-100 text-green-800',
    EXERCISED: 'bg-purple-100 text-purple-800',
    SETTLED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
    FORFEITED: 'bg-red-100 text-red-800',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">授予管理</h1>
        <a 
          href="/admin/grants/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 创建授予
        </a>
      </div>
      
      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索员工..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部类型</option>
            <option value="RSU">RSU</option>
            <option value="OPTION">Option</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="GRANTED">已授予</option>
            <option value="VESTING">归属中</option>
            <option value="VESTED">已归属</option>
            <option value="SETTLED">已交割</option>
          </select>
        </div>
      </div>
      
      {/* 授予列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">员工</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">计划</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">授予数量</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">授予日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {grants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  暂无授予记录，点击右上角"创建授予"开始
                </td>
              </tr>
            ) : (
              grants.map((grant) => (
                <tr key={grant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {grant.employee?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grant.plan?.title || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{typeLabels[grant.type]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grant.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(grant.grantDate).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[grant.status]}`}>
                      {statusLabels[grant.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a href={`/admin/grants/${grant.id}`} className="text-blue-600 hover:text-blue-800 mr-3">查看</a>
                    <a href={`/admin/grants/${grant.id}/edit`} className="text-gray-600 hover:text-gray-800">编辑</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}