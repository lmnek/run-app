// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: Storage configuration
export interface StorageConfig {
    url: string;
    prefix?: string;
    ttl?: number;
}

// Data element: List item wrapper
export interface ListItem<T> {
    data: T;
    timestamp: number;
    id: string;
}

// Data element: Storage key types
export type StorageKey = 'firstNarationUrl'
    | 'curSegmentDistance'
    | 'lastSegToMetres' | 'lastSegEndTime'
    | 'topic' | 'intent'
    | 'voice' | 'temperature' | 'llmModel' | 'privateMode';

// Data element: Storage operation result
export interface StorageOperationResult {
    success: boolean;
    error?: string;
    data?: any;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: List storage operations
export abstract class ListStorage {
    abstract add<T>(item: T): Promise<void>;
    abstract getAll<T>(): Promise<T[]>;
    abstract getOnIdx<T>(idx: number): Promise<T | null>;
    abstract clear(): Promise<void>;
    abstract length(): Promise<number>;
}

// Task element: Key-value storage operations
export abstract class KeyValueStorage {
    abstract setValue(key: StorageKey, value: any): Promise<void>;
    abstract getValue(key: StorageKey): Promise<string | null>;
    abstract deleteValue(key: StorageKey): Promise<void>;
    abstract retrieveAllValues(): Promise<{ [key: string]: string }>;
}

// Task element: Storage connection management
export abstract class StorageConnection {
    protected config: StorageConfig;
    
    constructor(config: StorageConfig) {
        this.config = config;
    }
    
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;
    abstract healthCheck(): Promise<boolean>;
}

// Task element: Storage error handling
export abstract class StorageErrorHandler {
    abstract handleError(error: any, context: string): never;
    abstract createError(message: string, code: string): Error;
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Storage operations workflow
export abstract class StorageWorkflow {
    protected connection: StorageConnection;
    protected errorHandler: StorageErrorHandler;
    
    constructor(connection: StorageConnection, errorHandler: StorageErrorHandler) {
        this.connection = connection;
        this.errorHandler = errorHandler;
    }
    
    abstract initialize(): Promise<void>;
    abstract cleanup(): Promise<void>;
    abstract validateOperation(operation: string, data?: any): Promise<boolean>;
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Storage operations coordinator
export abstract class StorageConnector {
    protected workflow: StorageWorkflow;
    
    constructor(workflow: StorageWorkflow) {
        this.workflow = workflow;
    }
    
    abstract getConnection(): StorageConnection;
    abstract getErrorHandler(): StorageErrorHandler;
    abstract createListStorage(key: string): ListStorage;
    abstract createKeyValueStorage(prefix: string): KeyValueStorage;
    
    async initialize(): Promise<void> {
        await this.workflow.initialize();
    }
    
    async cleanup(): Promise<void> {
        await this.workflow.cleanup();
    }
}

// ============================================================================
// FACTORY ELEMENTS - Create storage instances
// ============================================================================

// Factory element: Storage connector factory
export abstract class StorageConnectorFactory {
    abstract createConnector(config: StorageConfig): Promise<StorageConnector>;
    abstract getSupportedTechnologies(): string[];
}

// ============================================================================
// IMPLEMENTATION EXPORTS - Technology-specific implementations
// ============================================================================

// Export the Redis implementation
export { RedisConnector } from '../utils/redis/RedisConnector.js';
export { RedisConnection } from '../utils/redis/RedisConnection.js';
export { RedisListStorage } from '../utils/redis/RedisListStorage.js';
export { RedisKeyValueStorage } from '../utils/redis/RedisKeyValueStorage.js';
export { RedisErrorHandler } from '../utils/redis/RedisErrorHandler.js';
export { RedisWorkflow } from '../utils/redis/RedisWorkflow.js';

// Export the factory
export { RedisConnectorFactory } from '../utils/redis/RedisConnectorFactory.js';

// Export default storage instance
export { defaultStorage } from '../utils/redis/defaultStorage.js';
