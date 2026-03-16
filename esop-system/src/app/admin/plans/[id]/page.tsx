'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PlanType, Jurisdiction, PlanStatus } from '@prisma/client'

interface Plan {
  id: string
  title: string
  type: PlanType
  applicableJurisdiction: Jurisdiction
  settlementMethod: string[]
  poolSize: string
  effectiveDate: string
  boardApprovalId: string | null
  status: PlanStatus
  createdAt: string
  updatedAt: string
}

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

export default function PlanDetailPage() {
  const params = useParams()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch(`/api/plans/${params.id}`)
        const data = await res.json()
        if (data.id) {
          setPlan(data)
        }
      } catch (err) {
        console.error('Failed to fetch plan:', err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchPlan()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">计划不存在</p>
      </div>
    )
  }

  const statusColors: Record<PlanStatus, string> = {
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/plans" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">计划详情</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* 状态标签 */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{plan.title}</h2>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[plan.status]}`}>
            {statusLabels[plan.status]}
          </span>
        </div>

        {/* 计划信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">计划ID</label>
            <p className="text-gray-900 font-mono">{plan.id}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">激励类型</label>
            <p className="text-gray-900">{typeLabels[plan.type]}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">适用法域</label>
            <p className="text-gray-900">{jurisdictionLabels[plan.applicableJurisdiction]}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">交割方式</label>
            <p className="text-gray-900">{plan.settlementMethod?.join('、') || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">激励池规模</label>
            <p className="text-gray-900">{plan.poolSize} 股</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">生效日期</label>
            <p className="text-gray-900">{new Date(plan.effectiveDate).toLocaleDateString('zh-CN')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">董事会决议文件编号</label>
            <p className="text-gray-900">{plan.boardApprovalId || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
            <p className="text-gray-900">{new Date(plan.createdAt).toLocaleString('zh-CN')}</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/plans"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </a>
          {plan.status === 'PENDING_APPROVAL' && (
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/plans/${plan.id}/approve`, { method: 'POST' })
                  if (res.ok) {
                    alert('审批通过！')
                    window.location.reload()
                  }
                } catch (err) {
                  alert('审批失败')
                }
              }}
            >
              审批通过
            </button>
          )}
        </div>
      </div>
    </div>
  )
}