import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema.js';
import 'dotenv/config'
import { ENV } from '../utils/env.js';

// The database object that Drizzle ORM works with
const url = ENV.DB_URL
const sql = neon(url);
export const db = drizzle(sql, { schema });
