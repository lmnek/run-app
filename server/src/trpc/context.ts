import * as trpcExpress from '@trpc/server/adapters/express';
import jwt from "jsonwebtoken";
import { ENV } from '../utils/env.js';
import { logger } from '../utils/logger.js';

// Data element: User context data
export interface UserContext {
    sessionId: string;
    userId: string;
}

// Data element: Request context
export interface RequestContext {
    user: UserContext | null;
}

// Task element: JWT verification
export class JWTVerifier {
    private readonly publicKey: string;

    constructor(publicKey: string) {
        this.publicKey = publicKey;
    }

    async verifyToken(token: string): Promise<UserContext | null> {
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

// Factory function for creating context creator
export function createContextCreator(): ContextCreator {
    const jwtVerifier = new JWTVerifier(ENV.CLERK_JWT_PEM);
    return new ContextCreator(jwtVerifier);
}
