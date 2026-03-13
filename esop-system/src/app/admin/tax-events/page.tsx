'use client'

import { useEffect, useState } from 'react'
import { TaxEventType, TaxEventStatus } from '@prisma/client'

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
  grant?: { id: string; employee?: { name: string } }
}

export default function TaxEventsPage() {
  const [taxEvents, setTaxEvents] = useState<TaxEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTaxEvents() {
      try {
        const res = await fetch('/api/tax-events')
        const data = await res.json()
        if (Array.isArray(data)) {
          setTaxEvents(data)
        }
      } catch (err) {
        console.error('Failed to fetch tax events:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTaxEvents()
  }, [])

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
        <h1 className="text-2xl font-bold text-gray-900">税务事件</h1>
      </div>
      
      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-4">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部类型</option>
            <option value="VESTING_TAX">归属税务</option>
            <option value="EXERCISE_TAX">行权税务</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部状态</option>
            <option value="TRIGGERED">已触发</option>
            <option value="DATA_EXPORTED">数据已导出</option>
            <option value="DATA_IMPORTED">数据已导入</option>
            <option value="TAX_CONFIRMED">税务已确认</option>
            <option value="TAX_PAID">税务已缴纳</option>
          </select>
        </div>
      </div>
      
      {/* 税务事件列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">员工</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">触发日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">应税金额</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {taxEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  暂无税务事件
                </td>
              </tr>
            ) : (
              taxEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {event.grant?.employee?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{typeLabels[event.eventType]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.triggerDate).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.taxableAmount || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {statusLabels[event.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a href={`/admin/tax-events/${event.id}`} className="text-blue-600 hover:text-blue-800">查看</a>
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