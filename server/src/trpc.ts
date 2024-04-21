import { TRPCError, initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import jwt from "jsonwebtoken";

// For Authorization - extract JWT into context
export const createContext = async ({
    req, res,
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
            console.log('cant verify')
            return null
        }
    }
    const user = await getUserFromHeader()
    return { user };

};
export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC
    .context<Context>()
    .create();

const isAuthed = t.middleware(async function isAuthed(opts) {
    const { ctx } = opts
    if (!ctx?.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    // console.log("Ctx user: ", ctx.user)

    // New context
    return opts.next({
        ctx: {
            user: ctx.user // non-null
        }
    })
})

export const createTRPCRouter = t.router

export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
