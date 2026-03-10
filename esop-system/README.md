# 股权激励系统 (ESOP System)

公司股权激励计划管理系统 - 支持 RSU、期权、虚拟股权等多种激励工具。

## 🎯 功能模块

### 1. 基础设置
- **激励计划池管理** - 创建和管理 RSU/Option/虚拟股权/LP份额 计划
- **员工档案** - 维护员工税务身份、法域、用工主体信息
- **持股实体库** - 管理持股平台信息
- **估值管理** - 记录公司估值历史

### 2. 授予管理
- 创建授予记录
- 追踪归属进度
- 状态流转管理

### 3. 税务事件
- 自动识别税务触发点
- 导出数据给第三方算税
- 税务状态追踪

### 4. 资产管理
- 员工资产持仓表
- 资产流水记录

## 👥 用户角色

| 角色 | 权限 |
|------|------|
| HR 管理员 | 计划管理、人员管理、授予操作 |
| 财务/税务 | 税务事件处理、估值录入 |
| 法务/合规 | 审批、模板审核 |
| 审计 | 只读访问，审计日志导出 |
| 员工 | 只读，个人权益视图 |

## 🛠 技术栈

- **前端**: Next.js 14 + React + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + tRPC
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: NextAuth.js

## 📁 项目结构

```
esop-system/
├── prisma/
│   └── schema.prisma      # 数据库模型定义
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API 路由
│   │   ├── admin/         # 管理后台页面
│   │   └── employee/      # 员工视图页面
│   ├── components/        # React 组件
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 工具库
│   │   ├── db/            # 数据库连接
│   │   ├── trpc/          # tRPC 配置
│   │   └── router.ts      # API 路由定义
│   └── types/             # TypeScript 类型定义
└── package.json
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置数据库
创建 `.env` 文件：
```
DATABASE_URL="postgresql://user:password@localhost:5432/esop?schema=public"
```

### 3. 初始化数据库
```bash
npx prisma migrate dev --name init
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 📊 数据模型

### 核心实体
- **Plan** - 激励计划
- **Employee** - 员工档案
- **Grant** - 授予记录
- **VestingEvent** - 归属事件
- **TaxEvent** - 税务事件
- **AssetPosition** - 资产持仓

### 状态流转

#### RSU 状态
```
GRANTED → VESTING → VESTED → SETTLED
                    ↓
                CANCELLED/FORFEITED
```

#### Option 状态
```
GRANTED → VESTING → VESTED → EXERCISED → SETTLED
                    ↓
                CANCELLED/FORFEITED
```

## 📝 License

MIT