import { RedisConnectorFactory } from './RedisConnectorFactory.js';
import { ENV } from '../../utils/env.js';
import { logger } from '../../utils/logger.js';

// ============================================================================
// CONSTANTS - Configuration values
// ============================================================================

const DEFAULT_TTL = 3600; // 1 hour default TTL
const STORAGE_PREFIX = 'app';

// ============================================================================
// CONNECTOR ELEMENTS - Default storage instance
// ============================================================================

// Connector element: Default storage instance
export const defaultStorage = await (async () => {
    try {
        const factory = new RedisConnectorFactory();
        const config = {
            url: ENV.REDIS_URL,
            prefix: STORAGE_PREFIX,
            ttl: DEFAULT_TTL
        };
        
        const connector = await factory.createConnector(config);
        await connector.initialize();
        
        logger.info('Redis storage initialized successfully');
        return connector;
    } catch (error) {
        logger.error('Failed to initialize Redis storage', { error });
        throw error;
    }
})();

// ============================================================================
// LEGACY EXPORTS - Maintain existing interface
// ============================================================================

// Legacy function for backward compatibility
export default function getUserStore(userId: string) {
    return defaultStorage.createUserStore(userId);
}
