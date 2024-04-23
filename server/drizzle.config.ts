import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

config()

export default {
    schema: './src/db/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DB_URL!,
    },
    verbose: true,
    strict: true,
} satisfies Config;
