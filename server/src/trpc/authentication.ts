import { TRPCError } from '@trpc/server';
import { t } from './core.js';
import getUserStore from '../utils/redisStore.js';
import { UserContext } from './context.js';

// Data element: Authenticated context
export interface AuthenticatedContext {
    user: UserContext; // non-null
    store: ReturnType<typeof getUserStore>;
}

// Task element: Authentication middleware
export class AuthenticationMiddleware {
    static create() {
        return t.middleware(async function isAuthed(opts: any) {
            const { ctx } = opts;
            
            // Check if user is authorized
            if (!ctx?.user) {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            // Create new context with user data and store
            return opts.next({
                ctx: {
                    user: ctx.user, // non-null
                    store: getUserStore(ctx.user.userId)
                } as AuthenticatedContext
            });
        });
    }
}
