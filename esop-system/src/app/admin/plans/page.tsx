'use client'

import { useEffect, useState } from 'react'
import { PlanType, Jurisdiction, PlanStatus } from '@prisma/client'

interface Plan {
  id: string
  title: string
  type: PlanType
  applicableJurisdiction: Jurisdiction
  poolSize: string
  status: PlanStatus
  effectiveDate: string
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/plans')
        const data = await res.json()
        if (Array.isArray(data)) {
          setPlans(data)
        }
      } catch (err) {
        console.error('Failed to fetch plans:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const typeLabels: Record<PlanType, string> = {
    RSU: 'RSU',
    OPTION: '期权',
    VIRTUAL_SHARE: '虚拟股权',
    LP_SHARE: 'LP份额',
  }

  const statusLabels: Record<PlanStatus, string> = {
    PENDING_APPROVAL: '审批中',
    APPROVED: '已通过',
    CLOSED: '已关闭',
  }

  const jurisdictionLabels: Record<Jurisdiction, string> = {
    HK: '香港',
    CN: '内地',
    OVERSEAS: '海外',
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
        <h1 className="text-2xl font-bold text-gray-900">激励计划</h1>
        <a 
          href="/admin/plans/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新建计划
        </a>
      </div>
      
      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-4">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部类型</option>
            <option value="RSU">RSU</option>
            <option value="OPTION">Option</option>
            <option value="VIRTUAL_SHARE">虚拟股权</option>
            <option value="LP_SHARE">LP份额</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="ACTIVE">生效中</option>
            <option value="CLOSED">已关闭</option>
          </select>
        </div>
      </div>
      
      {/* 计划列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">计划名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">法域</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">池规模</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  暂无激励计划，点击右上角"新建计划"开始创建
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{typeLabels[plan.type]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{jurisdictionLabels[plan.applicableJurisdiction]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.poolSize}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      plan.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      plan.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusLabels[plan.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a href={`/admin/plans/${plan.id}`} className="text-blue-600 hover:text-blue-800 mr-3">查看</a>
                    <a href={`/admin/plans/${plan.id}/edit`} className="text-gray-600 hover:text-gray-800">编辑</a>
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