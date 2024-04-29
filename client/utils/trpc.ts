import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '../../server/src/root';
import { inferRouterInputs } from '@trpc/server';

export const trpc = createTRPCReact<AppRouter>()

type RouterInput = inferRouterInputs<AppRouter>

type startRunInput = RouterInput['naration']['startRun']
export type Voice = startRunInput['voice']
export type LlmModel = startRunInput['llmModel']
export type Temperature = startRunInput['temperature']

// for ReactQuery
export const noCachingOptions = {
    // disable caching
    cacheTime: 0,
    staleTime: 0,
    // disable automatic refetch 
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
}

