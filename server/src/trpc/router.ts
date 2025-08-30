import { t } from './core.js';
import { AuthenticationMiddleware } from './authentication.js';

// Task element: Router creation
export class RouterCreator {
    static create() {
        return t.router;
    }
}

// Task element: Procedure creation
export class ProcedureCreator {
    static createPublic() {
        return t.procedure;
    }

    static createProtected() {
        return t.procedure.use(AuthenticationMiddleware.create());
    }
}

// Export the router creator and procedures
export const createTRPCRouter = RouterCreator.create();
export const publicProcedure = ProcedureCreator.createPublic();
export const protectedProcedure = ProcedureCreator.createProtected();
