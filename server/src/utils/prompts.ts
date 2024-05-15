import { StartRunParams } from "../routers/narration.js"
import { Segment } from "../routers/tracking.js"
import reverseGeocode from "./geocoding.js"
import getWeatherStr from "./weather.js"

// System message for every completion
export const systemInstructions = "Role: You are an assistant audio coach accompanying a runner. You dynamically adapt to the specific users available data. During the run, you'll join in many times and reflect on live data, like pace and covered distance. Inform about important milestones and different stages of the run. Discuss segments data as approximate values and trends. Ensure your responses smoothly transition from one to the next, with an intro, main message (the longest), and a teaser for the next part. Motivate the runner, provide tips, and offer encouragement. Be kind, excited, and occasionally funny.\n"

// The format/style of the narration
export const stylePrompt = "Style: Write text directly processable by AWS Polly neural text-to-speech model. Avoid emojis. Use SSML tags for better emotion expression. Allowed SSML tags: <break>, <p>, <s>, <w>, <prosody> (only volume and rate). <speak> tag is prohibited.\n"

export const firstNarrationPrompt = "Create the 1. audio entrance, runner is starting."

const separator = '\n ### \n'

export function createStructurePrompt({ entranceCount }: StartRunParams) {
    return `Now create an outline for ${entranceCount} planned interventions during the run. You will later follow this plan. Avoid precise timestamps/distances - the intervention are not always equally distributed. The last one will played during the last minutes of the run. Use only keywords instead of setences. Return only the outline/structure and nothing else!`
}

// Context for the run, present in every completion
export async function runContextStr(params: StartRunParams) {
    return separator
        + 'Context: \n'
        + basicRunInfoStr(params)
        + (params.privateData
            ? await privateRunInfoStr(params.privateData)
            : '')
}

// Basic context without any private data
function basicRunInfoStr({ entranceCount, goalInfo, intent, topic }: StartRunParams) {
    return mergeContext([
        `Coach entrance count: ${entranceCount}`,
        `Goal: ${goalInfo.value} ${goalInfo.unit} (mention it!)`,
        intent && 'Intent:' + intent,
        topic && 'The main topic: ' + topic
    ]) + ' -> center all your monologues around this!\n'
}

// Private data context that can be turned off
async function privateRunInfoStr({ username, lat, long }: NonNullable<StartRunParams['privateData']>) {
    const [geoloc, weatherStr] = await Promise.all([
        reverseGeocode(lat, long),
        getWeatherStr(lat, long)
    ])

    // TODO: previous runner efforts
    return mergeContext([
        username && 'Runners name: ' + username,
        'Start date/time: ' + (new Date()).toLocaleString(),
        `Weather: [${weatherStr}]`,
        geoloc && `Starting location is ${geoloc.display_name} (type ${geoloc.type})`,
    ])
}

// Create a coaching narrationg prompt
export function entrancePrompt(entranceIdx: number, runDuration: string, segments: Segment[]) {
    return `Create the ${entranceIdx}. audio entrance. `
        + separator
        + `Already run duration: ${runDuration}\n`
        + (segments.length === 0 ? ''
            : `Last segments: [ \n ${segmentsToStr(segments)} \n ]`)
}

// Convert running segments data to string
function segmentToStr(s: Segment) {
    const pace = (1000 / 60) * (1 / s.speed)
    return `From ${s.fromMetres} to ${s.toMetres} metres; \
Pace ${pace.toFixed(2)} min/km; ${s.duration.toFixed(1)} secs`
}

function segmentsToStr(segments: Segment[]) {
    return mergeContext(segments
        .map(s => segmentToStr(s)))
}

function mergeContext(context: (string | undefined)[]): string {
    return context
        .flatMap(s => s ?? []) // remove undefined 
        .reduce((acc, s) => acc
            + '- ' + s + '\n',
            '')
}
