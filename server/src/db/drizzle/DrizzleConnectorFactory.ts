import { DatabaseConnectorFactory, DatabaseConnector, DatabaseConfig } from '../index.js';
import { DrizzleConnector } from './DrizzleConnector.js';
import { DrizzleConnection } from './DrizzleConnection.js';
import { DrizzleQueryExecutor } from './DrizzleQueryExecutor.js';
import { DrizzleTransactionManager } from './DrizzleTransactionManager.js';
import { DrizzleSchemaManager } from './DrizzleSchemaManager.js';

// Factory element: Drizzle-specific database connector factory
export class DrizzleConnectorFactory extends DatabaseConnectorFactory {
    async createConnector(config: DatabaseConfig): Promise<DatabaseConnector> {
        const connection = new DrizzleConnection(config);
        const queryExecutor = new DrizzleQueryExecutor(connection);
        const transactionManager = new DrizzleTransactionManager(connection);
        const schemaManager = new DrizzleSchemaManager(connection);
        
        return new DrizzleConnector(connection, queryExecutor, transactionManager, schemaManager);
    }
    
    getSupportedTechnologies(): string[] {
        return ['drizzle', 'postgresql', 'neon'];
    }
}
