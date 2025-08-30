import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { RequestContext } from './context.js';
import { ErrorFormatter } from './error-handling.js';

// Data element: tRPC context type
export type Context = RequestContext;

// Task element: tRPC initialization
export class TRPCInitializer {
    static create() {
        return initTRPC
            .context<Context>()
            .create({
                transformer: superjson,
                // Pretty print error when the procedure errors out
                errorFormatter: ({ shape, error, ctx }) => {
                    return ErrorFormatter.format({ shape, error, ctx });
                }
            });
    }
}

// Create the tRPC instance
export const t = TRPCInitializer.create();
