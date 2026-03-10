import { createContext } from '@/lib/trpc/trpc'
import { appRouter } from '@/lib/router'
import * as trpcNext from '@trpc/server/adapters/next'

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
})