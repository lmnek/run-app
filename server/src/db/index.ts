// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: Database connection configuration
export interface DatabaseConfig {
    url: string;
    schema?: any;
}

// Data element: Query result wrapper
export interface QueryResult<T> {
    data: T[];
    count: number;
}

// Data element: Insert result wrapper
export interface InsertResult {
    insertedId: number;
    affectedRows: number;
}

// Data element: Update result wrapper
export interface UpdateResult {
    affectedRows: number;
}

// Data element: Delete result wrapper
export interface DeleteResult {
    affectedRows: number;
}

// Data element: Where clause conditions
export interface WhereCondition {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
    value: any;
}

// Data element: Order clause
export interface OrderClause {
    field: string;
    direction: 'asc' | 'desc';
}

// Data element: Select options
export interface SelectOptions {
    where?: WhereCondition[];
    orderBy?: OrderClause[];
    limit?: number;
    offset?: number;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Database connection management
export abstract class DatabaseConnection {
    protected config: DatabaseConfig;
    
    constructor(config: DatabaseConfig) {
        this.config = config;
    }
    
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;
}

// Task element: Query execution
export abstract class QueryExecutor {
    abstract select<T>(table: string, options?: SelectOptions): Promise<QueryResult<T>>;
    abstract insert<T>(table: string, data: Partial<T>): Promise<InsertResult>;
    abstract update<T>(table: string, data: Partial<T>, where: WhereCondition[]): Promise<UpdateResult>;
    abstract delete(table: string, where: WhereCondition[]): Promise<DeleteResult>;
    abstract executeRaw(query: string, params?: any[]): Promise<any>;
}

// Task element: Transaction management
export abstract class TransactionManager {
    abstract beginTransaction(): Promise<void>;
    abstract commitTransaction(): Promise<void>;
    abstract rollbackTransaction(): Promise<void>;
    abstract isInTransaction(): boolean;
}

// Task element: Schema management
export abstract class SchemaManager {
    abstract getTableSchema(tableName: string): Promise<any>;
    abstract createTable(tableName: string, schema: any): Promise<void>;
    abstract dropTable(tableName: string): Promise<void>;
    abstract tableExists(tableName: string): Promise<boolean>;
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Database operations workflow
export abstract class DatabaseWorkflow {
    protected connection: DatabaseConnection;
    protected queryExecutor: QueryExecutor;
    protected transactionManager: TransactionManager;
    protected schemaManager: SchemaManager;
    
    constructor(
        connection: DatabaseConnection,
        queryExecutor: QueryExecutor,
        transactionManager: TransactionManager,
        schemaManager: SchemaManager
    ) {
        this.connection = connection;
        this.queryExecutor = queryExecutor;
        this.transactionManager = transactionManager;
        this.schemaManager = schemaManager;
    }
    
    abstract initialize(): Promise<void>;
    abstract cleanup(): Promise<void>;
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Database operations coordinator
export abstract class DatabaseConnector {
    protected workflow: DatabaseWorkflow;
    
    constructor(workflow: DatabaseWorkflow) {
        this.workflow = workflow;
    }
    
    abstract getConnection(): DatabaseConnection;
    abstract getQueryExecutor(): QueryExecutor;
    abstract getTransactionManager(): TransactionManager;
    abstract getSchemaManager(): SchemaManager;
    
    async initialize(): Promise<void> {
        await this.workflow.initialize();
    }
    
    async cleanup(): Promise<void> {
        await this.workflow.cleanup();
    }
}

// ============================================================================
// FACTORY ELEMENTS - Create database instances
// ============================================================================

// Factory element: Database connector factory
export abstract class DatabaseConnectorFactory {
    abstract createConnector(config: DatabaseConfig): Promise<DatabaseConnector>;
    abstract getSupportedTechnologies(): string[];
}

// ============================================================================
// IMPLEMENTATION EXPORTS - Technology-specific implementations
// ============================================================================

// Export the Drizzle implementation
export { DrizzleConnector } from './drizzle/DrizzleConnector.js';
export { DrizzleConnection } from './drizzle/DrizzleConnection.js';
export { DrizzleQueryExecutor } from './drizzle/DrizzleQueryExecutor.js';
export { DrizzleTransactionManager } from './drizzle/DrizzleTransactionManager.js';
export { DrizzleSchemaManager } from './drizzle/DrizzleSchemaManager.js';
export { DrizzleWorkflow } from './drizzle/DrizzleWorkflow.js';

// Export the factory
export { DrizzleConnectorFactory } from './drizzle/DrizzleConnectorFactory.js';

// Export default database instance
export { defaultDatabase } from './drizzle/defaultDatabase.js';
