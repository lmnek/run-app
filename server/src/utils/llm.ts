import OpenAI from "openai";
import * as Tracking from "../routers/tracking";
import { UserStore } from "./redisStore";
import dotenv from 'dotenv'
import { ENV } from "./env";
import { entrancePrompt, firstNarrationPrompt, stylePrompt, systemInstructions, runContextStr, createStructurePrompt } from "./prompts";
import { StartRunParams } from "../routers/narration";

dotenv.config()

export const openai = new OpenAI()
export const openRouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: ENV.OPENROUTER_API_KEY,
})

export const llmModels = ['GPT-4', 'GPT-3.5', 'Llama-3', 'Mixtral'] as const
type LlmModel = typeof llmModels[number]
const llmSettingsMap: { [key in LlmModel]: { openRouted: boolean, model: string } } = {
    'GPT-4': { openRouted: false, model: 'gpt-4o' },
    'GPT-3.5': { openRouted: false, model: 'gpt-3.5-turbo' },
    'Llama-3': { openRouted: true, model: 'meta-llama/llama-3-70b-instruct:nitro' },
    'Mixtral': { openRouted: true, model: 'mistralai/mixtral-8x7b-instruct' }
}

export const temperatures = ['Low', 'Medium', 'High'] as const
type Temperature = typeof temperatures[number]
const temperatureMap: { [key in Temperature]: number } = {
    'Low': 0.5,
    'Medium': 1,
    'High': 1.3
}

export type Message = OpenAI.ChatCompletionMessageParam

async function addMessage(role: string, store: UserStore, content: string) {
    const newMessage = { role, content }
    await store.messages.add(newMessage)
}

export async function createStructure(input: StartRunParams, store: UserStore) {
    const runContext = await runContextStr(input)
    const prompt = createStructurePrompt(input)
        + runContext

    const messages: Message[] = [
        { role: "system", content: systemInstructions },
        { role: "user", content: prompt }
    ]
    const res = await fetchCompletion(messages, store)
    const outline = res.choices[0].message.content

    console.log('Outline: ' + outline)

    // Complete system message
    await addMessage("system", store,
        systemInstructions
        + runContext
        + `Crude outline for your entrances: { ' ${outline} ' } \n`
        + stylePrompt)
}

export async function generateNaration(entranceIdx: number, runDuration: string = "", store: UserStore) {
    // PERF: remove old instructions (saving input tokens)

    let prompt = (entranceIdx === 1)
        ? firstNarrationPrompt
        : await (async () => {
            await Tracking.closeSegment(store)
            const segments = await store.segments.getAll<Tracking.Segment>()
            const prompt = entrancePrompt(entranceIdx, runDuration, segments)
            await Tracking.clearSegments(store)
            return prompt
        })()

    console.log('Prompt: ' + prompt)

    await addMessage("user", store, prompt)
    const messages = await store.messages.getAll<Message>()
    const res = await fetchCompletion(messages, store)

    const correct = res.choices[0].finish_reason === "stop"
    if (correct && res.choices[0].message.content) {
        const resText = res.choices[0].message.content
        addMessage("assistant", store, resText)
        return resText
    }
    return null // llm failed
}

async function fetchCompletion(messagess: Message[], store: UserStore): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const temperature = (await store.getValue('temperature')) as Temperature
    const llmModel = (await store.getValue('llmModel')) as LlmModel

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

