import { TRPCError, initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import jwt from "jsonwebtoken";
import getUserStore from './utils/redisStore';
import { ENV } from './utils/env';
import { logger } from './utils/logger';

// File for setting up the tRPC infrastructure!

// Authorization:
// Creating the context from JWT token
// The token is verified and then user data are appended to the context
export const createContext = async ({
    req, res: _,
}: trpcExpress.CreateExpressContextOptions) => {
    async function getUserFromHeader() {
        if (!req.headers.authorization) {
            return null
        }
        const authorization = req.headers.authorization
        const jwtToken = authorization.replace("Bearer ", "")
        const publicKey = ENV.CLERK_JWT_PEM
        try {
            // WARN: not verified 'exp', 'nbf' and 'azp'
            const decoded: any = jwt.verify(jwtToken, publicKey)
            return { sessionId: decoded.sid, userId: decoded.sub }
        } catch (error) {
            logger.warn('Cant verify JWT', { error })
            return null
        }
    }
    const user = await getUserFromHeader()
    logger.verbose('%s on %s', user?.userId, req.path)
    return { user };

};
export type Context = Awaited<ReturnType<typeof createContext>>;

export const firstNarationUrlErrorMessage = 'First naration url not yet ready.'

// Create the initilization method for tRPC router
export const t = initTRPC
    .context<Context>()
    .create({
        // Pretty print error when the procedure errors out
        errorFormatter: ({ shape, error, ctx }) => {
            if (error.message !== firstNarationUrlErrorMessage) {
                logger.warn(`Error for user ${ctx?.user?.userId}`, { error })
            }
            return shape
        }
    })

// Adding the authorization middleware to the router
const isAuthed = t.middleware(async function isAuthed(opts) {
    // Authorized?
    const { ctx } = opts
    if (!ctx?.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    // New contexts with user data
    // available for the procedure
    return opts.next({
        ctx: {
            user: ctx.user, // non-null
            store: getUserStore(ctx.user.userId)
        }
    })
})

export const createTRPCRouter = t.router

export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
