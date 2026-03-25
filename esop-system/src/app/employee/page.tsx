'use client'

import { useEffect, useState } from 'react'
import { ApplicationType, GrantStatus, PlanType, ApplicationStatus } from '@prisma/client'

// 状态标签映射
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
  VESTING: 'bg-yellow-100 text-yellow-800',
  VESTED: 'bg-green-100 text-green-800',
  EXERCISED: 'bg-purple-100 text-purple-800',
  SETTLED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FORFEITED: 'bg-red-100 text-red-800',
}

const applicationTypeLabels: Record<ApplicationType, string> = {
  EXERCISE: '行权',
  TRANSFER: '转让',
  DIVIDEND: '分红',
  REDEEM: '赎回',
}

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  PENDING: '待审批',
  APPROVED: '已批准',
  REJECTED: '已拒绝',
  CANCELLED: '已取消',
}

const applicationStatusColors: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

const planTypeLabels: Record<PlanType, string> = {
  RSU: '限制性股票',
  OPTION: '期权',
  VIRTUAL_SHARE: '虚拟股权',
  LP_SHARE: 'LP份额',
}

interface Employee {
  id: string
  employeeId: string
  name: string
  department: string | null
  legalIdentity: string
  taxJurisdiction: string
}

interface Grant {
  id: string
  plan: {
    title: string
    type: PlanType
  }
  quantity: string
  strikePrice: string | null
  grantDate: string
  vestingStartDate: string
  vestingEndDate: string | null
  status: GrantStatus
  vestingEvents: Array<{
    id: string
    vestDate: string
    quantity: string
    status: string
  }>
}

interface Application {
  id: string
  grant: {
    plan: {
      title: string
      type: PlanType
    }
  }
  type: ApplicationType
  quantity: string
  status: ApplicationStatus
  remark: string | null
  reviewRemark: string | null
  reviewedAt: string | null
  createdAt: string
}

interface TaxEvent {
  id: string
  eventType: string
  triggerDate: string
  quantity: string
  taxableAmount: string | null
  taxAmount: string | null
  status: string
  grant: {
    plan: {
      title: string
    }
  }
}

// 张三的 employeeId
const ZHANG_SAN_EMP_ID = 'EMP001'

export default function EmployeePage() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [grants, setGrants] = useState<Grant[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [taxEvents, setTaxEvents] = useState<TaxEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null)
  const [applyForm, setApplyForm] = useState({
    type: '' as ApplicationType | '',
    quantity: '',
    remark: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // 获取员工数据
  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, grantsRes, appsRes, taxRes] = await Promise.all([
          fetch(`/api/employee/me?employeeId=${ZHANG_SAN_EMP_ID}`),
          fetch(`/api/employee/grants?employeeId=${ZHANG_SAN_EMP_ID}`),
          fetch(`/api/applications/my?employeeId=${ZHANG_SAN_EMP_ID}`),
          fetch(`/api/employee/tax-events?employeeId=${ZHANG_SAN_EMP_ID}`),
        ])

        if (empRes.ok) setEmployee(await empRes.json())
        if (grantsRes.ok) setGrants(await grantsRes.json())
        if (appsRes.ok) setApplications(await appsRes.json())
        if (taxRes.ok) setTaxEvents(await taxRes.json())
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 计算权益概览
  const overview = {
    vested: grants
      .filter((g) => g.status === 'VESTED')
      .reduce((sum, g) => sum + parseFloat(g.quantity), 0),
    vesting: grants
      .filter((g) => g.status === 'VESTING')
      .reduce((sum, g) => sum + parseFloat(g.quantity), 0),
    exercisable: grants
      .filter((g) => g.status === 'VESTED' && g.plan.type === 'OPTION')
      .reduce((sum, g) => sum + parseFloat(g.quantity), 0),
    exercised: grants
      .filter((g) => g.status === 'EXERCISED')
      .reduce((sum, g) => sum + parseFloat(g.quantity), 0),
  }

  // 打开申请弹窗
  const openApplyModal = (grant: Grant) => {
    setSelectedGrant(grant)
    setApplyForm({
      type: grant.plan.type === 'OPTION' ? 'EXERCISE' : 'TRANSFER',
      quantity: grant.quantity,
      remark: '',
    })
    setShowApplyModal(true)
  }

  // 提交申请
  const handleSubmit = async () => {
    if (!selectedGrant || !applyForm.type) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantId: selectedGrant.id,
          employeeId: employee?.id,
          type: applyForm.type,
          quantity: applyForm.quantity,
          remark: applyForm.remark,
        }),
      })

      if (res.ok) {
        alert('申请提交成功！')
        setShowApplyModal(false)
        // 刷新申请列表
        const appsRes = await fetch(`/api/applications/my?employeeId=${ZHANG_SAN_EMP_ID}`)
        if (appsRes.ok) setApplications(await appsRes.json())
      } else {
        const error = await res.json()
        alert(error.error || '提交失败')
      }
    } catch (error) {
      alert('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 获取可申请的操作类型
  const getAvailableActions = (grant: Grant) => {
    if (grant.status !== 'VESTED') return []

    switch (grant.plan.type) {
      case 'OPTION':
        return [{ value: 'EXERCISE', label: '申请行权' }]
      case 'RSU':
        return [
          { value: 'TRANSFER', label: '申请转让' },
          { value: 'DIVIDEND', label: '申请分红' },
        ]
      case 'LP_SHARE':
      case 'VIRTUAL_SHARE':
        return [
          { value: 'TRANSFER', label: '申请转让' },
          { value: 'DIVIDEND', label: '申请分红' },
          { value: 'REDEEM', label: '申请赎回' },
        ]
      default:
        return []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 员工信息卡片 */}
      {employee && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{employee.name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                <span>员工ID: {employee.employeeId}</span>
                {employee.department && <span>部门: {employee.department}</span>}
                <span>法律身份: {employee.legalIdentity}</span>
                <span>税务居住地: {employee.taxJurisdiction}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 权益概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">已归属权益</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{overview.vested.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">股</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">归属中权益</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{overview.vesting.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">股</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">待行权权益</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{overview.exercisable.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">股</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">已行权权益</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{overview.exercised.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">股</p>
        </div>
      </div>

      {/* 授予记录 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">我的授予记录</h2>
        {grants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无授予记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">计划</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">类型</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">数量</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">行权价</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">授予日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {grants.map((grant) => {
                  const actions = getAvailableActions(grant)
                  return (
                    <tr key={grant.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{grant.plan.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{planTypeLabels[grant.plan.type]}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {parseFloat(grant.quantity).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">
                        {grant.strikePrice ? `¥${parseFloat(grant.strikePrice).toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(grant.grantDate).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[grant.status]}`}
                        >
                          {statusLabels[grant.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {actions.length > 0 && (
                          <button
                            onClick={() => openApplyModal(grant)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {actions[0].label}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 归属日历 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">归属日历</h2>
        {grants.filter((g) => g.vestingEvents.length > 0).length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无归属事件</div>
        ) : (
          <div className="space-y-4">
            {grants
              .flatMap((g) =>
                g.vestingEvents.map((e) => ({
                  ...e,
                  planTitle: g.plan.title,
                }))
              )
              .sort((a, b) => new Date(a.vestDate).getTime() - new Date(b.vestDate).getTime())
              .map((event) => (
                <div key={event.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{event.planTitle}</p>
                    <p className="text-sm text-gray-500">归属日期: {new Date(event.vestDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{parseFloat(event.quantity).toLocaleString()} 股</p>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        event.status === 'VESTED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {event.status === 'VESTED' ? '已归属' : '待归属'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 我的申请 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">我的申请</h2>
        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无申请记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">计划</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">申请类型</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">数量</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">申请时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">审批备注</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{app.grant.plan.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{applicationTypeLabels[app.type]}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {parseFloat(app.quantity).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          applicationStatusColors[app.status]
                        }`}
                      >
                        {applicationStatusLabels[app.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(app.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{app.reviewRemark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 税务记录 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">税务记录</h2>
        {taxEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无税务记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">计划</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">事件类型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">触发日期</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">数量</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">应税金额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">状态</th>
                </tr>
              </thead>
              <tbody>
                {taxEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{event.grant.plan.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {event.eventType === 'VESTING_TAX' ? '归属税务' : '行权税务'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(event.triggerDate).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {parseFloat(event.quantity).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {event.taxableAmount ? `¥${parseFloat(event.taxableAmount).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {event.status === 'TRIGGERED'
                          ? '已触发'
                          : event.status === 'TAX_PAID'
                            ? '已缴纳'
                            : event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="text-sm text-blue-700">
            <p>此页面为员工视图，您只能查看自己的股权激励信息。</p>
            <p className="mt-1">如需行权或其他操作，请点击对应授予记录的"申请"按钮。</p>
          </div>
        </div>
      </div>

      {/* 申请弹窗 */}
      {showApplyModal && selectedGrant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                提交申请 - {selectedGrant.plan.title}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">申请类型</label>
                  <select
                    value={applyForm.type}
                    onChange={(e) => setApplyForm({ ...applyForm, type: e.target.value as ApplicationType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getAvailableActions(selectedGrant).map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                  <input
                    type="number"
                    value={applyForm.quantity}
                    onChange={(e) => setApplyForm({ ...applyForm, quantity: e.target.value })}
                    max={selectedGrant.quantity}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    最大可申请: {parseFloat(selectedGrant.quantity).toLocaleString()} 股
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
                  <textarea
                    value={applyForm.remark}
                    onChange={(e) => setApplyForm({ ...applyForm, remark: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入备注信息..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !applyForm.type}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '提交申请'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
