'use client'

import { useEffect, useState } from 'react'

export type UserRole = 'HR' | 'FINANCE' | 'LEGAL' | 'AUDITOR' | 'EMPLOYEE'

const ROLE_INFO: Record<UserRole, { label: string; icon: string; description: string }> = {
  HR: { label: 'HR 管理员', icon: '👥', description: '计划管理、人员管理、授予操作' },
  FINANCE: { label: '财务/税务', icon: '💰', description: '税务事件处理、估值录入' },
  LEGAL: { label: '法务/合规', icon: '⚖️', description: '审批、模板审核' },
  AUDITOR: { label: '审计', icon: '📑', description: '只读：审计日志、证据包导出' },
  EMPLOYEE: { label: '员工', icon: '👤', description: '只读：个人权益视图' },
}

interface RoleSwitcherProps {
  onRoleChange?: (role: UserRole) => void
}

export function RoleSwitcher({ onRoleChange }: RoleSwitcherProps) {
  const [role, setRole] = useState<UserRole>('HR')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole | null
    if (savedRole && ROLE_INFO[savedRole]) {
      setRole(savedRole)
    }
  }, [])

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    localStorage.setItem('userRole', newRole)
    setIsOpen(false)
    onRoleChange?.(newRole)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">{ROLE_INFO[role].icon}</span>
        <span className="text-sm font-medium text-gray-700">{ROLE_INFO[role].label}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-medium">切换角色（Demo）</span>
          </div>
          <div className="py-1">
            {(Object.keys(ROLE_INFO) as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 ${
                  r === role ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{ROLE_INFO[r].icon}</span>
                <div>
                  <div className="text-sm font-medium">{ROLE_INFO[r].label}</div>
                  <div className="text-xs text-gray-500">{ROLE_INFO[r].description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function useUserRole(): UserRole {
  const [role, setRole] = useState<UserRole>('HR')

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole | null
    if (savedRole && ROLE_INFO[savedRole]) {
      setRole(savedRole)
    }

    const handleStorageChange = () => {
      const newRole = localStorage.getItem('userRole') as UserRole | null
      if (newRole && ROLE_INFO[newRole]) {
        setRole(newRole)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return role
}

export { ROLE_INFO }