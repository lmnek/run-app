import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/src/trpc';

export const trpc = createTRPCReact<AppRouter>();

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

