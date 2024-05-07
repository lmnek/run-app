import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';
import { ENV } from './src/utils/env'

config()

export default {
    schema: './src/db/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: ENV.DB_URL,
    },
    verbose: true,
    strict: true,
} satisfies Config;
