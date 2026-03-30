'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AssetType, AccountStatus, AssetTxType } from '@prisma/client'

interface AssetTransaction {
  id: string
  trxId: string
  changeType: AssetTxType
  quantity: string
  costBasis: string | null
  balanceAfter: string
  tradeDate: string
}

interface AssetPosition {
  id: string
  accountId: string
  employeeId: string
  holdingEntityId: string | null
  assetType: AssetType
  currency: string
  avgCost: string | null
  status: AccountStatus
  employee?: { name: string; employeeId: string }
  holdingEntity?: { name: string }
  transactions: AssetTransaction[]
  totalBalance: number
}

const typeLabels: Record<AssetType, string> = {
  COMMON_SHARE: '普通股',
  PREFERRED_SHARE: '优先股',
  LP_SHARE: 'LP份额',
  VIRTUAL_SHARE: '虚拟股权',
}

const statusLabels: Record<AccountStatus, { text: string; className: string }> = {
  ACTIVE: { text: '正常', className: 'bg-green-100 text-green-800' },
  FROZEN: { text: '冻结', className: 'bg-yellow-100 text-yellow-800' },
  CANCELLED: { text: '注销', className: 'bg-gray-100 text-gray-800' },
}

const txTypeLabels: Record<AssetTxType, string> = {
  SETTLEMENT: '交割入账',
  REPURCHASE: '回购',
  DIVIDEND: '分红',
  REDEEM: '兑现',
  CANCEL: '注销',
}

const positiveTypes = ['SETTLEMENT', 'DIVIDEND']
const negativeTypes = ['REPURCHASE', 'REDEEM', 'CANCEL']

export default function AssetDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [position, setPosition] = useState<AssetPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [changeType, setChangeType] = useState<AssetTxType>('SETTLEMENT')
  const [quantity, setQuantity] = useState('')
  const [costBasis, setCostBasis] = useState('')
  const [tradeDate, setTradeDate] = useState('')

  useEffect(() => {
    async function fetchPosition() {
      try {
        const res = await fetch(`/api/assets/${id}`)
        const data = await res.json()
        if (data.id) {
          setPosition(data)
        }
      } catch (err) {
        console.error('Failed to fetch position:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPosition()
  }, [id])

  // Set default trade date to today
  useEffect(() => {
    if (showModal && !tradeDate) {
      setTradeDate(new Date().toISOString().slice(0, 10))
    }
  }, [showModal, tradeDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quantity || !tradeDate) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/assets/${id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeType,
          quantity: parseFloat(quantity),
          costBasis: costBasis ? parseFloat(costBasis) : null,
          tradeDate,
        }),
      })

      if (res.ok) {
        // Refresh data
        const refreshRes = await fetch(`/api/assets/${id}`)
        const data = await refreshRes.json()
        setPosition(data)
        setShowModal(false)
        // Reset form
        setChangeType('SETTLEMENT')
        setQuantity('')
        setCostBasis('')
        setTradeDate('')
      } else {
        const error = await res.json()
        alert(error.error || '创建失败')
      }
    } catch (err) {
      console.error('Failed to create transaction:', err)
      alert('创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">账户不存在</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href="/admin/assets"
            className="text-gray-500 hover:text-gray-700"
          >
            ← 返回
          </a>
          <h1 className="text-2xl font-bold text-gray-900">账户详情</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          添加流水
        </button>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">账户信息</h2>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">账户ID</p>
            <p className="text-base font-medium text-gray-900">
              {position.accountId}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">员工姓名</p>
            <p className="text-base font-medium text-gray-900">
              {position.employee?.name || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">持股实体</p>
            <p className="text-base font-medium text-gray-900">
              {position.holdingEntity?.name || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">资产类型</p>
            <p className="text-base font-medium text-gray-900">
              {typeLabels[position.assetType]}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">当前余额</p>
            <p className="text-base font-medium text-gray-900">
              {position.totalBalance.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">平均成本</p>
            <p className="text-base font-medium text-gray-900">
              {position.avgCost || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">币种</p>
            <p className="text-base font-medium text-gray-900">
              {position.currency}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">状态</p>
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                statusLabels[position.status].className
              }`}
            >
              {statusLabels[position.status].text}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">流水记录</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                流水号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                变动类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                变动数量
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                交易时单价
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                交易后余额
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                交易日期
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {position.transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  暂无流水记录
                </td>
              </tr>
            ) : (
              position.transactions.map((tx) => {
                const isPositive = positiveTypes.includes(tx.changeType)
                const isNegative = negativeTypes.includes(tx.changeType)
                const quantityClass = isPositive
                  ? 'text-green-600'
                  : isNegative
                  ? 'text-red-600'
                  : 'text-gray-900'

                return (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tx.trxId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isPositive
                            ? 'bg-green-100 text-green-800'
                            : isNegative
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {txTypeLabels[tx.changeType]}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${quantityClass}`}
                    >
                      {Number(tx.quantity) > 0 ? '+' : ''}
                      {Number(tx.quantity).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.costBasis || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Number(tx.balanceAfter).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tx.tradeDate).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              添加流水
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  变动类型
                </label>
                <select
                  value={changeType}
                  onChange={(e) =>
                    setChangeType(e.target.value as AssetTxType)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="SETTLEMENT">交割入账</option>
                  <option value="REPURCHASE">回购</option>
                  <option value="DIVIDEND">分红</option>
                  <option value="REDEEM">兑现</option>
                  <option value="CANCEL">注销</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  变动数量
                  <span className="text-gray-400 text-xs ml-1">
                    （入账填正数，出账填负数）
                  </span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="例如：100 或 -50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  交易时单价 FMV
                  <span className="text-gray-400 text-xs ml-1">（选填）</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={costBasis}
                  onChange={(e) => setCostBasis(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="例如：10.50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  交易日期
                </label>
                <input
                  type="date"
                  value={tradeDate}
                  onChange={(e) => setTradeDate(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '提交'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
