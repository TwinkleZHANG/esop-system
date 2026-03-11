'use client'

import { useEffect, useState } from 'react'
import type { UserRole } from '@/components/RoleSwitcher'

const ROLE_NAV_CONFIG: Record<UserRole, { path: string; label: string }[]> = {
  HR: [
    { path: '/', label: '首页' },
    { path: '/admin', label: '管理后台' },
    { path: '/employee', label: '员工视图' },
  ],
  FINANCE: [
    { path: '/', label: '首页' },
    { path: '/admin', label: '财务工作台' },
    { path: '/employee', label: '员工视图' },
  ],
  LEGAL: [
    { path: '/', label: '首页' },
    { path: '/admin', label: '法务工作台' },
    { path: '/employee', label: '员工视图' },
  ],
  AUDITOR: [
    { path: '/', label: '首页' },
    { path: '/admin', label: '审计工作台' },
    { path: '/employee', label: '员工视图' },
  ],
  EMPLOYEE: [
    { path: '/', label: '首页' },
    { path: '/employee', label: '我的权益' },
  ],
}

export function useNavRole(): UserRole {
  const [role, setRole] = useState<UserRole>('HR')

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole | null
    if (savedRole && ROLE_NAV_CONFIG[savedRole]) {
      setRole(savedRole)
    }

    const handleStorageChange = () => {
      const newRole = localStorage.getItem('userRole') as UserRole | null
      if (newRole && ROLE_NAV_CONFIG[newRole]) {
        setRole(newRole)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return role
}

export function getNavItems(role: UserRole) {
  return ROLE_NAV_CONFIG[role] || ROLE_NAV_CONFIG.HR
}