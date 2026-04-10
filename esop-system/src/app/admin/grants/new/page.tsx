'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PlanType, GrantStatus } from '@prisma/client'

interface Employee {
  id: string
  employeeId: string
  name: string
  department: string | null
}

interface Plan {
  id: string
  title: string
  type: PlanType
}

interface HoldingEntity {
  id: string
  heId: string
  name: string
}

const planTypeLabels: Record<PlanType, string> = {
  RSU: 'RSU',
  OPTION: '期权',
  VIRTUAL_SHARE: '虚拟股权',
  LP_SHARE: 'LP份额',
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

// 搜索下拉框组件
function SearchableSelect({
  label,
  required,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  renderOption,
  getOptionValue,
  getOptionLabel,
  disabled = false,
}: {
  label: string
  required?: boolean
  options: any[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder: string
  renderOption?: (option: any) => React.ReactNode
  getOptionValue: (option: any) => string
  getOptionLabel: (option: any) => string
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedOption = options.find((o) => getOptionValue(o) === value)

  const filteredOptions = useMemo(() => {
    if (!search) return options
    const lowerSearch = search.toLowerCase()
    return options.filter((o) =>
      getOptionLabel(o).toLowerCase().includes(lowerSearch)
    )
  }, [options, search, getOptionLabel])

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-left flex justify-between items-center ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto">
            <div className="p-2 border-b">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                未找到匹配项
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={getOptionValue(option)}
                  type="button"
                  onClick={() => {
                    onChange(getOptionValue(option))
                    setIsOpen(false)
                    setSearch('')
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                >
                  {renderOption ? renderOption(option) : getOptionLabel(option)}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function NewGrantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [holdingEntities, setHoldingEntities] = useState<HoldingEntity[]>([])

  // 表单数据
  const [formData, setFormData] = useState({
    grantId: '',
    employeeId: '',
    planId: '',
    holdingEntityId: '',
    quantity: '',
    strikePrice: '',
    grantDate: '',
    vestingStartDate: '',
    vestingYear: '4',
    cliffPeriod: '12',
    vestingFrequency: 'MONTHLY',
    grantAgreementId: '',
    status: 'DRAFT' as GrantStatus,
  })

  // 加载数据
  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, planRes, heRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/plans'),
          fetch('/api/holding-entities'),
        ])

        if (empRes.ok) {
          const empData = await empRes.json()
          setEmployees(empData.filter((e: Employee) => e))
        }
        if (planRes.ok) {
          const planData = await planRes.json()
          setPlans(planData.filter((p: Plan) => p))
        }
        if (heRes.ok) {
          const heData = await heRes.json()
          setHoldingEntities(heData.filter((h: HoldingEntity) => h))
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      }
    }
    fetchData()

    // 自动生成Grant_ID
    const timestamp = Date.now().toString(36).toUpperCase()
    setFormData((prev) => ({ ...prev, grantId: `G${timestamp}` }))
  }, [])

  // 获取选中的计划
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === formData.planId),
    [plans, formData.planId]
  )

  // 当计划改变时，自动设置行权价
  useEffect(() => {
    if (selectedPlan) {
      if (selectedPlan.type === 'OPTION') {
        // Option类型保留用户输入或设置默认值
        setFormData((prev) => ({
          ...prev,
          strikePrice: prev.strikePrice || '',
        }))
      } else {
        // RSU/LP_SHARE/VIRTUAL_SHARE 行权价为0
        setFormData((prev) => ({ ...prev, strikePrice: '0' }))
      }
    }
  }, [selectedPlan])

  // 计算归属结束日期
  const vestingEndDate = useMemo(() => {
    const startDateStr = formData.vestingStartDate || formData.grantDate
    if (!startDateStr || !formData.vestingYear) return null
    const startDate = new Date(startDateStr)
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + parseInt(formData.vestingYear))
    return endDate.toISOString().split('T')[0]
  }, [formData.grantDate, formData.vestingStartDate, formData.vestingYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const body = {
        grantId: formData.grantId,
        employeeId: formData.employeeId,
        planId: formData.planId,
        quantity: parseFloat(formData.quantity),
        strikePrice: formData.strikePrice ? parseFloat(formData.strikePrice) : null,
        grantDate: formData.grantDate,
        vestingStartDate: formData.vestingStartDate || formData.grantDate,
        vestingEndDate: vestingEndDate,
        vestingYear: formData.vestingYear,
        cliffPeriod: formData.cliffPeriod,
        vestingFrequency: formData.vestingFrequency,
        status: formData.status,
        type: selectedPlan?.type,
      }

      const res = await fetch('/api/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        alert('创建授予成功！')
        router.push('/admin/grants')
      } else {
        const error = await res.json()
        alert('创建失败：' + (error.error || '未知错误'))
      }
    } catch (err) {
      console.error('Failed to create grant:', err)
      alert('创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a
          href="/admin/grants"
          className="text-gray-500 hover:text-gray-700"
        >
          ← 返回
        </a>
        <h1 className="text-2xl font-bold text-gray-900">创建授予</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grant_ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                权利ID (Grant_ID)
              </label>
              <input
                type="text"
                value={formData.grantId}
                disabled
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">系统自动生成</p>
            </div>

            {/* 授予状态 - 只读 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                授予状态
              </label>
              <input
                type="text"
                value={grantStatusLabels[formData.status]}
                disabled
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">新创建授予默认为草稿状态</p>
            </div>

            {/* 选择员工 */}
            <SearchableSelect
              label="选择员工"
              required
              options={employees}
              value={formData.employeeId}
              onChange={(value) => setFormData({ ...formData, employeeId: value })}
              placeholder="请选择员工"
              searchPlaceholder="搜索员工ID或姓名..."
              getOptionValue={(e) => e.id}
              getOptionLabel={(e) => `${e.employeeId} - ${e.name}`}
              renderOption={(e) => (
                <div>
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-gray-500">
                    {e.employeeId} {e.department && `| ${e.department}`}
                  </div>
                </div>
              )}
            />

            {/* 选择计划 */}
            <SearchableSelect
              label="选择激励计划"
              required
              options={plans}
              value={formData.planId}
              onChange={(value) => setFormData({ ...formData, planId: value })}
              placeholder="请选择计划"
              searchPlaceholder="搜索计划名称..."
              getOptionValue={(p) => p.id}
              getOptionLabel={(p: Plan) => `${p.title} (${planTypeLabels[p.type]})`}
              renderOption={(p: Plan) => (
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-gray-500">
                    类型: {planTypeLabels[p.type]}
                  </div>
                </div>
              )}
            />

            {/* 持股实体 */}
            <SearchableSelect
              label="持股实体 (HE_ID)"
              options={holdingEntities}
              value={formData.holdingEntityId}
              onChange={(value) =>
                setFormData({ ...formData, holdingEntityId: value })
              }
              placeholder="请选择持股实体"
              searchPlaceholder="搜索实体ID或名称..."
              getOptionValue={(h) => h.id}
              getOptionLabel={(h) => `${h.heId} - ${h.name}`}
              renderOption={(h) => (
                <div>
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs text-gray-500">{h.heId}</div>
                </div>
              )}
            />

            {/* 授予日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                授予日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.grantDate}
                onChange={(e) =>
                  setFormData({ ...formData, grantDate: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* 归属开始日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                归属开始日期
              </label>
              {formData.vestingStartDate ? (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.vestingStartDate}
                    onChange={(e) =>
                      setFormData({ ...formData, vestingStartDate: e.target.value || '' })
                    }
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, vestingStartDate: '' })}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="清除，使用授予日期"
                  >
                    清除
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const defaultDate = formData.grantDate || new Date().toISOString().slice(0, 10)
                    setFormData({ ...formData, vestingStartDate: defaultDate })
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left text-gray-400 hover:border-gray-400"
                >
                  点击选择日期
                </button>
              )}
              <p className="text-xs text-gray-500 mt-1">
                留空则等于授予日期
              </p>
            </div>
          </div>
        </div>

        {/* 授予详情 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">授予详情</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 授予数量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                授予数量 <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10000"
                  required
                  min="0"
                  step="0.0001"
                />
                <span className="border border-l-0 border-gray-300 rounded-r-lg px-3 py-2 bg-gray-50 text-gray-500">
                  股
                </span>
              </div>
            </div>

            {/* 行权价 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                行权价 (Exercise_Price){' '}
                {selectedPlan?.type === 'OPTION' && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <div className="flex">
                <input
                  type="number"
                  step="0.0001"
                  value={formData.strikePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, strikePrice: e.target.value })
                  }
                  disabled={
                    !selectedPlan ||
                    (selectedPlan.type !== 'OPTION' &&
                      selectedPlan.type !== undefined)
                  }
                  className={`flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !selectedPlan || selectedPlan.type !== 'OPTION'
                      ? 'bg-gray-100'
                      : ''
                  }`}
                  placeholder={selectedPlan?.type === 'OPTION' ? '1.0000' : '0'}
                  required={selectedPlan?.type === 'OPTION'}
                />
                <span className="border border-l-0 border-gray-300 rounded-r-lg px-3 py-2 bg-gray-50 text-gray-500">
                  HKD
                </span>
              </div>
              {selectedPlan && selectedPlan.type !== 'OPTION' && (
                <p className="text-xs text-gray-500 mt-1">
                  {planTypeLabels[selectedPlan.type]} 行权价为0
                </p>
              )}
            </div>

            {/* 签署协议ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                员工签署协议ID (Grant_Agreement_ID)
              </label>
              <input
                type="text"
                value={formData.grantAgreementId}
                onChange={(e) =>
                  setFormData({ ...formData, grantAgreementId: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="AGR-2024-001"
              />
            </div>
          </div>
        </div>

        {/* 归属计划 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">归属计划</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 归属年限 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                归属年限 (Vesting_Year) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vestingYear}
                onChange={(e) =>
                  setFormData({ ...formData, vestingYear: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
                <option value="4">4年</option>
                <option value="5">5年</option>
              </select>
            </div>

            {/* 悬崖期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                悬崖期 (Cliff_Period) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.cliffPeriod}
                onChange={(e) =>
                  setFormData({ ...formData, cliffPeriod: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="0">无悬崖期</option>
                <option value="6">6个月</option>
                <option value="12">1年</option>
                <option value="18">1.5年</option>
                <option value="24">2年</option>
              </select>
            </div>

            {/* 归属频率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                归属频率 (Vesting_Frequency) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vestingFrequency}
                onChange={(e) =>
                  setFormData({ ...formData, vestingFrequency: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="MONTHLY">按月 (Monthly)</option>
                <option value="YEARLY">按年 (Yearly)</option>
              </select>
            </div>
          </div>

          {/* 归属预览 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">归属预览</h3>
            <div className="text-sm text-blue-800 space-y-1">
              {formData.grantDate && formData.quantity ? (
                <>
                  <p>总授予：{parseFloat(formData.quantity).toLocaleString()} 股</p>
                  <p>
                    归属期限：{formData.vestingYear}年
                    {parseInt(formData.cliffPeriod) > 0 &&
                      `（含${formData.cliffPeriod}个月悬崖期）`}
                  </p>
                  <p>
                    归属频率：
                    {formData.vestingFrequency === 'MONTHLY' ? '按月' : '按年'}
                  </p>
                  {vestingEndDate && (
                    <p>
                      归属结束日期：{new Date(vestingEndDate).toLocaleDateString('zh-CN')}
                    </p>
                  )}
                  {parseInt(formData.cliffPeriod) > 0 && formData.quantity && (
                    <p>
                      悬崖期归属：
                      {Math.floor(
                        parseFloat(formData.quantity) *
                          (parseInt(formData.cliffPeriod) / 12 / parseInt(formData.vestingYear))
                      ).toLocaleString()}{' '}
                      股
                    </p>
                  )}
                </>
              ) : (
                <p>请输入授予日期和数量以查看预览</p>
              )}
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-3">
          <a
            href="/admin/grants"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            取消
          </a>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '创建中...' : '创建授予'}
          </button>
        </div>
      </form>
    </div>
  )
}
