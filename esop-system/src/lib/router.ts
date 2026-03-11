import { z } from 'zod'
import { router, publicProcedure } from '../lib/trpc'
import { PlanType, Jurisdiction, PlanStatus, LegalIdentity, BankAccountType, EmployeeStatus, GrantStatus } from '@prisma/client'
import { calculateVestingSchedule } from '../vesting'

// ==================== 计划相关路由 ====================
export const planRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }),
  
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.plan.findUnique({
        where: { id: input.id },
        include: { 
          grants: {
            include: { employee: true },
          },
        },
      })
    }),
    
  create: publicProcedure
    .input(z.object({
      title: z.string(),
      type: z.nativeEnum(PlanType),
      applicableJurisdiction: z.nativeEnum(Jurisdiction),
      poolSize: z.number(),
      effectiveDate: z.coerce.date(),
      boardApprovalId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.plan.create({
        data: {
          title: input.title,
          type: input.type,
          applicableJurisdiction: input.applicableJurisdiction,
          poolSize: input.poolSize,
          effectiveDate: input.effectiveDate,
          boardApprovalId: input.boardApprovalId,
          status: PlanStatus.DRAFT,
        },
      })
    }),
    
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      poolSize: z.number().optional(),
      status: z.nativeEnum(PlanStatus).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.plan.update({
        where: { id },
        data,
      })
    }),
    
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.plan.delete({
        where: { id: input.id },
      })
    }),
})

// ==================== 员工相关路由 ====================
export const employeeRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { grants: true },
        },
      },
    })
  }),
  
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.employee.findUnique({
        where: { id: input.id },
        include: { 
          grants: {
            include: { plan: true },
          },
        },
      })
    }),
    
  byEmployeeId: publicProcedure
    .input(z.object({ employeeId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.employee.findUnique({
        where: { employeeId: input.employeeId },
      })
    }),
    
  create: publicProcedure
    .input(z.object({
      employeeId: z.string(),
      name: z.string(),
      legalIdentity: z.nativeEnum(LegalIdentity),
      taxJurisdiction: z.nativeEnum(Jurisdiction),
      employmentEntity: z.string().optional(),
      bankAccountType: z.nativeEnum(BankAccountType).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.employee.create({
        data: {
          employeeId: input.employeeId,
          name: input.name,
          legalIdentity: input.legalIdentity,
          taxJurisdiction: input.taxJurisdiction,
          employmentEntity: input.employmentEntity,
          bankAccountType: input.bankAccountType,
          status: EmployeeStatus.ACTIVE,
        },
      })
    }),
    
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      legalIdentity: z.nativeEnum(LegalIdentity).optional(),
      taxJurisdiction: z.nativeEnum(Jurisdiction).optional(),
      status: z.nativeEnum(EmployeeStatus).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.employee.update({
        where: { id },
        data,
      })
    }),
    
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.employee.delete({
        where: { id: input.id },
      })
    }),
})

// ==================== 授予相关路由 ====================
export const grantRouter = router({
  list: publicProcedure
    .input(z.object({
      employeeId: z.string().optional(),
      planId: z.string().optional(),
      status: z.nativeEnum(GrantStatus).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.grant.findMany({
        where: input ? {
          employeeId: input.employeeId,
          planId: input.planId,
          status: input.status,
        } : undefined,
        include: { 
          plan: true, 
          employee: true,
          vestingEvents: {
            orderBy: { vestDate: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),
  
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.grant.findUnique({
        where: { id: input.id },
        include: { 
          plan: true, 
          employee: true,
          vestingEvents: {
            orderBy: { vestDate: 'asc' },
          },
          taxEvents: true,
        },
      })
    }),
    
  create: publicProcedure
    .input(z.object({
      planId: z.string(),
      employeeId: z.string(),
      quantity: z.number(),
      strikePrice: z.number().optional(),
      grantDate: z.coerce.date(),
      vestingStartDate: z.coerce.date(),
      vestingSchedule: z.enum(['4_YEAR_1_YEAR_CLIFF', '4_YEAR_MONTHLY', '3_YEAR_1_YEAR_CLIFF', 'IMMEDIATE']),
    }))
    .mutation(async ({ ctx, input }) => {
      // 获取计划信息以确定类型
      const plan = await ctx.prisma.plan.findUnique({
        where: { id: input.planId },
      })
      
      if (!plan) {
        throw new Error('计划不存在')
      }
      
      // 创建授予
      const grant = await ctx.prisma.grant.create({
        data: {
          planId: input.planId,
          employeeId: input.employeeId,
          quantity: input.quantity,
          strikePrice: input.strikePrice,
          grantDate: input.grantDate,
          vestingStartDate: input.vestingStartDate,
          type: plan.type,
          status: GrantStatus.GRANTED,
        },
      })
      
      // 计算归属事件
      const schedule = calculateVestingSchedule(
        input.quantity,
        input.vestingStartDate,
        input.vestingSchedule
      )
      
      // 创建归属事件记录
      await ctx.prisma.vestingEvent.createMany({
        data: schedule.events.map(event => ({
          grantId: grant.id,
          vestDate: event.date,
          quantity: event.quantity,
          cumulativeQty: event.cumulativeQuantity,
          status: 'PENDING',
        })),
      })
      
      return grant
    }),
    
  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.nativeEnum(GrantStatus),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.grant.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    }),
    
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 先删除关联的归属事件
      await ctx.prisma.vestingEvent.deleteMany({
        where: { grantId: input.id },
      })
      
      return ctx.prisma.grant.delete({
        where: { id: input.id },
      })
    }),
})

// ==================== 统计路由 ====================
export const statsRouter = router({
  overview: publicProcedure.query(async ({ ctx }) => {
    const [
      planCount,
      activePlanCount,
      employeeCount,
      activeEmployeeCount,
      grantCount,
      pendingGrantCount,
      taxEventCount,
      pendingTaxEventCount,
    ] = await Promise.all([
      ctx.prisma.plan.count(),
      ctx.prisma.plan.count({ where: { status: PlanStatus.ACTIVE } }),
      ctx.prisma.employee.count(),
      ctx.prisma.employee.count({ where: { status: EmployeeStatus.ACTIVE } }),
      ctx.prisma.grant.count(),
      ctx.prisma.grant.count({ where: { status: GrantStatus.GRANTED } }),
      ctx.prisma.taxEvent.count(),
      ctx.prisma.taxEvent.count({ where: { status: 'TRIGGERED' } }),
    ])
    
    return {
      plans: {
        total: planCount,
        active: activePlanCount,
      },
      employees: {
        total: employeeCount,
        active: activeEmployeeCount,
      },
      grants: {
        total: grantCount,
        pending: pendingGrantCount,
      },
      taxEvents: {
        total: taxEventCount,
        pending: pendingTaxEventCount,
      },
    }
  }),
})

// ==================== 汇总路由 ====================
export const appRouter = router({
  plan: planRouter,
  employee: employeeRouter,
  grant: grantRouter,
  stats: statsRouter,
})

export type AppRouter = typeof appRouter