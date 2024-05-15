import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '../../server/src/root';
import { inferRouterInputs } from '@trpc/server';

// Import the tRPC router from the server
// with all of the type definitions!
export const trpc = createTRPCReact<AppRouter>()

// Infer input types to some procedures
type RouterInput = inferRouterInputs<AppRouter>
type startRunInput = RouterInput['narration']['startRun']
export type Voice = startRunInput['voice']
export type LlmModel = startRunInput['llmModel']
export type Temperature = startRunInput['temperature']
export type PrivateData = startRunInput['privateData']

// No caching settings for ReactQuery
export const noCachingOptions = {
    // disable caching
    cacheTime: 0,
    staleTime: 0,
    // disable automatic refetch 
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
}

