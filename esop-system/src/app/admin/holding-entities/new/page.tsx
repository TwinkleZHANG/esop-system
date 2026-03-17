'use client'

import { useState } from 'react'

export default function NewHoldingEntityPage() {
  const [formData, setFormData] = useState({
    heId: '',
    name: '',
    lpAccountId: '',
    lpUnits: '',
    economicRights: [] as string[],
    type: 'LP份额',
    jurisdiction: 'CN',
    description: '',
  })

  const handleEconomicRightsChange = (right: string) => {
    setFormData(prev => {
      const current = prev.economicRights
      if (current.includes(right)) {
        return { ...prev, economicRights: current.filter(r => r !== right) }
      } else {
        return { ...prev, economicRights: [...current, right] }
      }
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/holding-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        alert('持股主体创建成功！')
        window.location.href = '/admin/holding-entities'
      } else {
        const error = await res.json()
        alert('创建失败：' + (error.error || '未知错误'))
      }
    } catch (err) {
      alert('创建失败')
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/holding-entities" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">添加持股主体</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 代持主体ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              代持主体ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.heId}
              onChange={(e) => setFormData({ ...formData, heId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：HE001"
              required
            />
          </div>
          
          {/* 代持主体名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              代持主体 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="持股主体名称"
              required
            />
          </div>
          
          {/* LP份额账户 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LP份额账户
            </label>
            <input
              type="text"
              value={formData.lpAccountId}
              onChange={(e) => setFormData({ ...formData, lpAccountId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="LP账户编号"
            />
          </div>
          
          {/* 对应份额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              对应份额
            </label>
            <input
              type="number"
              value={formData.lpUnits}
              onChange={(e) => setFormData({ ...formData, lpUnits: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="份额数量"
            />
          </div>
          
          {/* 经济权益 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              经济权益
            </label>
            <div className="flex gap-4 mt-2">
              {['分红', '转让收益'].map((right) => (
                <label key={right} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.economicRights.includes(right)}
                    onChange={() => handleEconomicRightsChange(right)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{right}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="LP份额">LP份额</option>
              <option value="实股">实股</option>
              <option value="虚拟股权">虚拟股权</option>
            </select>
          </div>
          
          {/* 法域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              法域 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.jurisdiction}
              onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CN">内地</option>
              <option value="HK">香港</option>
              <option value="OVERSEAS">海外</option>
            </select>
          </div>
          
          {/* 描述 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="持股主体描述..."
              rows={3}
            />
          </div>
        </div>
        
        {/* 提交按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/holding-entities"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            取消
          </a>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            创建持股主体
          </button>
        </div>
      </form>
    </div>
  )
}