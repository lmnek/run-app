import OpenAI from "openai";

require("dotenv").config();

export const openai = new OpenAI();
const my_tools: OpenAI.ChatCompletionTool[] = [{
    type: "function",
    function: {
        name: "f",
        description: "Give a coaching monologue",
        parameters: {
            type: "object",
            properties: {
                text: {
                    type: "string",
                    description: "Text that will be converted to audio and played to the runner."
                },
                time: {
                    type: "number",
                    description: "Amount of seconds from now that the text should play at"
                }
            },
            required: ["text", "time"]
        }
    }
}]

export async function callCompletions() {
    const res = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
            { role: "system", content: "You are a assistant audio coach accompanying a runner on his run, using an application where you are integrated. You will join in many times during the run, reflect on the data provider by the application (such as pace, distance, ...) and give a monologue to the runner. You will try to motivate him, sometimes giving running tips and also encouragement. Be kind, excited and  occasionally funny. Do not use emojis and write the text so it is convertable with TTS without problems. You can utilize SSML tags for neural TTS at AWS Polly to better express emotion and tone (text needs to be surrounded with <speak> tag)." },
            { role: "user", content: "Already run: 5 km; Pace: 5:21 min/km; Pace for last 1km: 5:00 min/km" },
        ],
        tools: my_tools,
        tool_choice: {
            type: "function",
            function: { name: "f" },
        },
        stream: false
    })
    console.log("Result: " + JSON.stringify(res))
    return res
}
