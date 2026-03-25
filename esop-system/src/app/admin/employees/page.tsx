'use client'

import { useEffect, useState } from 'react'
import { LegalIdentity, EmployeeStatus, Jurisdiction, BankAccountType } from '@prisma/client'

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
  _count?: { grants: number }
}

const identityLabels: Record<LegalIdentity, string> = {
  CN_RESIDENT: '内地',
  HK_RESIDENT: '香港',
  OVERSEAS_RESIDENT: '海外',
}

const statusLabels: Record<EmployeeStatus, string> = {
  ACTIVE: '在职',
  TERMINATED: '离职',
  ON_LEAVE: '休假中',
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch('/api/employees')
        const data = await res.json()
        if (Array.isArray(data)) {
          setEmployees(data)
        }
      } catch (err) {
        console.error('Failed to fetch employees:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
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
        <h1 className="text-2xl font-bold text-gray-900">员工档案</h1>
        <a 
          href="/admin/employees/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 添加员工
        </a>
      </div>
      
      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索员工姓名或工号..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部状态</option>
            <option value="ACTIVE">在职</option>
            <option value="TERMINATED">离职</option>
          </select>
        </div>
      </div>
      
      {/* 员工列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">员工</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">员工ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">法律身份</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">税务居住地</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">银行账号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">授予数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  暂无员工记录，点击右上角"添加员工"开始录入
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.employeeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.department || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{identityLabels[employee.legalIdentity]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{jurisdictionLabels[employee.taxJurisdiction]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.bankAccountType ? bankLabels[employee.bankAccountType] : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee._count?.grants || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.employmentStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {statusLabels[employee.employmentStatus]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a href={`/admin/employees/${employee.id}`} className="text-blue-600 hover:text-blue-800">查看</a>
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