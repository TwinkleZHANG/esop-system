import { z } from 'zod'
import { router, publicProcedure } from '../lib/trpc'
import { PlanType, Jurisdiction, PlanStatus } from '@prisma/client'

// 计划相关路由
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
        include: { grants: true },
      })
    }),
    
  create: publicProcedure
    .input(z.object({
      title: z.string(),
      type: z.nativeEnum(PlanType),
      applicableJurisdiction: z.nativeEnum(Jurisdiction),
      poolSize: z.number(),
      effectiveDate: z.date(),
      boardApprovalId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.plan.create({
        data: {
          ...input,
          poolSize: input.poolSize,
          effectiveDate: input.effectiveDate,
        },
      })
    }),
})

// 员工相关路由
export const employeeRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }),
  
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.employee.findUnique({
        where: { id: input.id },
        include: { grants: true },
      })
    }),
})

// 授予相关路由
export const grantRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.grant.findMany({
      include: { plan: true, employee: true },
      orderBy: { createdAt: 'desc' },
    })
  }),
  
  byEmployee: publicProcedure
    .input(z.object({ employeeId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.grant.findMany({
        where: { employeeId: input.employeeId },
        include: { plan: true, vestingEvents: true, taxEvents: true },
      })
    }),
})

// 汇总路由
export const appRouter = router({
  plan: planRouter,
  employee: employeeRouter,
  grant: grantRouter,
})

export type AppRouter = typeof appRouter