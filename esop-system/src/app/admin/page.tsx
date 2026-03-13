'use client'

import { useEffect, useState } from 'react'

interface Stats {
  plans: number
  plansActive: number
  employees: number
  employeesActive: number
  grants: number
  grantsPending: number
  taxEvents: number
  taxEventsPending: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    plans: 0,
    plansActive: 0,
    employees: 0,
    employeesActive: 0,
    grants: 0,
    grantsPending: 0,
    taxEvents: 0,
    taxEventsPending: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-medium text-yellow-800">数据库连接失败</h3>
            <p className="text-sm text-yellow-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
      
      {/* 数据概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">激励计划</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.plans}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span className="text-green-600">{stats.plansActive}</span> 个进行中
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">在册员工</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.employees}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span className="text-green-600">{stats.employeesActive}</span> 人活跃
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">授予记录</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.grants}</p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span className="text-orange-600">{stats.grantsPending}</span> 个待处理
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">税务事件</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.taxEvents}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span className="text-red-600">{stats.taxEventsPending}</span> 个待确认
          </div>
        </div>
      </div>
      
      {/* 快捷操作 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="/admin/plans/new" 
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">➕</span>
            <div>
              <p className="font-medium text-gray-900">新建计划</p>
              <p className="text-sm text-gray-500">创建激励计划池</p>
            </div>
          </a>
          
          <a 
            href="/admin/employees/new" 
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">👤</span>
            <div>
              <p className="font-medium text-gray-900">添加员工</p>
              <p className="text-sm text-gray-500">录入员工信息</p>
            </div>
          </a>
          
          <a 
            href="/admin/grants/new" 
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-medium text-gray-900">创建授予</p>
              <p className="text-sm text-gray-500">授予员工权益</p>
            </div>
          </a>
        </div>
      </div>
      
      {/* 最近活动 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h2>
        <div className="text-center py-8 text-gray-500">
          暂无活动记录
        </div>
      </div>
    </div>
  )
}