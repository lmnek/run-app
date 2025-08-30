
import { createLogger, transports, format, Logger } from "winston";
import { ENV } from "./env.js";

// ============================================================================
// CONSTANTS - Configuration values
// ============================================================================

const DEFAULT_LOG_LEVEL = 'info';
const LOG_FORMAT_TIMESTAMP = 'YYYY-MM-DD HH:mm:ss';

// ============================================================================
// DATA ELEMENTS - Logger configuration
// ============================================================================

// Data element: Log format configuration
interface LogFormatConfig {
    timestamp: string;
    colorize: boolean;
    splat: boolean;
    metadata: boolean;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Log format creator
export class LogFormatCreator {
    static createFormat(config: LogFormatConfig) {
        const formats = [
            format.timestamp({ format: config.timestamp }),
            format.errors({ stack: true }),
            format.metadata()
        ];

        if (config.colorize) {
            formats.push(format.colorize());
        }

        if (config.splat) {
            formats.push(format.splat());
        }

        formats.push(
            format.printf(({ timestamp, level, message, metadata, stack }) => {
                let logMessage = `[${timestamp}] ${level}: ${message}`;
                
                if (Object.keys(metadata).length > 0) {
                    logMessage += `; ${JSON.stringify(metadata)}`;
                }
                
                if (stack) {
                    logMessage += `\n${stack}`;
                }
                
                return logMessage;
            })
        );

        return format.combine(...formats);
    }
}

// Task element: Logger configuration
export class LoggerConfiguration {
    static createConfig() {
        return {
            level: ENV.LOG_LEVEL || DEFAULT_LOG_LEVEL,
            format: LogFormatCreator.createFormat({
                timestamp: LOG_FORMAT_TIMESTAMP,
                colorize: true,
                splat: true,
                metadata: true
            }),
            transports: [new transports.Console()],
            exitOnError: false
        };
    }
}

// Task element: Logger creator
export class LoggerCreator {
    static create(): Logger {
        const config = LoggerConfiguration.createConfig();
        return createLogger(config);
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Main application logger
export const logger = LoggerCreator.create();

// ============================================================================
// LEGACY EXPORTS - Maintain backward compatibility
// ============================================================================

// Re-export logger for backward compatibility
export default logger;

