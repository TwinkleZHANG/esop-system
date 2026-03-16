'use client'

import { useState } from 'react'

export default function NewEmployeePage() {
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    department: '',
    legalIdentity: 'CN_RESIDENT',
    employmentEntity: [] as string[],
    taxJurisdiction: 'CN',
    bankAccountType: 'DOMESTIC',
  })
  
  const handleEntityChange = (entity: string) => {
    setFormData(prev => {
      const current = prev.employmentEntity
      if (current.includes(entity)) {
        return { ...prev, employmentEntity: current.filter(e => e !== entity) }
      } else {
        return { ...prev, employmentEntity: [...current, entity] }
      }
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          employmentStatus: 'ACTIVE', // 默认在职
        }),
      })
      if (res.ok) {
        alert('员工添加成功！')
        window.location.href = '/admin/employees'
      } else {
        const error = await res.json()
        alert('添加失败：' + (error.error || '未知错误'))
      }
    } catch (err) {
      console.error('添加员工失败:', err)
      alert('添加失败')
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/employees" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">添加员工</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 员工工号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              员工工号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：EMP001"
              required
            />
          </div>
          
          {/* 姓名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="员工姓名"
              required
            />
          </div>
          
          {/* 部门 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              部门
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：技术部"
            />
          </div>
          
          {/* 法律身份 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              法律身份 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.legalIdentity}
              onChange={(e) => setFormData({ ...formData, legalIdentity: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CN_RESIDENT">内地</option>
              <option value="HK_RESIDENT">香港</option>
              <option value="OVERSEAS_RESIDENT">海外</option>
            </select>
          </div>
          
          {/* 用工主体（多选） */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用工主体
            </label>
            <div className="flex gap-4 mt-2">
              {['北京科技有限公司', 'Hong Kong Tech Ltd', '上海分公司'].map((entity) => (
                <label key={entity} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.employmentEntity.includes(entity)}
                    onChange={() => handleEntityChange(entity)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{entity}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 税务法域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              税务居住地 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.taxJurisdiction}
              onChange={(e) => setFormData({ ...formData, taxJurisdiction: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CN">内地</option>
              <option value="HK">香港</option>
              <option value="OVERSEAS">海外</option>
            </select>
          </div>
          
          {/* 银行账户类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              银行账号
            </label>
            <select
              value={formData.bankAccountType}
              onChange={(e) => setFormData({ ...formData, bankAccountType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DOMESTIC">内地</option>
              <option value="OVERSEAS">海外</option>
            </select>
          </div>
        </div>
        
        {/* 提交按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/employees"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            取消
          </a>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            添加员工
          </button>
        </div>
      </form>
    </div>
  )
}