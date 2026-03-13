'use client'

import { useEffect, useState } from 'react'
import { AssetType } from '@prisma/client'

interface AssetPosition {
  id: string
  employeeId: string
  holdingEntityId: string | null
  assetType: AssetType
  quantity: string
  costBasis: string | null
  employee?: { name: string; employeeId: string }
  holdingEntity?: { name: string }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetPosition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAssets() {
      try {
        // Asset positions are related to grants, fetch from grants endpoint
        // For now show placeholder
        setAssets([])
      } catch (err) {
        console.error('Failed to fetch assets:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAssets()
  }, [])

  const typeLabels: Record<AssetType, string> = {
    COMMON_SHARE: '普通股',
    PREFERRED_SHARE: '优先股',
    LP_SHARE: 'LP份额',
    VIRTUAL_SHARE: '虚拟股权',
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
        <h1 className="text-2xl font-bold text-gray-900">资产管理</h1>
      </div>
      
      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-4">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部类型</option>
            <option value="COMMON_SHARE">普通股</option>
            <option value="PREFERRED_SHARE">优先股</option>
            <option value="LP_SHARE">LP份额</option>
            <option value="VIRTUAL_SHARE">虚拟股权</option>
          </select>
        </div>
      </div>
      
      {/* 资产列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">员工</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">持股实体</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">资产类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">持有数量</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成本基础</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  暂无资产记录
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {asset.employee?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.holdingEntity?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{typeLabels[asset.assetType]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.costBasis || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a href={`/admin/assets/${asset.id}`} className="text-blue-600 hover:text-blue-800">查看</a>
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