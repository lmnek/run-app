import { logger } from '../utils/logger.js';

// Data element: Error context
export interface ErrorContext {
    shape: any;
    error: any;
    ctx: any;
}

// Constants
export const FIRST_NARRATION_URL_ERROR_MESSAGE = 'First narration url not yet ready.';

// Task element: Error formatting
export class ErrorFormatter {
    static format({ shape, error, ctx }: ErrorContext) {
        if (error.message !== FIRST_NARRATION_URL_ERROR_MESSAGE) {
            logger.warn(`Error for user ${ctx?.user?.userId}`, { error, shape });
        }
        return shape;
    }
}
