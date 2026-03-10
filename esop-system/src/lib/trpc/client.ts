import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/lib/router'

export const trpc = createTRPCReact<AppRouter>()