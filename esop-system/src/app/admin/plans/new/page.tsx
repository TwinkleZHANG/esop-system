'use client'

import { useState, useEffect } from 'react'
import { useUserRole } from '@/components/RoleSwitcher'
import { useRouter } from 'next/navigation'

export default function NewPlanPage() {
  const role = useUserRole()
  const router = useRouter()

  useEffect(() => {
    if (role !== 'ADMIN_CREATE') {
      router.replace('/admin/plans')
    }
  }, [role])

  const [formData, setFormData] = useState({
    title: '',
    type: 'RSU',
    applicableJurisdiction: 'HK',
    settlementMethod: [] as string[],
    poolSize: '',
    effectiveDate: '',
    boardApprovalId: '',
  })
  
  const handleSettlementMethodChange = (method: string) => {
    setFormData(prev => {
      const current = prev.settlementMethod
      if (current.includes(method)) {
        return { ...prev, settlementMethod: current.filter(m => m !== method) }
      } else {
        return { ...prev, settlementMethod: [...current, method] }
      }
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          poolSize: parseFloat(formData.poolSize),
          effectiveDate: new Date(formData.effectiveDate),
        }),
      })
      if (res.ok) {
        alert('计划创建成功！')
        window.location.href = '/admin/plans'
      } else {
        const error = await res.json()
        alert('创建失败：' + (error.error || '未知错误'))
      }
    } catch (err) {
      console.error('创建计划失败:', err)
      alert('创建失败')
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/plans" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">新建激励计划</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 计划名称 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              计划名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：2024年 RSU 激励计划"
              required
            />
          </div>
          
          {/* 激励类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              激励类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="RSU">RSU - 限制性股票单位</option>
              <option value="OPTION">Option - 期权</option>
              <option value="VIRTUAL_SHARE">虚拟股权</option>
              <option value="LP_SHARE">LP份额</option>
            </select>
          </div>
          
          {/* 适用法域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              适用法域 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.applicableJurisdiction}
              onChange={(e) => setFormData({ ...formData, applicableJurisdiction: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="HK">香港</option>
              <option value="CN">中国内地</option>
              <option value="OVERSEAS">海外</option>
            </select>
          </div>
          
          {/* 交割方式 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              交割方式 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 mt-2">
              {['实股', 'LP份额', '现金'].map((method) => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.settlementMethod.includes(method)}
                    onChange={() => handleSettlementMethodChange(method)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{method}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 池规模 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              激励池规模 <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <input
                type="number"
                value={formData.poolSize}
                onChange={(e) => setFormData({ ...formData, poolSize: e.target.value })}
                className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100000"
                required
              />
              <span className="border border-l-0 border-gray-300 rounded-r-lg px-3 py-2 bg-gray-50 text-gray-500">
                股
              </span>
            </div>
          </div>
          
          {/* 生效日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              生效日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* 董事会决议文件编号 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              董事会决议文件编号
            </label>
            <input
              type="text"
              value={formData.boardApprovalId}
              onChange={(e) => setFormData({ ...formData, boardApprovalId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：BR-2024-001"
            />
          </div>
        </div>
        
        {/* 提交按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/plans"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            取消
          </a>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            创建计划
          </button>
        </div>
      </form>
    </div>
  )
}