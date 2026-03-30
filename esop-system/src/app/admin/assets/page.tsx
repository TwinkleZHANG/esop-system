'use client'

import { useEffect, useMemo, useState } from 'react'
import { AssetType, AccountStatus } from '@prisma/client'

interface AssetPosition {
  id: string
  accountId: string
  employeeId: string
  holdingEntityId: string | null
  assetType: AssetType
  quantity: string
  currency: string
  status: AccountStatus
  employee?: { name: string; employeeId: string }
  holdingEntity?: { name: string }
  currentValue: number
  latestFmv: number
  valuationDate: string | null
  avgCost: number
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

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchName, setSearchName] = useState('')
  const [filterStatus, setFilterStatus] = useState<AccountStatus | ''>('')
  const [latestFmv, setLatestFmv] = useState(0)
  const [valuationDate, setValuationDate] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch('/api/assets')
        const data = await res.json()
        if (Array.isArray(data)) {
          setAssets(data)
          if (data.length > 0) {
            setLatestFmv(data[0].latestFmv)
            setValuationDate(data[0].valuationDate)
          }
        } else {
          setAssets([])
          console.error('API returned non-array data:', data)
        }
      } catch (err) {
        console.error('Failed to fetch assets:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAssets()
  }, [])

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesName = searchName
        ? asset.employee?.name?.toLowerCase().includes(searchName.toLowerCase())
        : true
      const matchesStatus = filterStatus ? asset.status === filterStatus : true
      return matchesName && matchesStatus
    })
  }, [assets, searchName, filterStatus])

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
        <h1 className="text-2xl font-bold text-gray-900">资产管理</h1>
      </div>

      {/* 估值提示条 */}
      {valuationDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            当前估值：¥{latestFmv.toFixed(2)}（{valuationDate}）
          </p>
        </div>
      )}

      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索员工姓名"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AccountStatus | '')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">全部状态</option>
            <option value="ACTIVE">正常</option>
            <option value="FROZEN">冻结</option>
            <option value="CANCELLED">注销</option>
          </select>
        </div>
      </div>

      {/* 资产列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                员工姓名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                持股实体
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                资产类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                持有股数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                当前FMV
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                当前市值
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                平均成本
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  暂无资产记录
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <a
                      href={`/admin/assets/${asset.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {asset.employee?.name || '-'}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.holdingEntity?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeLabels[asset.assetType]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(asset.quantity).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ¥{asset.latestFmv.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ¥{asset.currentValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.avgCost > 0
                      ? `¥${asset.avgCost.toFixed(2)}/股`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusLabels[asset.status].className}`}
                    >
                      {statusLabels[asset.status].text}
                    </span>
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
