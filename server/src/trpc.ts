import { TRPCError, initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import jwt from "jsonwebtoken";
import getUserStore from './utils/redisStore';
import superjson from 'superjson';

// For Authorization - extract JWT into context
export const createContext = async ({
    req, res: _,
}: trpcExpress.CreateExpressContextOptions) => {
    async function getUserFromHeader() {
        if (!req.headers.authorization) {
            return null
        }
        const authorization = req.headers.authorization
        const jwtToken = authorization.replace("Bearer ", "")
        const publicKey = process.env.CLERK_JWT_PEM!
        try {
            // WARN: not verified 'exp', 'nbf' and 'azp'
            const decoded: any = jwt.verify(jwtToken, publicKey)
            return { sessionId: decoded.sid, userId: decoded.sub }
        } catch (error) {
            console.log('Cant verify JWT')
            return null
        }
    }
    const user = await getUserFromHeader()
    console.log(`${user?.userId} on ${req.path}`)
    return { user };

};
export type Context = Awaited<ReturnType<typeof createContext>>;

export const firstNarationUrlErrorMessage = 'First naration url not yet ready.'
export const t = initTRPC
    .context<Context>()
    .create({
        // transformer: superjson,
        errorFormatter: ({ shape, error, ctx }) => {
            if (error.message !== firstNarationUrlErrorMessage) {
                console.log('Error for user ', ctx?.user?.userId, ': ', error)
            }
            return shape
        }
    })

const isAuthed = t.middleware(async function isAuthed(opts) {
    const { ctx } = opts
    if (!ctx?.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    // New context
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
