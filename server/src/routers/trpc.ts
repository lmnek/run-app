import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import * as trpcExpress from '@trpc/server/adapters/express';
import jwt from "jsonwebtoken";
import { TRPCError } from '@trpc/server';
import { ENV } from '../utils/env.js';
import { logger } from '../utils/logger.js';
import getUserStore from '../utils/redisStore.js';

// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: User context data
export interface UserContext {
    sessionId: string;
    userId: string;
}

// Data element: Request context
export interface RequestContext {
    user: UserContext | null;
}

// Data element: Authenticated context
export interface AuthenticatedContext {
    user: UserContext; // non-null
    store: ReturnType<typeof getUserStore>;
}

// Data element: Error context
export interface ErrorContext {
    shape: any;
    error: any;
    ctx: any;
}

// Data element: JWT verification result
export interface JWTVerificationResult {
    sessionId: string;
    userId: string;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: JWT verification
export class JWTVerifier {
    private readonly publicKey: string;

    constructor(publicKey: string) {
        this.publicKey = publicKey;
    }

    async verifyToken(token: string): Promise<JWTVerificationResult | null> {
        try {
            // WARN: not verified 'exp', 'nbf' and 'azp'
            const decoded: any = jwt.verify(token, this.publicKey);
            return { sessionId: decoded.sid, userId: decoded.sub };
        } catch (error) {
            logger.warn('Cannot verify JWT', { error });
            return null;
        }
    }
}

// Task element: Authorization header parsing
export class AuthorizationParser {
    static extractToken(authorization: string): string | null {
        if (!authorization.startsWith('Bearer ')) {
            return null;
        }
        return authorization.replace("Bearer ", "");
    }
}

// Task element: Context creation
export class ContextCreator {
    private readonly jwtVerifier: JWTVerifier;

    constructor(jwtVerifier: JWTVerifier) {
        this.jwtVerifier = jwtVerifier;
    }

    async createContext({ req }: trpcExpress.CreateExpressContextOptions): Promise<RequestContext> {
        const user = await this.getUserFromHeader(req);
        logger.verbose('%s on %s', user?.userId, req.path);
        return { user };
    }

    private async getUserFromHeader(req: any): Promise<UserContext | null> {
        if (!req.headers.authorization) {
            return null;
        }
        
        const token = AuthorizationParser.extractToken(req.headers.authorization);
        if (!token) {
            return null;
        }

        return await this.jwtVerifier.verifyToken(token);
    }
}

// Task element: Error formatting
export class ErrorFormatter {
    static format({ shape, error, ctx }: { shape: any; error: any; ctx: any }) {
        if (error.message !== FIRST_NARRATION_URL_ERROR_MESSAGE) {
            logger.warn(`Error for user ${ctx?.user?.userId}`, { error, shape });
        }
        return shape;
    }
}

// Task element: tRPC initialization
export class TRPCInitializer {
    static create() {
        return initTRPC
            .context<RequestContext>()
            .create({
                transformer: superjson,
                // Pretty print error when the procedure errors out
                errorFormatter: ({ shape, error, ctx }) => {
                    return ErrorFormatter.format({ shape, error, ctx });
                }
            });
    }
}

// Task element: Router creation
export class RouterCreator {
    static create(tInstance: any) {
        return tInstance.router;
    }
}

// Task element: Procedure creation
export class ProcedureCreator {
    static createPublic(tInstance: any) {
        return tInstance.procedure;
    }

    static createProtected(tInstance: any) {
        return tInstance.procedure.use(AuthenticationMiddleware.create());
    }
}

// Task element: Authentication middleware
export class AuthenticationMiddleware {
    static create() {
        return t.t.middleware(async function isAuthed(opts: any) {
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

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Context creation workflow
export class ContextCreationWorkflow {
    static async execute(req: any): Promise<RequestContext> {
        const jwtVerifier = new JWTVerifier(ENV.CLERK_JWT_PEM);
        const contextCreator = new ContextCreator(jwtVerifier);
        return await contextCreator.createContext({ req, res: {} as any });
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: tRPC instance
export const t = TRPCInitializer.create();

// Connector element: Router and procedure factories
export const createTRPCRouter = RouterCreator.create(t);
export const publicProcedure = ProcedureCreator.createPublic(t);
export const protectedProcedure = ProcedureCreator.createProtected(t);

// Connector element: Context creation factory
export function createContextCreator(): ContextCreator {
    const jwtVerifier = new JWTVerifier(ENV.CLERK_JWT_PEM);
    return new ContextCreator(jwtVerifier);
}

// ============================================================================
// TRIGGER ELEMENTS - Control when actions are triggered
// ============================================================================

// Trigger element: Legacy context creation (maintains backward compatibility)
export const createContext = async ({
    req, res: _,
}: trpcExpress.CreateExpressContextOptions) => {
    return await ContextCreationWorkflow.execute(req);
};

// ============================================================================
// CONSTANTS - Error messages and configuration
// ============================================================================

// Constants
export const FIRST_NARRATION_URL_ERROR_MESSAGE = 'First narration url not yet ready.';

// ============================================================================
// TYPE EXPORTS - Maintain backward compatibility
// ============================================================================

// Re-export types for backward compatibility
export type Context = RequestContext;
