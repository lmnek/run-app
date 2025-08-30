import { TransactionManager } from '../index.js';
import { DrizzleConnection } from './DrizzleConnection.js';

// Task element: Drizzle-specific transaction management
export class DrizzleTransactionManager extends TransactionManager {
    private connection: DrizzleConnection;
    private inTransaction: boolean = false;
    
    constructor(connection: DrizzleConnection) {
        super();
        this.connection = connection;
    }
    
    async beginTransaction(): Promise<void> {
        // Note: Neon serverless doesn't support traditional transactions
        // This is a placeholder for when you switch to a different database
        this.inTransaction = true;
    }
    
    async commitTransaction(): Promise<void> {
        this.inTransaction = false;
    }
    
    async rollbackTransaction(): Promise<void> {
        this.inTransaction = false;
    }
    
    isInTransaction(): boolean {
        return this.inTransaction;
    }
}
