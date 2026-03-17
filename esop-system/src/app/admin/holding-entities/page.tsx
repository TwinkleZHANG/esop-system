'use client'

import { useEffect, useState } from 'react'
import { Jurisdiction } from '@prisma/client'

interface HoldingEntity {
  id: string
  heId: string
  name: string
  lpAccountId: string | null
  lpUnits: string | null
  economicRights: string[]
  type: string
  jurisdiction: Jurisdiction
  description: string | null
  createdAt: string
}

const jurisdictionLabels: Record<Jurisdiction, string> = {
  HK: '香港',
  CN: '内地',
  OVERSEAS: '海外',
}

export default function HoldingEntitiesPage() {
  const [entities, setEntities] = useState<HoldingEntity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEntities() {
      try {
        const res = await fetch('/api/holding-entities')
        const data = await res.json()
        if (Array.isArray(data)) {
          setEntities(data)
        }
      } catch (err) {
        console.error('Failed to fetch holding entities:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEntities()
  }, [])

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
        <h1 className="text-2xl font-bold text-gray-900">持股主体库</h1>
        <a 
          href="/admin/holding-entities/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 添加持股主体
        </a>
      </div>
      
      {/* 持股主体列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">代持主体ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">代持主体</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LP份额账户</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">对应份额</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">经济权益</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">法域</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entities.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  暂无持股主体记录，点击右上角"添加持股主体"开始创建
                </td>
              </tr>
            ) : (
              entities.map((entity) => (
                <tr key={entity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{entity.heId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entity.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.lpAccountId || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.lpUnits || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.economicRights?.join('、') || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{jurisdictionLabels[entity.jurisdiction]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a href={`/admin/holding-entities/${entity.id}`} className="text-blue-600 hover:text-blue-800">查看</a>
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