import OpenAI from "openai";
import { StartRunParams } from "./trpc";
import * as Tracking from "./tracking";

require("dotenv").config();

export const openai = new OpenAI();

type Message = OpenAI.ChatCompletionMessageParam

const MODEL = "gpt-4-turbo-preview"
// const MODEL = "gpt-3.5-turbo" 

const initialPrompt = " You are an assistant audio coach accompanying a runner. During the run, you'll join in many times, reflecting on data like pace (and its fluctuations) and distance. Each of your entries should smoothly transition from one to the next, with an intro, main message, and a teaser for the next part. \
Inform about important distances crossed and different stages of the run, MOTIVATE THE RUNNER, provide TIPS, and encouragement while being kind, excited, and occasionally funny. Talk about segements data as approximate values and trends. \
Avoid emojis and use SSML tags for better expression in AWS Polly neural TTS (but WITHOUT <speak> tag). Allowed SSML tags: <break>, <p>, <s>, <w>, <prosody> (only volume and rate). \
ALWAYS FOLLOW THESE INSTRUCTIONS!\n"

export let messages: Message[] = []
let entranceCount: number | null = null

export async function createStructure(params: StartRunParams) {
    entranceCount = params.entranceCount

    // TODO: add geolocation, weather and previous runner efforts

    const baseText = `Run goal: ${JSON.stringify(params.goalInfo)} (mention!). \
You will enter ${entranceCount} times during the run. `
    const intentText = `The intent of the run is ${params.intent}`
    const topicText = params.topic === "" ? "" : " and the topic is " + params.topic
    const emphasis = " -> center your monologue around this! "
    const runInfoText = baseText + intentText + topicText + emphasis

    const createStructurePrompt = `Now create an outline for ${params.entranceCount} planned interventions during the run, that you will follow.Don't include timestamps - the intervention are not always equally distributed. The last one will played during the last minutes of the run.`
    const res = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            { role: "system", content: initialPrompt },
            { role: "user", content: runInfoText + createStructurePrompt }
        ]
    })
    console.log("Structure: " + JSON.stringify(res))

    const resText = res.choices[0].message.content

    // Complete system message
    messages.push({
        role: "system",
        content: initialPrompt
            + runInfoText
            + "\nOutline for your entrances: " + resText
    })
}

export async function callCompletions(entranceIdx: number, runDuration: string = "") {
    // PERF: remove old instructions - saving input tokens
    // const messageCount = messages.length - 1 // without System message
    // ...

    // TODO: add special intructions to last message

    let content = (entranceIdx === 1)
        ? "Create the 1. audio entrance, runner is starting."
        : (() => {
            Tracking.closeSegment()
            const segmentsStr = JSON.stringify(Tracking.segments)
            Tracking.clearSegment()
            return `Create the ${entranceIdx}. audio entrance;\
Already run duration: ${runDuration};\
Last segments info: ${segmentsStr}`
        })()

    messages.push({
        role: "user",
        content: content
    })

    const res = await openai.chat.completions.create({
        model: MODEL,
        messages: messages,
        stream: false
    })
    console.log("Result: " + JSON.stringify(res))

    const correct = res.choices[0].finish_reason === "stop"
    if (correct) {
        const resText = res.choices[0].message.content
        messages.push({ role: "assistant", content: resText })
        return resText
    }
    return null // WARN: llm failed somehow
}


