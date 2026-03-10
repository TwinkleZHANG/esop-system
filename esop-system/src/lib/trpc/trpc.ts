import { z } from 'zod'
import { initTRPC } from '@trpc/server'
import { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { Session } from 'next-auth'
import { getSession } from 'next-auth/react'
import { prisma } from './db/prisma'

interface CreateContextOptions {
  session: Session | null
}

export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getSession(opts)
  
  return {
    session,
    prisma,
  }
}

type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new Error('Not authenticated')
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})