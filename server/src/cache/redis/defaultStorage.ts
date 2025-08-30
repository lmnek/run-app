import { RedisConnectorFactory } from './RedisConnectorFactory.js';
import { ENV } from '../env.js';

// ============================================================================
// CONNECTOR ELEMENTS - Default storage instance
// ============================================================================

// Connector element: Default storage instance
export const defaultStorage = await (async () => {
    const factory = new RedisConnectorFactory();
    const config = {
        url: ENV.REDIS_URL,
        prefix: 'app',
        ttl: 3600 // 1 hour default TTL
    };
    
    const connector = await factory.createConnector(config);
    await connector.initialize();
    
    return connector;
})();

// ============================================================================
// LEGACY EXPORTS - Maintain existing interface
// ============================================================================

// Legacy function for backward compatibility
export default function getUserStore(userId: string) {
    return defaultStorage.createUserStore(userId);
}
