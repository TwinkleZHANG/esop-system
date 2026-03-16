'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PlanType, Jurisdiction, PlanStatus } from '@prisma/client'
import { useUserRole } from '@/components/RoleSwitcher'

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
  const role = useUserRole()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Plan>>({})

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch(`/api/plans/${params.id}`)
        const data = await res.json()
        if (data.id) {
          setPlan(data)
          setEditData(data)
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

  const handleApprove = async () => {
    if (!plan) return
    try {
      const res = await fetch(`/api/plans/${plan.id}/approve`, { method: 'POST' })
      if (res.ok) {
        alert('审批通过！')
        window.location.reload()
      } else {
        alert('审批失败')
      }
    } catch (err) {
      alert('审批失败')
    }
  }

  const handleSave = async () => {
    if (!plan) return
    try {
      const res = await fetch(`/api/plans/${plan.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      if (res.ok) {
        alert('保存成功！')
        setIsEditing(false)
        window.location.reload()
      } else {
        const error = await res.json()
        alert('保存失败：' + (error.error || '未知错误'))
      }
    } catch (err) {
      alert('保存失败')
    }
  }

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

  // 权限判断
  const canApprove = role === 'ADMIN_APPROVE' && plan.status === 'PENDING_APPROVAL'
  const canEdit = role === 'ADMIN_CREATE' && plan.status === 'PENDING_APPROVAL'

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
            {isEditing ? (
              <select
                value={editData.type}
                onChange={(e) => setEditData({ ...editData, type: e.target.value as PlanType })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="RSU">RSU</option>
                <option value="OPTION">期权</option>
                <option value="VIRTUAL_SHARE">虚拟股权</option>
                <option value="LP_SHARE">LP份额</option>
              </select>
            ) : (
              <p className="text-gray-900">{typeLabels[plan.type]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">适用法域</label>
            {isEditing ? (
              <select
                value={editData.applicableJurisdiction}
                onChange={(e) => setEditData({ ...editData, applicableJurisdiction: e.target.value as Jurisdiction })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="HK">香港</option>
                <option value="CN">内地</option>
                <option value="OVERSEAS">海外</option>
              </select>
            ) : (
              <p className="text-gray-900">{jurisdictionLabels[plan.applicableJurisdiction]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">交割方式</label>
            {isEditing ? (
              <div className="flex gap-4">
                {['实股', 'LP份额', '现金'].map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.settlementMethod?.includes(method) || false}
                      onChange={(e) => {
                        const current = editData.settlementMethod || []
                        if (e.target.checked) {
                          setEditData({ ...editData, settlementMethod: [...current, method] })
                        } else {
                          setEditData({ ...editData, settlementMethod: current.filter(m => m !== method) })
                        }
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-900">{plan.settlementMethod?.join('、') || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">激励池规模</label>
            {isEditing ? (
              <input
                type="number"
                value={editData.poolSize}
                onChange={(e) => setEditData({ ...editData, poolSize: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{plan.poolSize} 股</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">生效日期</label>
            {isEditing ? (
              <input
                type="date"
                value={editData.effectiveDate?.split('T')[0]}
                onChange={(e) => setEditData({ ...editData, effectiveDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{new Date(plan.effectiveDate).toLocaleDateString('zh-CN')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">董事会决议文件编号</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.boardApprovalId || ''}
                onChange={(e) => setEditData({ ...editData, boardApprovalId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{plan.boardApprovalId || '-'}</p>
            )}
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
          
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  编辑
                </button>
              )}
              {canApprove && (
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  审批通过
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}