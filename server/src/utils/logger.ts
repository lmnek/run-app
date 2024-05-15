
import { createLogger, transports, format } from "winston"
import { ENV } from "./env.js";

// Initialize logger
export const logger = createLogger({
    level: ENV.LOG_LEVEL,
    format: format.combine(
        format.colorize(),
        format.splat(), // enable string interpolation
        format.metadata(),
        format.timestamp(),
        format.printf(({ timestamp, level, message, metadata }) => {
            return `[${timestamp}] ${level}: ${message}`
                + (Object.keys(metadata).length > 0 ? '; ' + JSON.stringify(metadata) : '');
        })
    ),
    transports: [new transports.Console()],
})

