import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { DatabaseConnection, DatabaseConfig } from '../index.js';

// Task element: Drizzle-specific database connection
export class DrizzleConnection extends DatabaseConnection {
    private sql: any;
    private drizzleDb: any;
    private connected: boolean = false;
    
    constructor(config: DatabaseConfig) {
        super(config);
        this.sql = neon(config.url);
        this.drizzleDb = drizzle(this.sql, { schema: config.schema });
    }
    
    async connect(): Promise<void> {
        try {
            // Test connection by executing a simple query
            await this.sql`SELECT 1`;
            this.connected = true;
        } catch (error) {
            this.connected = false;
            throw new Error(`Failed to connect to database: ${error}`);
        }
    }
    
    async disconnect(): Promise<void> {
        // Neon serverless doesn't require explicit disconnection
        this.connected = false;
    }
    
    isConnected(): boolean {
        return this.connected;
    }
    
    // Drizzle-specific getter
    getDrizzleDb() {
        return this.drizzleDb;
    }
    
    getSql() {
        return this.sql;
    }
}
