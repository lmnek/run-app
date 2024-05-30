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

// Data element: User store interface
export interface UserStore {
    positions: ListStorage;
    segments: ListStorage;
    messages: ListStorage;
    setValue(key: StorageKey, value: any): Promise<void>;
    getValue(key: StorageKey): Promise<string | null>;
    deleteValue(key: StorageKey): Promise<void>;
    clear(): Promise<void>;
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
    
    abstract createUserStore(userId: string): UserStore;
    abstract initialize(): Promise<void>;
    abstract cleanup(): Promise<void>;
}

// ============================================================================
// RE-EXPORTS - Maintain backward compatibility
// ============================================================================

// Re-export the default storage and user store factory
export { defaultStorage, default as getUserStore } from './redis/defaultStorage.js';
