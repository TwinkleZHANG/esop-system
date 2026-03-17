'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  updatedAt: string
}

const jurisdictionLabels: Record<Jurisdiction, string> = {
  HK: '香港',
  CN: '内地',
  OVERSEAS: '海外',
}

export default function HoldingEntityDetailPage() {
  const params = useParams()
  const [entity, setEntity] = useState<HoldingEntity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEntity() {
      try {
        const res = await fetch(`/api/holding-entities/${params.id}`)
        const data = await res.json()
        if (data.id) {
          setEntity(data)
        }
      } catch (err) {
        console.error('Failed to fetch holding entity:', err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchEntity()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">持股主体不存在</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/holding-entities" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">持股主体详情</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">代持主体ID</label>
            <p className="text-gray-900 font-mono">{entity.heId}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">代持主体</label>
            <p className="text-gray-900">{entity.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">LP份额账户</label>
            <p className="text-gray-900">{entity.lpAccountId || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">对应份额</label>
            <p className="text-gray-900">{entity.lpUnits || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">经济权益</label>
            <p className="text-gray-900">{entity.economicRights?.join('、') || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">类型</label>
            <p className="text-gray-900">{entity.type}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">法域</label>
            <p className="text-gray-900">{jurisdictionLabels[entity.jurisdiction]}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
            <p className="text-gray-900">{new Date(entity.createdAt).toLocaleString('zh-CN')}</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">描述</label>
            <p className="text-gray-900">{entity.description || '-'}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/holding-entities"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </a>
        </div>
      </div>
    </div>
  )
}