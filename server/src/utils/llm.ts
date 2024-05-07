import OpenAI from "openai";
import { StartRunParams } from "../routers/naration";
import * as Tracking from "../routers/tracking";
import { UserStore } from "./redisStore";
import dotenv from 'dotenv'
import { ENV } from "./env";

dotenv.config()

export const openai = new OpenAI()
export const openRouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: ENV.OPENROUTER_API_KEY,
})

export const llmModels = ['GPT-4', 'GPT-3.5', 'Llama-3', 'Mixtral'] as const
type LlmModel = typeof llmModels[number]
const llmSettingsMap: { [key in LlmModel]: { openRouted: boolean, model: string } } = {
    'GPT-4': { openRouted: false, model: 'gpt-4-0125-preview' },
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

type Message = OpenAI.ChatCompletionMessageParam

const initialPrompt = "You are an assistant audio coach accompanying a runner. During the run, you'll join in many times, reflecting on data like pace (and its fluctuations) and distance. Each of your entries should smoothly transition from one to the next, with an intro, main message, and a teaser for the next part. \
Inform about important distances crossed and different stages of the run, MOTIVATE THE RUNNER, provide TIPS, and encouragement while being kind, excited, and occasionally funny. Talk about segements data as approximate values and trends."

const formatInstructions = "Avoid emojis and use SSML tags for better expression in AWS Polly neural TTS (but WITHOUT <speak> tag). Allowed SSML tags: <break>, <p>, <s>, <w>, <prosody> (only volume and rate). Incorporate the provided live data into your speech."

async function addMessage(role: string, store: UserStore, content: string) {
    const newMessage = { role, content }
    await store.messages.add(newMessage)
}

export async function createStructure({ entranceCount, goalInfo, intent, topic }: StartRunParams, store: UserStore) {
    // TODO: add geolocation, weather and previous runner efforts
    // -> Only in private mode!
    const privateMode = await store.getValue('privateMode')

    const baseText = `Run goal: ${JSON.stringify(goalInfo)} (mention!). \
You will enter ${entranceCount} times during the run. `
    const intentText = intent ? `The intent of the run is ${intent}` : ''
    const topicText = topic ? ' and the topic is ' + topic : ''
    const emphasis = ' -> center your monologue around this! '
    const runInfoText = baseText + intentText + topicText + emphasis

    const createStructurePrompt = `Now create an outline for ${entranceCount} planned interventions during the run, that you will follow. Don't include timestamps/distances - the intervention are not always equally distributed. The last one will played during the last minutes of the run.`

    const messages: Message[] = [
        { role: "system", content: initialPrompt },
        { role: "user", content: runInfoText + createStructurePrompt }
    ]
    const res = await fetchCompletion(messages, store)
    const resText = res.choices[0].message.content

    // Complete system message
    await addMessage("system", store,
        initialPrompt
        + formatInstructions
        + runInfoText
        + "\nOutline for your entrances: " + resText)
}

export async function generateNaration(entranceIdx: number, runDuration: string = "", store: UserStore) {
    // PERF: remove old instructions - saving input tokens

    // TODO: add special intructions to last message

    let content = (entranceIdx === 1)
        ? "Create the 1. audio entrance, runner is starting."
        : await (async () => {
            await Tracking.closeSegment(store)
            const segmentsStr = await store.segments.getAll()
            await Tracking.clearSegments(store)

            console.log('Segments:    ', JSON.stringify(segmentsStr))

            return `Create the ${entranceIdx}. audio entrance;\
Already run duration: ${runDuration};\
Last segments info: ${JSON.stringify(segmentsStr)}`
        })()

    addMessage("user", store, content)

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

