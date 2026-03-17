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
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<HoldingEntity>>({})

  useEffect(() => {
    async function fetchEntity() {
      try {
        const res = await fetch(`/api/holding-entities/${params.id}`)
        const data = await res.json()
        if (data.id) {
          setEntity(data)
          setEditData(data)
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

  const handleSave = async () => {
    if (!entity) return
    try {
      const res = await fetch(`/api/holding-entities/${entity.id}`, {
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

  const handleEconomicRightsChange = (right: string) => {
    setEditData(prev => {
      const current = prev.economicRights || []
      if (current.includes(right)) {
        return { ...prev, economicRights: current.filter(r => r !== right) }
      } else {
        return { ...prev, economicRights: [...current, right] }
      }
    })
  }

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
            {isEditing ? (
              <input
                type="text"
                value={editData.heId || ''}
                onChange={(e) => setEditData({ ...editData, heId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900 font-mono">{entity.heId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">代持主体</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{entity.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">LP份额账户</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.lpAccountId || ''}
                onChange={(e) => setEditData({ ...editData, lpAccountId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{entity.lpAccountId || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">对应份额</label>
            {isEditing ? (
              <input
                type="number"
                value={editData.lpUnits || ''}
                onChange={(e) => setEditData({ ...editData, lpUnits: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{entity.lpUnits || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">经济权益</label>
            {isEditing ? (
              <div className="flex gap-4">
                {['分红', '转让收益'].map((right) => (
                  <label key={right} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.economicRights?.includes(right) || false}
                      onChange={() => handleEconomicRightsChange(right)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{right}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-900">{entity.economicRights?.join('、') || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">类型</label>
            {isEditing ? (
              <select
                value={editData.type || ''}
                onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="LP份额">LP份额</option>
                <option value="实股">实股</option>
                <option value="虚拟股权">虚拟股权</option>
              </select>
            ) : (
              <p className="text-gray-900">{entity.type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">法域</label>
            {isEditing ? (
              <select
                value={editData.jurisdiction || ''}
                onChange={(e) => setEditData({ ...editData, jurisdiction: e.target.value as Jurisdiction })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="CN">内地</option>
                <option value="HK">香港</option>
                <option value="OVERSEAS">海外</option>
              </select>
            ) : (
              <p className="text-gray-900">{jurisdictionLabels[entity.jurisdiction]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
            <p className="text-gray-900">{new Date(entity.createdAt).toLocaleString('zh-CN')}</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">描述</label>
            {isEditing ? (
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
              />
            ) : (
              <p className="text-gray-900">{entity.description || '-'}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/holding-entities"
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