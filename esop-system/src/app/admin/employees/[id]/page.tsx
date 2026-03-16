'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { LegalIdentity, EmployeeStatus, Jurisdiction, BankAccountType, GrantStatus, PlanType } from '@prisma/client'

interface Grant {
  id: string
  quantity: string
  status: GrantStatus
  type: PlanType
  grantDate: string
  plan?: { title: string }
}

interface Employee {
  id: string
  employeeId: string
  name: string
  department: string | null
  legalIdentity: LegalIdentity
  employmentEntity: string[]
  taxJurisdiction: Jurisdiction
  bankAccountType: BankAccountType | null
  employmentStatus: EmployeeStatus
  createdAt: string
  updatedAt: string
  grants: Grant[]
}

const identityLabels: Record<LegalIdentity, string> = {
  CN_RESIDENT: '内地',
  HK_RESIDENT: '香港',
  OVERSEAS_RESIDENT: '海外',
}

const statusLabels: Record<EmployeeStatus, string> = {
  ACTIVE: '在职',
  TERMINATED: '离职',
}

const jurisdictionLabels: Record<Jurisdiction, string> = {
  HK: '香港',
  CN: '内地',
  OVERSEAS: '海外',
}

const bankLabels: Record<BankAccountType, string> = {
  DOMESTIC: '内地',
  OVERSEAS: '海外',
}

const grantStatusLabels: Record<GrantStatus, string> = {
  DRAFT: '草稿',
  GRANTED: '已授予',
  VESTING: '归属中',
  VESTED: '已归属',
  EXERCISED: '已行权',
  SETTLED: '已交割',
  CANCELLED: '已取消',
  FORFEITED: '已失效',
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Employee>>({})

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const res = await fetch(`/api/employees/${params.id}`)
        const data = await res.json()
        if (data.id) {
          setEmployee(data)
          setEditData(data)
        }
      } catch (err) {
        console.error('Failed to fetch employee:', err)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchEmployee()
    }
  }, [params.id])

  const handleSave = async () => {
    if (!employee) return
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
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

  const handleEntityChange = (entity: string) => {
    setEditData(prev => {
      const current = prev.employmentEntity || []
      if (current.includes(entity)) {
        return { ...prev, employmentEntity: current.filter(e => e !== entity) }
      } else {
        return { ...prev, employmentEntity: [...current, entity] }
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

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">员工不存在</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/employees" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">员工详情</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* 状态标签 */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{employee.name}</h2>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            employee.employmentStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {statusLabels[employee.employmentStatus]}
          </span>
        </div>

        {/* 员工信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">员工ID</label>
            <p className="text-gray-900 font-mono">{employee.employeeId}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">姓名</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{employee.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">部门</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.department || ''}
                onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{employee.department || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">法律身份</label>
            {isEditing ? (
              <select
                value={editData.legalIdentity}
                onChange={(e) => setEditData({ ...editData, legalIdentity: e.target.value as LegalIdentity })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="CN_RESIDENT">内地</option>
                <option value="HK_RESIDENT">香港</option>
                <option value="OVERSEAS_RESIDENT">海外</option>
              </select>
            ) : (
              <p className="text-gray-900">{identityLabels[employee.legalIdentity]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">用工主体</label>
            {isEditing ? (
              <div className="flex gap-4">
                {['北京科技有限公司', 'Hong Kong Tech Ltd', '上海分公司'].map((entity) => (
                  <label key={entity} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.employmentEntity?.includes(entity) || false}
                      onChange={() => handleEntityChange(entity)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{entity}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-900">{employee.employmentEntity?.join('、') || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">税务居住地</label>
            {isEditing ? (
              <select
                value={editData.taxJurisdiction}
                onChange={(e) => setEditData({ ...editData, taxJurisdiction: e.target.value as Jurisdiction })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="CN">内地</option>
                <option value="HK">香港</option>
                <option value="OVERSEAS">海外</option>
              </select>
            ) : (
              <p className="text-gray-900">{jurisdictionLabels[employee.taxJurisdiction]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">银行账号</label>
            {isEditing ? (
              <select
                value={editData.bankAccountType || ''}
                onChange={(e) => setEditData({ ...editData, bankAccountType: e.target.value as BankAccountType || null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">-</option>
                <option value="DOMESTIC">内地</option>
                <option value="OVERSEAS">海外</option>
              </select>
            ) : (
              <p className="text-gray-900">{employee.bankAccountType ? bankLabels[employee.bankAccountType] : '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">雇佣状态</label>
            {isEditing ? (
              <select
                value={editData.employmentStatus}
                onChange={(e) => setEditData({ ...editData, employmentStatus: e.target.value as EmployeeStatus })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="ACTIVE">在职</option>
                <option value="TERMINATED">离职</option>
              </select>
            ) : (
              <p className="text-gray-900">{statusLabels[employee.employmentStatus]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
            <p className="text-gray-900">{new Date(employee.createdAt).toLocaleString('zh-CN')}</p>
          </div>
        </div>

        {/* 授予记录 */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">授予记录</h3>
          {employee.grants.length === 0 ? (
            <p className="text-gray-500">暂无授予记录</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">计划</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">授予日期</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employee.grants.map((grant) => (
                  <tr key={grant.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{grant.plan?.title || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{grant.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{grant.quantity}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {grantStatusLabels[grant.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(grant.grantDate).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <a
            href="/admin/employees"
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