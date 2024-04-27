import OpenAI from "openai";
import { StartRunParams, temperature } from "../routers/naration";
import * as Tracking from "../routers/tracking";
import { UserStore } from "./redisStore";
import dotenv from 'dotenv'

dotenv.config()

export const openai = new OpenAI();

type Message = OpenAI.ChatCompletionMessageParam

const MODEL = "gpt-4-turbo-preview"
// const MODEL = "gpt-3.5-turbo" 

const initialPrompt = "You are an assistant audio coach accompanying a runner. During the run, you'll join in many times, reflecting on data like pace (and its fluctuations) and distance. Each of your entries should smoothly transition from one to the next, with an intro, main message, and a teaser for the next part. \
Inform about important distances crossed and different stages of the run, MOTIVATE THE RUNNER, provide TIPS, and encouragement while being kind, excited, and occasionally funny. Talk about segements data as approximate values and trends."

const formatInstructions = "Avoid emojis and use SSML tags for better expression in AWS Polly neural TTS (but WITHOUT <speak> tag). Allowed SSML tags: <break>, <p>, <s>, <w>, <prosody> (only volume and rate). Incorporate the provided live data into your speech."

async function addMessage(role: string, store: UserStore, content: string) {
    const newMessage = { role, content }
    await store.messages.add(newMessage)
}

export async function createStructure({ entranceCount, goalInfo, intent, topic }: StartRunParams, store: UserStore) {
    // TODO: add geolocation, weather and previous runner efforts

    const baseText = `Run goal: ${JSON.stringify(goalInfo)} (mention!). \
You will enter ${entranceCount} times during the run. `
    const intentText = intent ? `The intent of the run is ${intent}` : ''
    const topicText = topic ? ' and the topic is ' + topic : ''
    const emphasis = ' -> center your monologue around this! '
    const runInfoText = baseText + intentText + topicText + emphasis

    const createStructurePrompt = `Now create an outline for ${entranceCount} planned interventions during the run, that you will follow. Don't include timestamps/distances - the intervention are not always equally distributed. The last one will played during the last minutes of the run.`
    const res = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            { role: "system", content: initialPrompt },
            { role: "user", content: runInfoText + createStructurePrompt }
        ]
    })
    // console.log("Structure: " + JSON.stringify(res))

    const resText = res.choices[0].message.content

    // Complete system message
    await addMessage("system", store,
        initialPrompt
        + formatInstructions
        + runInfoText
        + "\nOutline for your entrances: " + resText)
}

export async function callCompletions(entranceIdx: number, runDuration: string = "", store: UserStore) {
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
    const res = await openai.chat.completions.create({
        model: MODEL,
        messages: messages,
        stream: false,
        temperature: temperature
    })
    // console.log("Result: " + JSON.stringify(res))

    const correct = res.choices[0].finish_reason === "stop"
    if (correct && res.choices[0].message.content) {
        const resText = res.choices[0].message.content
        addMessage("assistant", store, resText)
        return resText
    }
    return null // WARN: llm failed somehow
}


