import { z } from "zod";
import dotenv from 'dotenv';

// ============================================================================
// CONSTANTS - Configuration values
// ============================================================================

const DEFAULT_ENV = 'development';
const DEFAULT_LOG_LEVEL = 'info';

// ============================================================================
// DATA ELEMENTS - Environment configuration schema
// ============================================================================

// Data element: Environment variables schema
const envSchema = z.object({
    OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
    OPENROUTER_API_KEY: z.string().min(1, 'OpenRouter API key is required'),
    AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS access key is required'),
    AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS secret key is required'),
    CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
    CLERK_JWT_PEM: z.string().min(1, 'Clerk JWT PEM is required'),
    DB_URL: z.string().url('Database URL must be a valid URL'),
    REDIS_URL: z.string().url('Redis URL must be a valid URL'),
    ENV: z.union([z.literal('production'), z.literal('development')])
        .default(DEFAULT_ENV),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
        .default(DEFAULT_LOG_LEVEL)
});

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Environment loader
export class EnvironmentLoader {
    static load(): void {
        dotenv.config();
    }
}

// Task element: Environment validator
export class EnvironmentValidator {
    static validate(): z.infer<typeof envSchema> {
        try {
            return envSchema.parse(process.env);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
                throw new Error(`Environment validation failed. Missing or invalid variables: ${missingVars}`);
            }
            throw error;
        }
    }
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Environment initialization workflow
export class EnvironmentInitializationWorkflow {
    static execute(): z.infer<typeof envSchema> {
        EnvironmentLoader.load();
        return EnvironmentValidator.validate();
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Validated environment configuration
export const ENV = EnvironmentInitializationWorkflow.execute();
