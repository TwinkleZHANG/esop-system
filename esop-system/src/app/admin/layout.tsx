'use client'

import { useEffect, useState } from 'react'
import { useUserRole, ROLE_INFO, type UserRole } from '@/components/RoleSwitcher'

const MENU_ITEMS = [
  { key: 'overview', href: '/admin', label: '概览', icon: '📊', roles: ['ADMIN_CREATE', 'ADMIN_APPROVE'] },
  { key: 'plans', href: '/admin/plans', label: '激励计划', icon: '📋', roles: ['ADMIN_CREATE', 'ADMIN_APPROVE'] },
  { key: 'employees', href: '/admin/employees', label: '员工档案', icon: '👥', roles: ['ADMIN_CREATE', 'ADMIN_APPROVE'] },
  { key: 'grants', href: '/admin/grants', label: '授予管理', icon: '📝', roles: ['ADMIN_CREATE', 'ADMIN_APPROVE'] },
  { key: 'holding-entities', href: '/admin/holding-entities', label: '持股主体库', icon: '🏢', roles: ['ADMIN_CREATE', 'ADMIN_APPROVE'] },
  { key: 'tax-events', href: '/admin/tax-events', label: '税务事件', icon: '💰', roles: ['ADMIN_CREATE', 'ADMIN_APPROVE'] },
  { key: 'valuations', href: '/admin/valuations', label: '估值管理', icon: '📈', roles: ['ADMIN_CREATE', 'ADMIN_APPROVE'] },
  { key: 'assets', href: '/admin/assets', label: '资产管理', icon: '🏦', roles: ['ADMIN_CREATE', 'ADMIN_APPROVE'] },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const role = useUserRole()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const visibleMenus = MENU_ITEMS.filter(item => item.roles.includes(role))

  if (!mounted) {
    return (
      <div className="flex min-h-[calc(100vh-80px)]">
        <aside className="w-64 bg-white border-r border-gray-200 p-4">
          <nav className="space-y-1">
            {MENU_ITEMS.map(item => (
              <div key={item.key} className="block px-4 py-2 rounded-lg text-gray-400">
                {item.icon} {item.label}
              </div>
            ))}
          </nav>
        </aside>
        <div className="flex-1 p-6">{children}</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      {/* 侧边栏 */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
        {/* 角色提示 */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">{ROLE_INFO[role].icon}</span>
            <span className="font-medium text-blue-700">{ROLE_INFO[role].label}</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">{ROLE_INFO[role].description}</p>
        </div>
        
        <nav className="space-y-1">
          {visibleMenus.map((item, index) => (
            <a 
              key={item.key}
              href={item.href} 
              className={`block px-4 py-2 rounded-lg ${
                index === 0 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon} {item.label}
            </a>
          ))}
        </nav>
      </aside>
      
      {/* 主内容区 */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  )
}