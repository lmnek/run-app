// Main export file for tRPC infrastructure
// This maintains backward compatibility while providing access to the refactored modules

// Re-export the main tRPC instance and context
export { t, type Context } from './core.js';

// Re-export router creation and procedures
export { 
    createTRPCRouter, 
    publicProcedure, 
    protectedProcedure 
} from './router.js';

// Re-export context creation for external use
export { 
    createContextCreator,
    type UserContext,
    type RequestContext 
} from './context.js';

// Re-export authentication types
export { type AuthenticatedContext } from './authentication.js';

// Re-export error handling constants
export { FIRST_NARRATION_URL_ERROR_MESSAGE } from './error-handling.js';

// Legacy compatibility: export the createContext function
// This maintains backward compatibility for existing code
export { createContext } from './legacy-compatibility.js';
