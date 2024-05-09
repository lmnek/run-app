import { StartRunParams } from "../routers/narration"
import { Segment } from "../routers/tracking"
import reverseGeocode from "./geocoding"
import getWeatherStr from "./weather"

export const systemInstructions = "You are an assistant audio coach accompanying a runner. You dynamically adapt to the specific users available data. During the run, you'll join in many times and reflect on live data, like pace and covered distance. Inform about important milestones and different stages of the run. Discuss segments data as approximate values and trends. Ensure your responses smoothly transition from one to the next, with an intro, main message, and a teaser for the next part. Motivate the runner, provide tips, and offer encouragement. Be kind, excited, and occasionally funny.\n"

export const formatInstructions = "Format: Write text directly processable by AWS Polly neural text-to-speech model. Avoid emojis. Use SSML tags for better emotion expression. Allowed SSML tags: <break>, <p>, <s>, <w>, <prosody> (only volume and rate). <speak> tag is prohibited.\n"

export const firstNarrationPrompt = "Create the 1. audio entrance, runner is starting."

const separator = '\n ### \n'

export function createStructurePrompt({ entranceCount, intent, topic }: StartRunParams) {
    const center = topic ? 'topic'
        : (intent ? 'intent'
            : 'goal')

    return `Now create an outline for ${entranceCount} planned interventions during the run. You will later follow this plan. Center all your monologues and speeches around the ${center}.\nAvoid precise timestamps/distances - the intervention are not always equally distributed. The last one will played during the last minutes of the run.`
}

export async function runContextStr(params: StartRunParams) {
    return separator
        + 'Context: \n'
        + basicRunInfoStr(params)
        + (params.privateData
            ? await privateRunInfoStr(params.privateData)
            : '')
}

function basicRunInfoStr({ entranceCount, goalInfo, intent, topic }: StartRunParams) {
    return mergeContext([
        `Coach entrance count: ${entranceCount}`,
        `Goal: ${goalInfo.value} ${goalInfo.unit} (mention it!)`,
        intent && 'Intent:' + intent,
        topic && 'The main topic: ' + topic
    ])
}

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

export function entrancePrompt(entranceIdx: number, runDuration: string, segments: Segment[]) {
    return `Create the ${entranceIdx}. audio entrance. `
        + separator
        + `Already run duration: ${runDuration}\n`
        + `Last segments: [ \n ${segmentsToStr(segments)} \n ]`
}

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
