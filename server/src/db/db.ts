import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import 'dotenv/config'

const url = process.env.DB_URL!
const sql = neon(url);
export const db = drizzle(sql, { schema });
