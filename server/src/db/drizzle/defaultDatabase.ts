import { DrizzleConnectorFactory } from './DrizzleConnectorFactory.js';
import { ENV } from '../../utils/env.js';
import * as schema from './schema.js';

// ============================================================================
// CONNECTOR ELEMENTS - Default database instance
// ============================================================================

// Connector element: Default database instance for backward compatibility
export const defaultDatabase = await (async () => {
    const factory = new DrizzleConnectorFactory();
    const config = {
        url: ENV.DB_URL,
        schema: schema
    };
    
    const connector = await factory.createConnector(config);
    await connector.initialize();
    
    return connector;
})();

// ============================================================================
// LEGACY EXPORTS - Maintain backward compatibility
// ============================================================================

// Legacy export for existing code
export const db = defaultDatabase.getDrizzleDb();
