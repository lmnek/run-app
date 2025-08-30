import * as trpcExpress from '@trpc/server/adapters/express';
import { createContextCreator } from './context.js';

// Legacy compatibility: maintains the old createContext function signature
// This ensures existing code continues to work without modification
export const createContext = async ({
    req, res: _,
}: trpcExpress.CreateExpressContextOptions) => {
    const contextCreator = createContextCreator();
    return await contextCreator.createContext({ req, res });
};
