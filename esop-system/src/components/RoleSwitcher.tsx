'use client'

import { useEffect, useState } from 'react'

export type UserRole = 'ADMIN_CREATE' | 'ADMIN_APPROVE' | 'EMPLOYEE'

const ROLE_INFO: Record<UserRole, { label: string; icon: string; description: string }> = {
  ADMIN_CREATE: { label: '管理员（创建）', icon: '✏️', description: '创建激励计划、员工档案、授予记录' },
  ADMIN_APPROVE: { label: '管理员（审批）', icon: '✅', description: '审批激励计划和授予申请' },
  EMPLOYEE: { label: '员工', icon: '👤', description: '查看个人权益' },
}

interface RoleSwitcherProps {
  onRoleChange?: (role: UserRole) => void
}

export function RoleSwitcher({ onRoleChange }: RoleSwitcherProps) {
  const [role, setRole] = useState<UserRole>('ADMIN_CREATE')
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
  const [role, setRole] = useState<UserRole>('ADMIN_CREATE')

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