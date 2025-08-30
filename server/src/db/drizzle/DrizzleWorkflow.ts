import { DatabaseWorkflow, DatabaseConnection, QueryExecutor, TransactionManager, SchemaManager } from '../index.js';
import { DrizzleConnection } from './DrizzleConnection.js';
import { DrizzleQueryExecutor } from './DrizzleQueryExecutor.js';
import { DrizzleTransactionManager } from './DrizzleTransactionManager.js';
import { DrizzleSchemaManager } from './DrizzleSchemaManager.js';

// Workflow element: Drizzle-specific database operations workflow
export class DrizzleWorkflow extends DatabaseWorkflow {
    constructor(
        connection: DrizzleConnection,
        queryExecutor: DrizzleQueryExecutor,
        transactionManager: DrizzleTransactionManager,
        schemaManager: DrizzleSchemaManager
    ) {
        super(connection, queryExecutor, transactionManager, schemaManager);
    }
    
    async initialize(): Promise<void> {
        await this.connection.connect();
    }
    
    async cleanup(): Promise<void> {
        await this.connection.disconnect();
    }
}
