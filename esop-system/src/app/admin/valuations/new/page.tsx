'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewValuationPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    date: '',
    fmv: '',
    source: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/valuations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        alert('创建成功！')
        router.push('/admin/valuations')
      } else {
        const error = await res.json()
        alert('创建失败：' + (error.error || '未知错误'))
      }
    } catch (err) {
      alert('创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/valuations" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">新建估值</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              估值日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公允价值 (FMV) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.0001"
              required
              value={formData.fmv}
              onChange={(e) => setFormData({ ...formData, fmv: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="请输入公允价值"
            />
            <p className="text-xs text-gray-500 mt-1">单位：人民币，支持4位小数</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              估值来源
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="如：第三方评估机构、内部评估等"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
              placeholder="可选：添加估值相关说明"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <a
              href="/admin/valuations"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </a>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
