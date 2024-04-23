import 'dotenv/config';
import { db } from './db';
import { migrate } from "drizzle-orm/neon-http/migrator";
import path from 'path';

// This will run migrations on the database, skipping the ones already applied
const main = async () => {
    try {
        await migrate(db, { migrationsFolder: path.resolve() + '/drizzle' });
        console.log("Migration completed");
    } catch (error) {
        console.error("Error during migration:", error);
        process.exit(1);
    }
};
main();
