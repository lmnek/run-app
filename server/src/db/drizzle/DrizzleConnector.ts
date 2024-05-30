import { DatabaseConnector, DatabaseConnection, QueryExecutor, TransactionManager, SchemaManager } from '../index.js';
import { DrizzleConnection } from './DrizzleConnection.js';
import { DrizzleQueryExecutor } from './DrizzleQueryExecutor.js';
import { DrizzleTransactionManager } from './DrizzleTransactionManager.js';
import { DrizzleSchemaManager } from './DrizzleSchemaManager.js';
import { DrizzleWorkflow } from './DrizzleWorkflow.js';

// Connector element: Drizzle-specific database operations coordinator
export class DrizzleConnector extends DatabaseConnector {
    private drizzleConnection: DrizzleConnection;
    private drizzleQueryExecutor: DrizzleQueryExecutor;
    private drizzleTransactionManager: DrizzleTransactionManager;
    private drizzleSchemaManager: DrizzleSchemaManager;
    
    constructor(
        connection: DrizzleConnection,
        queryExecutor: DrizzleQueryExecutor,
        transactionManager: DrizzleTransactionManager,
        schemaManager: DrizzleSchemaManager
    ) {
        const workflow = new DrizzleWorkflow(connection, queryExecutor, transactionManager, schemaManager);
        super(workflow);
        
        this.drizzleConnection = connection;
        this.drizzleQueryExecutor = queryExecutor;
        this.drizzleTransactionManager = transactionManager;
        this.drizzleSchemaManager = schemaManager;
    }
    
    getConnection(): DatabaseConnection {
        return this.drizzleConnection;
    }
    
    getQueryExecutor(): QueryExecutor {
        return this.drizzleQueryExecutor;
    }
    
    getTransactionManager(): TransactionManager {
        return this.drizzleTransactionManager;
    }
    
    getSchemaManager(): SchemaManager {
        return this.drizzleSchemaManager;
    }
    
    // Drizzle-specific getter for backward compatibility
    getDrizzleDb() {
        return this.drizzleConnection.getDrizzleDb();
    }
}
