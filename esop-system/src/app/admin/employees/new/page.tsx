'use client'

import { useState, useEffect } from 'react'

interface EmploymentEntity {
  id: string
  name: string
}

export default function NewEmployeePage() {
  const [entities, setEntities] = useState<EmploymentEntity[]>([])
  const [newEntityName, setNewEntityName] = useState('')
  const [showAddEntity, setShowAddEntity] = useState(false)
  
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    department: '',
    legalIdentity: 'CN_RESIDENT',
    employmentEntity: [] as string[],
    taxJurisdiction: 'CN',
    bankAccountType: 'DOMESTIC',
  })

  useEffect(() => {
    fetch('/api/employment-entities')
      .then(res => res.json())
      .then(data => setEntities(data))
  }, [])

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

  const handleDeleteEntity = async (id: string, name: string) => {
    if (!confirm(`确定要删除用工主体"${name}"吗？`)) return
    try {
      const res = await fetch(`/api/employment-entities/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEntities(entities.filter(e => e.id !== id))
        setFormData(prev => ({ ...prev, employmentEntity: prev.employmentEntity.filter(e => e !== name) }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddEntity = async () => {
    if (!newEntityName.trim()) return
    try {
      const res = await fetch('/api/employment-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEntityName }),
      })
      if (res.ok) {
        const entity = await res.json()
        setEntities([...entities, entity])
        setNewEntityName('')
        setShowAddEntity(false)
      }
    } catch (err) {
      console.error(err)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, employmentStatus: 'ACTIVE' }),
      })
      if (res.ok) {
        alert('员工添加成功！')
        window.location.href = '/admin/employees'
      } else {
        const error = await res.json()
        alert('添加失败：' + (error.error || '未知错误'))
      }
    } catch (err) {
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              员工工号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="例如：EMP001"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="员工姓名"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="例如：技术部"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              法律身份 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.legalIdentity}
              onChange={(e) => setFormData({ ...formData, legalIdentity: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="CN_RESIDENT">内地</option>
              <option value="HK_RESIDENT">香港</option>
              <option value="OVERSEAS_RESIDENT">海外</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">用工主体</label>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap items-center">
                {entities.map(entity => (
                  <div key={entity.id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.employmentEntity.includes(entity.name)}
                        onChange={() => handleEntityChange(entity.name)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{entity.name}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntity(entity.id, entity.name)}
                      className="text-red-500 hover:text-red-700 text-xs ml-1"
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAddEntity(!showAddEntity)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + 添加新用工主体
                </button>
              </div>
              {showAddEntity && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    placeholder="新用工主体名称"
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddEntity}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg"
                  >
                    添加
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              税务居住地 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.taxJurisdiction}
              onChange={(e) => setFormData({ ...formData, taxJurisdiction: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="CN">内地</option>
              <option value="HK">香港</option>
              <option value="OVERSEAS">海外</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">银行账号</label>
            <select
              value={formData.bankAccountType}
              onChange={(e) => setFormData({ ...formData, bankAccountType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="DOMESTIC">内地</option>
              <option value="OVERSEAS">海外</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <a href="/admin/employees" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</a>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">添加员工</button>
        </div>
      </form>
    </div>
  )
}