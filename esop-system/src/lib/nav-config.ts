'use client'

import { useEffect, useState } from 'react'
import type { UserRole } from '@/components/RoleSwitcher'

const ROLE_NAV_CONFIG: Record<UserRole, { path: string; label: string }[]> = {
  ADMIN_CREATE: [
    { path: '/admin', label: '管理后台' },
  ],
  ADMIN_APPROVE: [
    { path: '/admin', label: '管理后台' },
  ],
  EMPLOYEE: [
    { path: '/employee', label: '我的权益' },
  ],
}

export function useNavRole(): UserRole {
  const [role, setRole] = useState<UserRole>('ADMIN_CREATE')

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
  return ROLE_NAV_CONFIG[role] || ROLE_NAV_CONFIG.ADMIN_CREATE
}