import OpenAI from "openai";
import * as Tracking from "../routers/tracking.js";
import { UserStore } from "./redisStore.js";
import dotenv from 'dotenv'
import { ENV } from "./env.js";
import { entrancePrompt, firstNarrationPrompt, stylePrompt, systemInstructions, runContextStr, createStructurePrompt } from "./prompts.js";
import { StartRunParams } from "../routers/narration.js";
import { logger } from "./logger.js";
dotenv.config()

// Module responsible for calling the LLM APIs
// with proper inputs, using the OpenAI library 
// -> OpenAI and OpenRouter endpoints are used

export const openai = new OpenAI()
export const openRouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: ENV.OPENROUTER_API_KEY,
})

export const llmModels = ['GPT-4', 'GPT-3.5', 'Llama-3', 'Mixtral'] as const
type LlmModel = typeof llmModels[number]
// The precise names of the LLM models that are passed as parameters
const llmSettingsMap: { [key in LlmModel]: { openRouted: boolean, model: string } } = {
    'GPT-4': { openRouted: false, model: 'gpt-4o' },
    'GPT-3.5': { openRouted: false, model: 'gpt-3.5-turbo' },
    'Llama-3': { openRouted: true, model: 'meta-llama/llama-3-70b-instruct:nitro' },
    'Mixtral': { openRouted: true, model: 'mistralai/mixtral-8x7b-instruct' }
}

export const temperatures = ['Low', 'Medium', 'High'] as const
type Temperature = typeof temperatures[number]
// Determines the randomness of the output (default = 1)
const temperatureMap: { [key in Temperature]: number } = {
    'Low': 0.5,
    'Medium': 1,
    'High': 1.3
}

export type Message = OpenAI.ChatCompletionMessageParam

// Store the LLM messages history in the Redis store
async function addMessage(role: string, store: UserStore, content: string) {
    const newMessage = { role, content }
    await store.messages.add(newMessage)
}

// Generate outline/structure for the run
export async function createStructure(input: StartRunParams, store: UserStore) {
    const runContext = await runContextStr(input)
    const prompt = createStructurePrompt(input)
        + runContext

    const messages: Message[] = [
        { role: "system", content: systemInstructions },
        { role: "user", content: prompt }
    ]

    logger.debug('Creating structure', { messages })

    const res = await fetchCompletion(messages, store)
    const outline = res.choices[0].message.content

    logger.debug('Outline: %s', outline)

    // Save complete system message
    await addMessage("system", store,
        systemInstructions
        + runContext
        + `Crude outline for your entrances: { ' ${outline} ' } \n`
        + stylePrompt)
}

export async function generateNaration(entranceIdx: number, runDuration: string = "", store: UserStore) {
    // PERF: remove old instructions (saving input tokens)

    let prompt = (entranceIdx === 1)
        ? firstNarrationPrompt // first prompt when starting
        : await (async () => {
            // Any other prompt with running data
            await Tracking.closeSegment(store)
            const segments = await store.segments.getAll<Tracking.Segment>()
            const prompt = entrancePrompt(entranceIdx, runDuration, segments)
            await Tracking.clearSegments(store)
            return prompt
        })()

    logger.debug('Prompt: %s', prompt)

    await addMessage("user", store, prompt)
    const messages = await store.messages.getAll<Message>()
    const res = await fetchCompletion(messages, store)

    const correct = res.choices[0].finish_reason === "stop"
    if (correct && res.choices[0].message.content) {
        const resText = res.choices[0].message.content
        addMessage("assistant", store, resText)
        return resText
    }
    logger.error('LLM failed', { res })
    return null
}

// Fetch for the LLM output with the given library
async function fetchCompletion(messagess: Message[], store: UserStore): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    // Retrive settings
    const temperature = (await store.getValue('temperature')) as Temperature
    const llmModel = (await store.getValue('llmModel')) as LlmModel

    // Choose provider
    const { openRouted, model } = llmSettingsMap[llmModel]
    const client = openRouted ? openRouter : openai

    const res = await client.chat.completions.create({
        model,
        temperature: temperatureMap[temperature],
        stream: false,
        messages: messagess
    })
    return res
}

