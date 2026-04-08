'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { GrantStatus, PlanType, VestingStatus, TaxEventStatus, TaxEventType } from '@prisma/client'
import {
  statusLabels,
  statusColors,
  getAllowedTransitions,
  getStatusDescription,
} from '@/lib/state-machine/grant-state-machine'

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
  vestingYear: number | null
  cliffPeriod: number | null
  vestingFrequency: string | null
  status: GrantStatus
  type: PlanType
  createdAt: string
  updatedAt: string
  plan?: { title: string; type: PlanType }
  employee?: { name: string; employeeId: string }
  vestingEvents: VestingEvent[]
  taxEvents: TaxEvent[]
}

interface StatusLog {
  id: string
  preStatus: string
  postStatus: string
  timestamp: string
  operator: string
  operatorRole: string
  document?: string
}

interface AllowedTransition {
  value: GrantStatus
  label: string
}

const typeLabels: Record<PlanType, string> = {
  RSU: 'RSU',
  OPTION: '期权',
  VIRTUAL_SHARE: '虚拟股权',
  LP_SHARE: 'LP份额',
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

  // 状态机相关
  const [allowedTransitions, setAllowedTransitions] = useState<AllowedTransition[]>([])
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([])
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [targetStatus, setTargetStatus] = useState<GrantStatus | ''>('')
  const [statusDocument, setStatusDocument] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

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

  // 获取允许的状态流转和日志
  useEffect(() => {
    async function fetchStatusInfo() {
      if (!grant) return
      try {
        // 获取允许的状态流转
        const transitionsRes = await fetch(`/api/grants/${grant.id}/status`)
        if (transitionsRes.ok) {
          const transitionsData = await transitionsRes.json()
          setAllowedTransitions(transitionsData.allowedTransitions)
        }

        // 获取状态日志
        const logsRes = await fetch(`/api/grants/${grant.id}/logs`)
        if (logsRes.ok) {
          const logsData = await logsRes.json()
          setStatusLogs(logsData)
        }
      } catch (err) {
        console.error('Failed to fetch status info:', err)
      }
    }
    fetchStatusInfo()
  }, [grant])

  const handleSave = async () => {
    if (!grant) return
    try {
      const res = await fetch(`/api/grants/${grant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: editData.quantity,
          strikePrice: editData.strikePrice,
          grantDate: editData.grantDate,
          vestingStartDate: editData.vestingStartDate,
          vestingYear: editData.vestingYear,
          cliffPeriod: editData.cliffPeriod,
          vestingFrequency: editData.vestingFrequency,
          status: editData.status,
        }),
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

  // 状态变更处理
  const handleStatusChange = async () => {
    if (!grant || !targetStatus) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/grants/${grant.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          document: statusDocument,
          operator: 'admin',
        }),
      })
      if (res.ok) {
        alert('状态变更成功！')
        setShowStatusModal(false)
        setTargetStatus('')
        setStatusDocument('')
        window.location.reload()
      } else {
        const error = await res.json()
        alert('状态变更失败：' + (error.error || '未知错误'))
      }
    } catch (err) {
      alert('状态变更失败')
    } finally {
      setUpdatingStatus(false)
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
              <p className="text-gray-900">{grant.strikePrice ? `HKD ${grant.strikePrice}` : '-'}</p>
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
            <label className="block text-sm font-medium text-gray-500 mb-1">状态</label>
            <p className="text-gray-900">{statusLabels[grant.status]}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
            <p className="text-gray-900">{new Date(grant.createdAt).toLocaleString('zh-CN')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">归属年限 (Vesting_Year)</label>
            {isEditing ? (
              <select
                value={editData.vestingYear ?? grant.vestingYear ?? ''}
                onChange={(e) => setEditData({ ...editData, vestingYear: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">未设置</option>
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
                <option value="4">4年</option>
                <option value="5">5年</option>
              </select>
            ) : (
              <p className="text-gray-900">{grant.vestingYear ? `${grant.vestingYear}年` : '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">悬崖期 (Cliff_Period)</label>
            {isEditing ? (
              <select
                value={editData.cliffPeriod ?? grant.cliffPeriod ?? ''}
                onChange={(e) => setEditData({ ...editData, cliffPeriod: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="0">无悬崖期</option>
                <option value="6">6个月</option>
                <option value="12">1年</option>
                <option value="18">1.5年</option>
                <option value="24">2年</option>
              </select>
            ) : (
              <p className="text-gray-900">
                {grant.cliffPeriod === 0 ? '无悬崖期' : grant.cliffPeriod ? `${grant.cliffPeriod}个月` : '-'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">归属频率 (Vesting_Frequency)</label>
            {isEditing ? (
              <select
                value={editData.vestingFrequency ?? grant.vestingFrequency ?? ''}
                onChange={(e) => setEditData({ ...editData, vestingFrequency: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">未设置</option>
                <option value="MONTHLY">按月 (Monthly)</option>
                <option value="YEARLY">按年 (Yearly)</option>
              </select>
            ) : (
              <p className="text-gray-900">
                {grant.vestingFrequency === 'MONTHLY' ? '按月 (Monthly)' : grant.vestingFrequency === 'YEARLY' ? '按年 (Yearly)' : '-'}
              </p>
            )}
          </div>
        </div>

        {/* 归属预览 */}
        {grant.vestingYear && grant.quantity && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">归属预览</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>总授予：{parseFloat(grant.quantity).toLocaleString()} 股</p>
              <p>
                归属期限：{grant.vestingYear}年
                {grant.cliffPeriod && grant.cliffPeriod > 0 ? `（含${grant.cliffPeriod}个月悬崖期）` : ''}
              </p>
              <p>
                归属频率：{grant.vestingFrequency === 'MONTHLY' ? '按月' : grant.vestingFrequency === 'YEARLY' ? '按年' : '-'}
              </p>
              {(() => {
                const startDateStr = grant.vestingStartDate || grant.grantDate
                if (startDateStr && grant.vestingYear) {
                  const startDate = new Date(startDateStr)
                  const endDate = new Date(startDate)
                  endDate.setFullYear(endDate.getFullYear() + grant.vestingYear)
                  return <p>归属结束日期：{endDate.toLocaleDateString('zh-CN')}</p>
                }
                return null
              })()}
              {grant.cliffPeriod && grant.cliffPeriod > 0 && grant.vestingYear && (
                <p>
                  悬崖期归属：
                  {Math.floor(
                    parseFloat(grant.quantity) *
                      (grant.cliffPeriod / 12 / grant.vestingYear)
                  ).toLocaleString()}{' '}
                  股
                </p>
              )}
            </div>
          </div>
        )}

        {/* 归属事件 */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">归属计划</h3>
          {grant.status === 'DRAFT' ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                当前为草稿状态，归属计划将在状态变更为「已授予」后正式生成。请在上方归属预览中确认归属参数。
              </p>
            </div>
          ) : grant.vestingEvents.length === 0 ? (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
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
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={`/admin/tax-events/${event.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        查看
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 状态流转 */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">状态机管理</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm text-gray-500">当前状态:</span>
                <span className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${statusColors[grant.status]}`}>
                  {statusLabels[grant.status]}
                </span>
                <p className="text-xs text-gray-500 mt-1">{getStatusDescription(grant.status)}</p>
              </div>
              {allowedTransitions.length > 0 && (
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  状态变更
                </button>
              )}
            </div>

            {allowedTransitions.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">可流转至:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allowedTransitions.map((t) => (
                    <span
                      key={t.value}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 状态变更日志 */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">状态变更日志</h3>
          {statusLogs.length === 0 ? (
            <p className="text-gray-500">暂无状态变更记录</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">变更</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作者</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">依据文件</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statusLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-gray-500">{statusLabels[log.preStatus as GrantStatus]}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{statusLabels[log.postStatus as GrantStatus]}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {log.operator} ({log.operatorRole})
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {log.document || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 状态变更弹窗 */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">状态变更</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    当前状态
                  </label>
                  <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                    {statusLabels[grant.status]}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目标状态 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as GrantStatus)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">请选择目标状态</option>
                    {allowedTransitions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    法律/财务依据文件
                  </label>
                  <input
                    type="text"
                    value={statusDocument}
                    onChange={(e) => setStatusDocument(e.target.value)}
                    placeholder="如: 协议编号、董事会决议编号"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowStatusModal(false)
                    setTargetStatus('')
                    setStatusDocument('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={!targetStatus || updatingStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingStatus ? '处理中...' : '确认变更'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/grants"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </a>

          {grant.status === 'DRAFT' && (
            isEditing ? (
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
            )
          )}
        </div>
      </div>
    </div>
  )
}
