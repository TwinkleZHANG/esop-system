'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GrantStatus, PlanType, VestingStatus, TaxEventStatus, TaxEventType } from '@prisma/client'

interface VestingEvent {
  id: string
  vestDate: string
  quantity: string
  cumulativeQty: string
  status: VestingStatus
}

interface TaxEvent {
  id: string
  eventType: TaxEventType
  triggerDate: string
  quantity: string
  taxableAmount: string | null
  taxAmount: string | null
  status: TaxEventStatus
}

interface Grant {
  id: string
  planId: string
  employeeId: string
  quantity: string
  strikePrice: string | null
  grantDate: string
  vestingStartDate: string
  vestingEndDate: string | null
  status: GrantStatus
  type: PlanType
  createdAt: string
  updatedAt: string
  plan?: { title: string; type: PlanType }
  employee?: { name: string; employeeId: string }
  vestingEvents: VestingEvent[]
  taxEvents: TaxEvent[]
}

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

const vestingStatusLabels: Record<VestingStatus, string> = {
  PENDING: '待归属',
  VESTED: '已归属',
  CANCELLED: '已取消',
}

const taxEventTypeLabels: Record<TaxEventType, string> = {
  VESTING_TAX: '归属税务',
  EXERCISE_TAX: '行权税务',
}

const taxEventStatusLabels: Record<TaxEventStatus, string> = {
  TRIGGERED: '已触发',
  DATA_EXPORTED: '数据已导出',
  DATA_IMPORTED: '数据已导入',
  TAX_CONFIRMED: '税务已确认',
  TAX_PAID: '税款已缴纳',
}

export default function GrantDetailPage() {
  const params = useParams()
  const [grant, setGrant] = useState<Grant | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Grant>>({})

  useEffect(() => {
    async function fetchGrant() {
      try {
        const res = await fetch(`/api/grants/${params.id}`)
        const data = await res.json()
        if (data.id) {
          setGrant(data)
          setEditData(data)
        }
      } catch (err) {
        console.error('Failed to fetch grant:', err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchGrant()
    }
  }, [params.id])

  const handleSave = async () => {
    if (!grant) return
    try {
      const res = await fetch(`/api/grants/${grant.id}`, {
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

  if (!grant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">授予记录不存在</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/grants" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">授予详情</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* 状态标签 */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {grant.employee?.name || '-'} 的授予
            </h2>
            <p className="text-sm text-gray-500 mt-1">授予ID: {grant.id}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[grant.status]}`}>
            {statusLabels[grant.status]}
          </span>
        </div>

        {/* 授予信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">员工</label>
            <p className="text-gray-900">{grant.employee?.name || '-'} ({grant.employee?.employeeId || '-'})</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">激励计划</label>
            <p className="text-gray-900">{grant.plan?.title || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">授予类型</label>
            <p className="text-gray-900">{typeLabels[grant.type]}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">授予数量</label>
            {isEditing ? (
              <input
                type="number"
                value={editData.quantity || ''}
                onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{grant.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">行权价</label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                value={editData.strikePrice || ''}
                onChange={(e) => setEditData({ ...editData, strikePrice: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{grant.strikePrice ? `¥${grant.strikePrice}` : '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">授予日期</label>
            {isEditing ? (
              <input
                type="date"
                value={editData.grantDate?.split('T')[0] || ''}
                onChange={(e) => setEditData({ ...editData, grantDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{new Date(grant.grantDate).toLocaleDateString('zh-CN')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">归属开始日期</label>
            {isEditing ? (
              <input
                type="date"
                value={editData.vestingStartDate?.split('T')[0] || ''}
                onChange={(e) => setEditData({ ...editData, vestingStartDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{new Date(grant.vestingStartDate).toLocaleDateString('zh-CN')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">归属结束日期</label>
            {isEditing ? (
              <input
                type="date"
                value={editData.vestingEndDate?.split('T')[0] || ''}
                onChange={(e) => setEditData({ ...editData, vestingEndDate: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{grant.vestingEndDate ? new Date(grant.vestingEndDate).toLocaleDateString('zh-CN') : '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">状态</label>
            {isEditing ? (
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as GrantStatus })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="DRAFT">草稿</option>
                <option value="GRANTED">已授予</option>
                <option value="VESTING">归属中</option>
                <option value="VESTED">已归属</option>
                <option value="EXERCISED">已行权</option>
                <option value="SETTLED">已交割</option>
                <option value="CANCELLED">已取消</option>
                <option value="FORFEITED">已失效</option>
              </select>
            ) : (
              <p className="text-gray-900">{statusLabels[grant.status]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
            <p className="text-gray-900">{new Date(grant.createdAt).toLocaleString('zh-CN')}</p>
          </div>
        </div>

        {/* 归属事件 */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">归属计划</h3>
          {grant.vestingEvents.length === 0 ? (
            <p className="text-gray-500">暂无归属事件</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">归属日期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">本次数量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">累计数量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grant.vestingEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(event.vestDate).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{event.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{event.cumulativeQty}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.status === 'VESTED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {vestingStatusLabels[event.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 税务事件 */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">税务事件</h3>
          {grant.taxEvents.length === 0 ? (
            <p className="text-gray-500">暂无税务事件</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">事件类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">触发日期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">应税金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">税额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grant.taxEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{taxEventTypeLabels[event.eventType]}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(event.triggerDate).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{event.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {event.taxableAmount ? `¥${event.taxableAmount}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {event.taxAmount ? `¥${event.taxAmount}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {taxEventStatusLabels[event.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/grants"
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
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              编辑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
