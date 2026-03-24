'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TaxEventType, TaxEventStatus, GrantStatus, PlanType } from '@prisma/client'

interface Grant {
  id: string
  quantity: string
  status: GrantStatus
  type: PlanType
  grantDate: string
  employee?: { id: string; name: string; employeeId: string }
  plan?: { id: string; title: string }
}

interface TaxEvent {
  id: string
  grantId: string
  eventType: TaxEventType
  triggerDate: string
  quantity: string
  taxableAmount: string | null
  taxAmount: string | null
  status: TaxEventStatus
  exportFileUrl: string | null
  importFileUrl: string | null
  createdAt: string
  updatedAt: string
  grant: Grant
}

const typeLabels: Record<TaxEventType, string> = {
  VESTING_TAX: '归属税务',
  EXERCISE_TAX: '行权税务',
}

const statusLabels: Record<TaxEventStatus, string> = {
  TRIGGERED: '已触发',
  DATA_EXPORTED: '数据已导出',
  DATA_IMPORTED: '数据已导入',
  TAX_CONFIRMED: '税务已确认',
  TAX_PAID: '税务已缴纳',
}

const statusColors: Record<TaxEventStatus, string> = {
  TRIGGERED: 'bg-yellow-100 text-yellow-800',
  DATA_EXPORTED: 'bg-blue-100 text-blue-800',
  DATA_IMPORTED: 'bg-purple-100 text-purple-800',
  TAX_CONFIRMED: 'bg-green-100 text-green-800',
  TAX_PAID: 'bg-gray-100 text-gray-800',
}

const grantStatusLabels: Record<GrantStatus, string> = {
  DRAFT: '草稿',
  GRANTED: '已授予',
  VESTING: '归属中',
  VESTED: '已归属',
  EXERCISED: '已行权',
  SETTLED: '已交割',
  CANCELLED: '已取消',
  FORFEITED: '已失效',
}

export default function TaxEventDetailPage() {
  const params = useParams()
  const [taxEvent, setTaxEvent] = useState<TaxEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<TaxEvent>>({})

  useEffect(() => {
    async function fetchTaxEvent() {
      try {
        const res = await fetch(`/api/tax-events/${params.id}`)
        const data = await res.json()
        if (data.id) {
          setTaxEvent(data)
          setEditData(data)
        }
      } catch (err) {
        console.error('Failed to fetch tax event:', err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchTaxEvent()
    }
  }, [params.id])

  const handleSave = async () => {
    if (!taxEvent) return
    try {
      const res = await fetch(`/api/tax-events/${taxEvent.id}`, {
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

  const handleStatusChange = async (newStatus: TaxEventStatus) => {
    if (!taxEvent) return
    try {
      const res = await fetch(`/api/tax-events/${taxEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        alert('状态更新成功！')
        window.location.reload()
      } else {
        const error = await res.json()
        alert('状态更新失败：' + (error.error || '未知错误'))
      }
    } catch (err) {
      alert('状态更新失败')
    }
  }

  // 获取下一个状态
  const getNextStatus = (currentStatus: TaxEventStatus): TaxEventStatus | null => {
    const statusFlow: TaxEventStatus[] = [
      'TRIGGERED',
      'DATA_EXPORTED',
      'DATA_IMPORTED',
      'TAX_CONFIRMED',
      'TAX_PAID',
    ]
    const currentIndex = statusFlow.indexOf(currentStatus)
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1]
    }
    return null
  }

  // 获取状态流转按钮文本
  const getStatusButtonText = (status: TaxEventStatus): string => {
    const buttonTexts: Record<TaxEventStatus, string> = {
      TRIGGERED: '导出数据',
      DATA_EXPORTED: '导入数据',
      DATA_IMPORTED: '确认税务',
      TAX_CONFIRMED: '标记已缴纳',
      TAX_PAID: '已完成',
    }
    return buttonTexts[status]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!taxEvent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">税务事件不存在</p>
      </div>
    )
  }

  const nextStatus = getNextStatus(taxEvent.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/tax-events" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">税务事件详情</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* 状态标签 */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {typeLabels[taxEvent.eventType]}
            </h2>
            <p className="text-sm text-gray-500 mt-1">事件ID: {taxEvent.id}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[taxEvent.status]}`}>
            {statusLabels[taxEvent.status]}
          </span>
        </div>

        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">事件类型</label>
            <p className="text-gray-900">{typeLabels[taxEvent.eventType]}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">触发日期</label>
            <p className="text-gray-900">{new Date(taxEvent.triggerDate).toLocaleDateString('zh-CN')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">涉及数量</label>
            <p className="text-gray-900">{taxEvent.quantity}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">应税金额</label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                value={editData.taxableAmount || ''}
                onChange={(e) => setEditData({ ...editData, taxableAmount: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{taxEvent.taxableAmount ? `¥${taxEvent.taxableAmount}` : '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">税额</label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                value={editData.taxAmount || ''}
                onChange={(e) => setEditData({ ...editData, taxAmount: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{taxEvent.taxAmount ? `¥${taxEvent.taxAmount}` : '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">状态</label>
            {isEditing ? (
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as TaxEventStatus })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="TRIGGERED">已触发</option>
                <option value="DATA_EXPORTED">数据已导出</option>
                <option value="DATA_IMPORTED">数据已导入</option>
                <option value="TAX_CONFIRMED">税务已确认</option>
                <option value="TAX_PAID">税务已缴纳</option>
              </select>
            ) : (
              <p className="text-gray-900">{statusLabels[taxEvent.status]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
            <p className="text-gray-900">{new Date(taxEvent.createdAt).toLocaleString('zh-CN')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">更新时间</label>
            <p className="text-gray-900">{new Date(taxEvent.updatedAt).toLocaleString('zh-CN')}</p>
          </div>
        </div>

        {/* 关联授予信息 */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">关联授予</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">授予ID</label>
              <a
                href={`/admin/grants/${taxEvent.grant.id}`}
                className="text-blue-600 hover:text-blue-800 font-mono"
              >
                {taxEvent.grant.id}
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">员工</label>
              <a
                href={`/admin/employees/${taxEvent.grant.employee?.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {taxEvent.grant.employee?.name || '-'} ({taxEvent.grant.employee?.employeeId || '-'})
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">计划</label>
              <p className="text-gray-900">{taxEvent.grant.plan?.title || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">授予状态</label>
              <p className="text-gray-900">{grantStatusLabels[taxEvent.grant.status]}</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/tax-events"
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
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                编辑
              </button>
              {nextStatus && (
                <button
                  onClick={() => handleStatusChange(nextStatus)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {getStatusButtonText(taxEvent.status)}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
