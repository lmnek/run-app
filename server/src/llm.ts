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

export async function createStructure(params: StartRunParams) {
    const runInfoMessage = `Run goal: ${JSON.stringify(params.goalInfo)} (mention it!).\
You will enter ${params.entranceCount} times during the run. The topic of todays run is ${params.topic}. Center your monologue around this topic.`

    const structureInstructions: Message = {
        role: "user",
        content: runInfoMessage
            + `Now create an outline for ${params.entranceCount} planned interventions during the run, that you will follow. Don't include timestamps - the intervention are not always equally distributed.`
    }
    const res = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            { role: "system", content: initialPrompt },
            structureInstructions]
    })
    console.log("Structure: " + JSON.stringify(res))

    const resText = res.choices[0].message.content

    // Complete system message
    messages.push({
        role: "system",
        content: initialPrompt
            + runInfoMessage
            + "\nOutline for your entrances: " + resText
    })
}

export async function getFirstMessage() {
    messages.push({
        role: "user",
        content: "Create the 1. audio entrance, runner is starting."
    })
    const res2 = await openai.chat.completions.create({
        model: MODEL,
        messages: messages
    })

    console.log("1st message: " + JSON.stringify(res2))
    const resText2 = res2.choices[0].message.content
    messages.push({ role: "assistant", content: resText2 })
    return resText2
}


export async function callCompletions(entranceIdx: number, runDuration: string) {
    // const messageCount = messages.length - 1 // without System message

    // TODO: remove old instructions - saving input tokens
    // ...

    // TODO: add special intructions to last message

    Tracking.closeSegment()
    messages.push({
        role: "user",
        content: `Create the ${entranceIdx}. audio entrance;\
Already run duration: ${runDuration};\
Last segments info: ${JSON.stringify(Tracking.segments)}`
    })
    Tracking.clearSegment()

    const res = await openai.chat.completions.create({
        model: MODEL,
        messages: messages,
        tools: my_tools,
        tool_choice: {
            type: "function", function: { name: "f" },
        },
        stream: false
    })
    console.log("Result: " + JSON.stringify(res))

    const correct = res.choices[0].finish_reason === "stop"
    if (correct) {
        const args = res.choices[0].message.tool_calls![0].function.arguments
        const resJson = JSON.parse(args)

        messages.push({ role: "assistant", content: resJson.text })
        return resJson
    }
    return null // WARN: llm failed somehow
}


const my_tools: OpenAI.ChatCompletionTool[] = [{
    type: "function",
    function: {
        name: "f",
        description: "Generate a coaching monologue tailored to the current run data that motivates and instructs the runner.",
        parameters: {
            type: "object",
            properties: {
                text: {
                    type: "string",
                    description: "The main content of the coaching monologue."
                },
                time: {
                    type: "number",
                    description: "How many seconds from now in the run this should be presented."
                }
            },
            required: ["text", "time"]
        }
    }
}]



