// ============================================================================
// LLM API - Language model interactions using OpenAI and OpenRouter
// ============================================================================

import OpenAI from "openai";
import { logger } from "../utils/logger.js";
import { LlmMessage, LlmModelConfig, TemperatureConfig } from "./types.js";
import { ENV } from "../utils/env.js";
import { entrancePrompt, firstNarrationPrompt, stylePrompt, systemInstructions, runContextStr, createStructurePrompt, flowInstructions } from "./prompts.js";
import { StartRunParams } from "../routers/narration.js";

// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: LLM model configuration
export class LlmModelConfiguration {
    private static readonly models: Record<string, LlmModelConfig> = {
        'GPT-4': { openRouted: false, model: 'gpt-4o' },
        'GPT-3.5': { openRouted: false, model: 'gpt-3.5-turbo' },
        'Llama-3': { openRouted: true, model: 'meta-llama/llama-3-70b-instruct:nitro' },
        'Mixtral': { openRouted: true, model: 'mistralai/mixtral-8x7b-instruct' }
    };

    static getModels(): string[] {
        return Object.keys(this.models);
    }

    static getModelConfig(modelName: string): LlmModelConfig | undefined {
        return this.models[modelName];
    }

    static isOpenRouted(modelName: string): boolean {
        return this.models[modelName]?.openRouted || false;
    }
}

// Data element: Temperature configuration
export class TemperatureConfiguration {
    private static readonly temperatures: Record<string, TemperatureConfig> = {
        'Low': { value: 0.5, label: 'Low' },
        'Medium': { value: 1, label: 'Medium' },
        'High': { value: 1.3, label: 'High' }
    };

    static getTemperatures(): string[] {
        return Object.keys(this.temperatures);
    }

    static getTemperatureValue(temperature: string): number {
        return this.temperatures[temperature]?.value || 1;
    }
}

// Data element: LLM client configuration
export class LlmClientConfiguration {
    private static readonly openai = new OpenAI();
    private static readonly openRouter = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: ENV.OPENROUTER_API_KEY,
    });

    static getOpenAiClient(): OpenAI {
        return this.openai;
    }

    static getOpenRouterClient(): OpenAI {
        return this.openRouter;
    }

    static getClient(isOpenRouted: boolean): OpenAI {
        return isOpenRouted ? this.openRouter : this.openai;
    }
}

// Data element: LLM request parameters
export interface LlmRequestParams {
    messages: LlmMessage[];
    model: string;
    temperature: number;
}

// Data element: LLM response data
export interface LlmResponseData {
    content: string;
    finishReason: string;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: LLM completion request
export class LlmCompletionRequester {
    async request(params: LlmRequestParams): Promise<LlmResponseData | null> {
        try {
            const isOpenRouted = LlmModelConfiguration.isOpenRouted(params.model);
            const client = LlmClientConfiguration.getClient(isOpenRouted);

            const response = await client.chat.completions.create({
                model: params.model,
                temperature: params.temperature,
                stream: false,
                messages: params.messages
            });

            if (response.choices.length === 0 ||
                response.choices[0].finish_reason !== "stop" ||
                !response.choices[0].message.content) {
                logger.error('LLM completion failed', { response });
                return null;
            }

            return {
                content: response.choices[0].message.content,
                finishReason: response.choices[0].finish_reason
            };
        } catch (error) {
            logger.error('LLM completion request failed', { params, error });
            return null;
        }
    }
}

// Task element: LLM message history management
export class LlmMessageHistoryManager {
    static async addMessage(role: string, content: string, store: any): Promise<void> {
        const newMessage = { role, content };
        await store.messages.add(newMessage);
    }

    static async getMessages(store: any): Promise<LlmMessage[]> {
        return await store.messages.getAll<LlmMessage>();
    }
}

// Task element: LLM prompt generation
export class LlmPromptGenerator {
    static generateStructurePrompt(input: StartRunParams, runContext: string): string {
        return createStructurePrompt(input) + runContext;
    }

    static generateNarrationPrompt(entranceIdx: number, runDuration: string, segments: any[]): string {
        if (entranceIdx === 1) {
            return firstNarrationPrompt;
        }
        return entrancePrompt(entranceIdx, runDuration, segments);
    }

    static generateSystemMessage(runContext: string, outline: string): string {
        return systemInstructions + flowInstructions + runContext + 
               `Crude outline for your entrances: { ' ${outline} ' } \n` + stylePrompt;
    }
}

// Task element: LLM request validation
export class LlmRequestValidator {
    static validateMessages(messages: LlmMessage[]): boolean {
        return Array.isArray(messages) && messages.length > 0;
    }

    static validateModel(model: string): boolean {
        return LlmModelConfiguration.getModels().includes(model);
    }

    static validateTemperature(temperature: string): boolean {
        return TemperatureConfiguration.getTemperatures().includes(temperature);
    }
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Structure creation workflow
export class StructureCreationWorkflow {
    private completionRequester: LlmCompletionRequester;

    constructor(completionRequester?: LlmCompletionRequester) {
        this.completionRequester = completionRequester || new LlmCompletionRequester();
    }

    async execute(input: StartRunParams, userId: string, store: any): Promise<string | null> {
        try {
            // Generate run context
            const runContext = await runContextStr(input, userId);
            
            // Generate prompt
            const prompt = LlmPromptGenerator.generateStructurePrompt(input, runContext);
            
            // Prepare messages
            const messages: LlmMessage[] = [
                { role: "system", content: systemInstructions },
                { role: "user", content: prompt }
            ];

            logger.debug('Creating structure', { messages });

            // Get completion
            const outline = await this.completionRequester.request({
                messages,
                model: await store.getValue('llmModel'),
                temperature: TemperatureConfiguration.getTemperatureValue(await store.getValue('temperature'))
            });

            if (outline) {
                logger.debug('Outline: %s', outline.content);

                // Save complete system message
                const systemMessage = LlmPromptGenerator.generateSystemMessage(runContext, outline.content);
                await LlmMessageHistoryManager.addMessage("system", store, systemMessage);
            }

            return outline?.content || null;
        } catch (error) {
            logger.error('Structure creation workflow failed', { input, userId, error });
            return null;
        }
    }
}

// Workflow element: Narration generation workflow
export class NarrationGenerationWorkflow {
    private completionRequester: LlmCompletionRequester;

    constructor(completionRequester?: LlmCompletionRequester) {
        this.completionRequester = completionRequester || new LlmCompletionRequester();
    }

    async execute(entranceIdx: number, runDuration: string, store: any): Promise<string | null> {
        try {
            // Generate appropriate prompt
            let prompt: string;
            if (entranceIdx === 1) {
                prompt = firstNarrationPrompt;
            } else {
                // Import tracking functions dynamically to avoid circular dependencies
                const Tracking = await import("../routers/tracking.js");
                await Tracking.closeSegment(store);
                const segments = await store.segments.getAll();
                prompt = LlmPromptGenerator.generateNarrationPrompt(entranceIdx, runDuration, segments);
                await Tracking.clearSegments(store);
            }

            logger.debug('Prompt: %s', prompt);

            // Add user message to history
            await LlmMessageHistoryManager.addMessage("user", store, prompt);
            
            // Get all messages
            const messages = await LlmMessageHistoryManager.getMessages(store);
            
            // Get completion
            const response = await this.completionRequester.request({
                messages,
                model: await store.getValue('llmModel'),
                temperature: TemperatureConfiguration.getTemperatureValue(await store.getValue('temperature'))
            });

            if (response) {
                await LlmMessageHistoryManager.addMessage("assistant", store, response.content);
            }

            return response?.content || null;
        } catch (error) {
            logger.error('Narration generation workflow failed', { entranceIdx, runDuration, error });
            return null;
        }
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: LLM API coordinator
export class LlmApiConnector {
    private structureWorkflow: StructureCreationWorkflow;
    private narrationWorkflow: NarrationGenerationWorkflow;

    constructor(
        structureWorkflow?: StructureCreationWorkflow,
        narrationWorkflow?: NarrationGenerationWorkflow
    ) {
        this.structureWorkflow = structureWorkflow || new StructureCreationWorkflow();
        this.narrationWorkflow = narrationWorkflow || new NarrationGenerationWorkflow();
    }

    async createStructure(input: StartRunParams, userId: string, store: any): Promise<string | null> {
        return await this.structureWorkflow.execute(input, userId, store);
    }

    async generateNarration(entranceIdx: number, runDuration: string, store: any): Promise<string | null> {
        return await this.narrationWorkflow.execute(entranceIdx, runDuration, store);
    }
}

// ============================================================================
// TRIGGER ELEMENTS - Control when actions are triggered
// ============================================================================

// Trigger element: LLM model constants (maintains backward compatibility)
export const llmModels = ['GPT-4', 'GPT-3.5', 'Llama-3', 'Mixtral'] as const;

// Trigger element: Temperature constants (maintains backward compatibility)
export const temperatures = ['Low', 'Medium', 'High'] as const;

// Trigger element: Message type (maintains backward compatibility)
export type Message = LlmMessage;

// Trigger element: Default LLM API exports (maintains backward compatibility)
export const openai = LlmClientConfiguration.getOpenAiClient();
export const openRouter = LlmClientConfiguration.getOpenRouterClient();

export async function createStructure(input: StartRunParams, userId: string, store: any): Promise<string | null> {
    const connector = new LlmApiConnector();
    return await connector.createStructure(input, userId, store);
}

export async function generateNaration(entranceIdx: number, runDuration: string = "", store: any): Promise<string | null> {
    const connector = new LlmApiConnector();
    return await connector.generateNarration(entranceIdx, runDuration, store);
}
