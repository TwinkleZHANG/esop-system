'use client'

import { useState } from 'react'

export default function NewGrantPage() {
  const [formData, setFormData] = useState({
    employeeId: '',
    planId: '',
    quantity: '',
    strikePrice: '',
    grantDate: '',
    vestingStartDate: '',
    vestingSchedule: '4_YEAR_1_YEAR_CLIFF',
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 调用 tRPC API 创建授予
    console.log('创建授予:', formData)
    alert('功能开发中，请先配置数据库')
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/grants" className="text-gray-500 hover:text-gray-700">← 返回</a>
        <h1 className="text-2xl font-bold text-gray-900">创建授予</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 选择员工和计划 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 选择员工 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择员工 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">请选择员工</option>
                {/* TODO: 从数据库加载员工列表 */}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                没有员工？<a href="/admin/employees/new" className="text-blue-600 hover:underline">先添加员工</a>
              </p>
            </div>
            
            {/* 选择计划 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择计划 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">请选择计划</option>
                {/* TODO: 从数据库加载计划列表 */}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                没有计划？<a href="/admin/plans/new" className="text-blue-600 hover:underline">先创建计划</a>
              </p>
            </div>
          </div>
        </div>
        
        {/* 授予详情 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">授予详情</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 授予数量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                授予数量 <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10000"
                  required
                />
                <span className="border border-l-0 border-gray-300 rounded-r-lg px-3 py-2 bg-gray-50 text-gray-500">
                  股
                </span>
              </div>
            </div>
            
            {/* 行权价（仅 Option） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                行权价（仅期权需要）
              </label>
              <div className="flex">
                <input
                  type="number"
                  step="0.0001"
                  value={formData.strikePrice}
                  onChange={(e) => setFormData({ ...formData, strikePrice: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1.0000"
                />
                <span className="border border-l-0 border-gray-300 rounded-r-lg px-3 py-2 bg-gray-50 text-gray-500">
                  USD
                </span>
              </div>
            </div>
            
            {/* 授予日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                授予日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.grantDate}
                onChange={(e) => setFormData({ ...formData, grantDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            {/* 归属开始日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                归属开始日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.vestingStartDate}
                onChange={(e) => setFormData({ ...formData, vestingStartDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>
        
        {/* 归属计划 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">归属计划</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              归属方式 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vestingSchedule}
              onChange={(e) => setFormData({ ...formData, vestingSchedule: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="4_YEAR_1_YEAR_CLIFF">4年归属 + 1年悬崖（25% + 25% × 3年）</option>
              <option value="4_YEAR_MONTHLY">4年归属 + 月归属（无悬崖）</option>
              <option value="3_YEAR_1_YEAR_CLIFF">3年归属 + 1年悬崖</option>
              <option value="IMMEDIATE">一次性归属</option>
            </select>
            <p className="text-sm text-gray-500 mt-2">
              💡 提示：常见的归属计划是 4 年归属 + 1 年悬崖，即满 1 年归属 25%，之后每月归属剩余部分的 1/36
            </p>
          </div>
          
          {/* 归属预览 */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">归属预览</h3>
            <div className="text-sm text-gray-600">
              {formData.quantity ? (
                <div className="space-y-1">
                  <p>总授予：{Number(formData.quantity).toLocaleString()} 股</p>
                  {formData.vestingSchedule === '4_YEAR_1_YEAR_CLIFF' && (
                    <>
                      <p>1 年后：{Math.floor(Number(formData.quantity) * 0.25).toLocaleString()} 股（25%）</p>
                      <p>之后每月：{Math.floor(Number(formData.quantity) * 0.75 / 36).toLocaleString()} 股</p>
                    </>
                  )}
                </div>
              ) : (
                <p>请输入授予数量</p>
              )}
            </div>
          </div>
        </div>
        
        {/* 提交按钮 */}
        <div className="flex justify-end gap-3">
          <a
            href="/admin/grants"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            取消
          </a>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            创建授予
          </button>
        </div>
      </form>
    </div>
  )
}