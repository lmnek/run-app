import { z } from "zod";
import dotenv from 'dotenv';

dotenv.config()

// Validate env variables
const envSchema = z.object({
    OPENAI_API_KEY: z.string(),
    OPENROUTER_API_KEY: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    CLERK_SECRET_KEY: z.string(),
    CLERK_JWT_PEM: z.string(),
    DB_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    ENV: z.union([z.literal('production'), z.literal('development')])
        .default('development'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http',
        'verbose', 'debug', 'silly'])
})
export const ENV = envSchema.parse(process.env)
