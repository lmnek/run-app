// ============================================================================
// PROMPTS API - LLM prompt generation and context building
// ============================================================================

import { db } from "../db/db.js";
import { desc, eq } from "drizzle-orm";
import { runs } from "../db/schema.js";
import { StartRunParams } from "../routers/narration.js";
import { Segment } from "../routers/tracking.js";
import { reverseGeocode } from "./geocoding.js";
import { getWeatherStr } from "./weather.js";

// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: Prompt configuration constants
export class PromptConfiguration {
    private static readonly separator = '\n ### \n';
    private static readonly systemInstructions = "Role: You are an assistant audio coach accompanying a runner. You dynamically adapt to the specific users available data. During the run, you'll join in many times and reflect on live data, like pace and covered distance. Inform about important milestones and different stages of the run. Discuss segments data as approximate values and trends. Motivate the runner, provide tips, and offer encouragement. Be kind, excited, and occasionally funny. Integrate as much user data as possible, especially the not yet mentioned data.\n";
    private static readonly flowInstructions = "Ensure your responses smoothly transition from one to the next, with an intro, main message (the longest), and a teaser for the next part.\n";
    private static readonly stylePrompt = "Style: Write text directly processable by AWS Polly neural text-to-speech model. Avoid emojis. Use SSML tags for better emotion expression. Allowed SSML tags: <break>, <p>, <s>, <w>, <prosody> (only volume and rate). <speak> tag is prohibited.\n";
    private static readonly firstNarrationPrompt = "Create the 1. audio entrance, runner is starting.";

    static getSeparator(): string {
        return this.separator;
    }

    static getSystemInstructions(): string {
        return this.systemInstructions;
    }

    static getFlowInstructions(): string {
        return this.flowInstructions;
    }

    static getStylePrompt(): string {
        return this.stylePrompt;
    }

    static getFirstNarrationPrompt(): string {
        return this.firstNarrationPrompt;
    }
}

// Data element: Run context data
export interface RunContextData {
    entranceCount: number;
    goalInfo: {
        value: number;
        unit: string;
    };
    intent?: string;
    topic?: string;
    privateData?: {
        username: string;
        lat: number;
        long: number;
    };
}

// Data element: Private run information
export interface PrivateRunInfo {
    username?: string;
    lastRun?: {
        serial: number;
        startTime: number;
        distance: number;
        speed: number;
        duration: number;
        intent?: string;
        topic?: string;
    };
    startDateTime: string;
    weather: string;
    location?: {
        display_name: string;
        type: string;
    };
}

// Data element: Segment data for prompt generation
export interface SegmentData {
    fromMetres: number;
    toMetres: number;
    speed: number;
    duration: number;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Structure prompt generation
export class StructurePromptGenerator {
    static generate(entranceCount: number): string {
        return `Now create an outline for ${entranceCount} planned interventions during the run. You will later follow this plan. List all the things you will say in each entrance. Avoid precise timestamps/distances - the intervention are not always equally distributed. The last one will played during the last minutes of the run. Use only keywords instead of setences. Return only the outline/structure and nothing else!`;
    }
}

// Task element: Basic run information formatting
export class BasicRunInfoFormatter {
    static format(context: RunContextData): string {
        const lines = [
            `Coach entrance count: ${context.entranceCount}`,
            `Goal: ${context.goalInfo.value} ${context.goalInfo.unit} (mention it!)`,
            context.intent && 'Intent:' + context.intent,
            context.topic && 'The main topic: ' + context.topic
        ];

        return this.mergeContext(lines) + ' -> center all your monologues around this!\n';
    }
}

// Task element: Private run information retrieval
export class PrivateRunInfoRetriever {
    static async retrieve(privateData: NonNullable<StartRunParams['privateData']>, userId: string): Promise<PrivateRunInfo> {
        const [geoloc, weatherStr, lastRuns] = await Promise.all([
            reverseGeocode(privateData.lat, privateData.long),
            getWeatherStr(privateData.lat, privateData.long),
            db.select()
                .from(runs)
                .where(eq(runs.userId, userId))
                .orderBy(desc(runs.serial))
                .limit(1)
        ]);

        const lastRun = lastRuns.length > 0 ? lastRuns[0] : undefined;

        return {
            username: privateData.username,
            lastRun: lastRun ? {
                serial: lastRun.serial,
                startTime: lastRun.startTime,
                distance: lastRun.distance,
                speed: lastRun.speed,
                duration: lastRun.duration,
                intent: lastRun.intent || undefined,
                topic: lastRun.topic || undefined
            } : undefined,
            startDateTime: new Date().toLocaleString(),
            weather: weatherStr,
            location: geoloc ? {
                display_name: geoloc.display_name,
                type: geoloc.type
            } : undefined
        };
    }
}

// Task element: Private run information formatting
export class PrivateRunInfoFormatter {
    static format(info: PrivateRunInfo): string {
        const lines = [
            info.username && 'Runners name: ' + info.username,
            info.lastRun && 'Last run: ' + this.formatLastRun(info.lastRun),
            'Start date/time: ' + info.startDateTime,
            `Weather: [${info.weather}]`,
            info.location && `Starting location is ${info.location.display_name} (type ${info.location.type})`,
        ];

        return this.mergeContext(lines);
    }

    private static formatLastRun(run: NonNullable<PrivateRunInfo['lastRun']>): string {
        const distanceKm = (run.distance / 1000).toFixed(2);
        const pace = this.speedToPace(run.speed);
        const durationMin = (run.duration / 60).toFixed(1);
        
        let result = `{ ${run.serial} run, on ${new Date(run.startTime).toLocaleString()}, ${distanceKm} km, ${pace} min/km, ${durationMin} min`;
        
        if (run.intent) {
            result += ', intent: ' + run.intent;
        }
        if (run.topic) {
            result += ', topic: ' + run.topic;
        }
        
        result += ' }';
        return result;
    }

    private static speedToPace(speed: number): string {
        const pace = (1000 / 60) * (1 / speed);
        return pace.toFixed(2);
    }
}

// Task element: Entrance prompt generation
export class EntrancePromptGenerator {
    static generate(entranceIdx: number, runDuration: string, segments: Segment[]): string {
        const basePrompt = `Create the ${entranceIdx}. audio entrance. ` + PromptConfiguration.getSeparator();
        const durationInfo = `Already run duration: ${runDuration}\n`;
        
        let segmentsInfo = '';
        if (segments.length > 0) {
            segmentsInfo = `Last segments: [ \n ${this.formatSegments(segments)} ]`;
        }

        return basePrompt + durationInfo + segmentsInfo;
    }

    private static formatSegments(segments: Segment[]): string {
        const segmentStrings = segments.map(s => this.formatSegment(s));
        return this.mergeContext(segmentStrings);
    }

    private static formatSegment(segment: Segment): string {
        const pace = this.speedToPace(segment.speed);
        return `From ${segment.fromMetres} to ${segment.toMetres} metres; Pace ${pace} min/km; ${segment.duration.toFixed(1)} secs`;
    }

    private static speedToPace(speed: number): string {
        const pace = (1000 / 60) * (1 / speed);
        return pace.toFixed(2);
    }
}

// Task element: Context merging utility
export class ContextMerger {
    static merge(context: (string | undefined)[]): string {
        return context
            .flatMap(s => s ?? []) // remove undefined 
            .reduce((acc, s) => acc + '- ' + s + '\n', '');
    }
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Complete run context generation
export class RunContextGenerationWorkflow {
    async execute(params: StartRunParams, userId: string): Promise<string> {
        try {
            // Generate basic run information
            const basicInfo = BasicRunInfoFormatter.format(params);
            
            // Generate private run information if available
            let privateInfo = '';
            if (params.privateData) {
                const privateData = await PrivateRunInfoRetriever.retrieve(params.privateData, userId);
                privateInfo = PrivateRunInfoFormatter.format(privateData);
            }

            // Combine all context information
            const fullContext = PromptConfiguration.getSeparator() + 
                              'Context: \n' + 
                              basicInfo + 
                              privateInfo;

            return fullContext;
        } catch (error) {
            console.error('Run context generation failed:', error);
            // Fallback to basic context only
            return PromptConfiguration.getSeparator() + 
                   'Context: \n' + 
                   BasicRunInfoFormatter.format(params);
        }
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Prompts API coordinator
export class PromptsApiConnector {
    private contextWorkflow: RunContextGenerationWorkflow;

    constructor(contextWorkflow?: RunContextGenerationWorkflow) {
        this.contextWorkflow = contextWorkflow || new RunContextGenerationWorkflow();
    }

    async generateRunContext(params: StartRunParams, userId: string): Promise<string> {
        return await this.contextWorkflow.execute(params, userId);
    }

    generateStructurePrompt(params: StartRunParams): string {
        return StructurePromptGenerator.generate(params.entranceCount);
    }

    generateEntrancePrompt(entranceIdx: number, runDuration: string, segments: Segment[]): string {
        return EntrancePromptGenerator.generate(entranceIdx, runDuration, segments);
    }
}

// ============================================================================
// TRIGGER ELEMENTS - Control when actions are triggered
// ============================================================================

// Trigger element: Default exports (maintains backward compatibility)
export const systemInstructions = PromptConfiguration.getSystemInstructions();
export const flowInstructions = PromptConfiguration.getFlowInstructions();
export const stylePrompt = PromptConfiguration.getStylePrompt();
export const firstNarrationPrompt = PromptConfiguration.getFirstNarrationPrompt();

export function createStructurePrompt(params: StartRunParams): string {
    const connector = new PromptsApiConnector();
    return connector.generateStructurePrompt(params);
}

export async function runContextStr(params: StartRunParams, userId: string): Promise<string> {
    const connector = new PromptsApiConnector();
    return await connector.generateRunContext(params, userId);
}

export function entrancePrompt(entranceIdx: number, runDuration: string, segments: Segment[]): string {
    const connector = new PromptsApiConnector();
    return connector.generateEntrancePrompt(entranceIdx, runDuration, segments);
}
