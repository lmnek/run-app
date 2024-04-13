import OpenAI from "openai";
import { StartRunParams, segments } from "./trpc";

require("dotenv").config();

export const openai = new OpenAI();

const MODEL = "gpt-3.5-turbo" // "gpt-4-turbo-preview"
const FIRST_NARATION_INDEX = 4

const initialPrompt = " You are an assistant audio coach accompanying a runner. During the run, you'll join in many times, reflecting on data like pace (and its fluctuations) and distance. Each of your entries should smoothly transition from one to the next, with an intro, main message, and a teaser for the next part. \
Inform about important distances crossed and different stages of the run, MOTIVATE THE RUNNER, provide TIPS, and encouragement while being kind, excited, and occasionally funny. Avoid emojis and use SSML tags for better expression in AWS Polly neural TTS (but WITHOUT <speak> tag). Allowed SSML tags: <break>, <p>, <s>, <w>, <prosody> (only volume and rate)"

export let messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: initialPrompt },
]

export async function createStructure(params: StartRunParams) {
    messages.push({
        role: "user",
        content: `Runner is starting with a goal: ${JSON.stringify(params.goalInfo)}.\
You will enter ${5} times during the run. The topic of todays run is ${"Easy run"}. You will center your monologue around this topic. \
Now create a structured outline for five planned interventions during the run, that you will follow.`
    })
    const res = await openai.chat.completions.create({
        model: MODEL,
        messages: messages,
    })
    console.log("Structure: " + JSON.stringify(res))

    const resText = res.choices[0].message.content
    messages.push({ role: "assistant", content: resText })

    messages.push({ role: "user", content: "Create the 1. audio entrance, runner is starting." })
    const res2 = await openai.chat.completions.create({
        model: MODEL,
        messages: messages,
    })
    console.log("1st message: " + JSON.stringify(res2))
    const resText2 = res2.choices[0].message.content
    messages.push({ role: "assistant", content: resText2 })
}


export async function callCompletions() {
    messages.push({
        role: "user",
        content: `Create the ${2}. audio entrance. Last segment info in time ${"10:34"}: ${JSON.stringify(segments)}`
    })
    segments.length = 0 // clear the list

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

export function getFirstMessage() {
    if (messages.length !== FIRST_NARATION_INDEX + 1) {
        return null
    }
    const text = messages[FIRST_NARATION_INDEX].content as string
    return text
}

