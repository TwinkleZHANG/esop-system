'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Valuation {
  id: string
  date: string
  fmv: string
  source: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export default function ValuationDetailPage() {
  const params = useParams()
  const [valuation, setValuation] = useState<Valuation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Valuation>>({})

  useEffect(() => {
    async function fetchValuation() {
      try {
        const res = await fetch(`/api/valuations/${params.id}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setValuation(data)
        setEditData(data)
      } catch (err) {
        console.error('Failed to fetch valuation:', err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchValuation()
    }
  }, [params.id])

  const handleSave = async () => {
    if (!valuation) return
    try {
      const res = await fetch(`/api/valuations/${valuation.id}`, {
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

  const handleDelete = async () => {
    if (!valuation) return
    if (!confirm('确定要删除这条估值记录吗？')) return

    try {
      const res = await fetch(`/api/valuations/${valuation.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        alert('删除成功！')
        window.location.href = '/admin/valuations'
      } else {
        alert('删除失败')
      }
    } catch (err) {
      alert('删除失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!valuation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">估值记录不存在</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/valuations" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">估值详情</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">估值日期</label>
            {isEditing ? (
              <input
                type="date"
                value={editData.date?.split('T')[0] || ''}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{new Date(valuation.date).toLocaleDateString('zh-CN')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">公允价值 (FMV)</label>
            {isEditing ? (
              <input
                type="number"
                step="0.0001"
                value={editData.fmv || ''}
                onChange={(e) => setEditData({ ...editData, fmv: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">¥{parseFloat(valuation.fmv).toFixed(4)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">估值来源</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.source || ''}
                onChange={(e) => setEditData({ ...editData, source: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="如：第三方评估机构"
              />
            ) : (
              <p className="text-gray-900">{valuation.source || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
            <p className="text-gray-900">{new Date(valuation.createdAt).toLocaleString('zh-CN')}</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">描述</label>
            {isEditing ? (
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
              />
            ) : (
              <p className="text-gray-900">{valuation.description || '-'}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/valuations"
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
            <>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                删除
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                编辑
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
