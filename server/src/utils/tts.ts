import { PollyClient, VoiceId } from "@aws-sdk/client-polly";
import { getSynthesizeSpeechUrl } from "@aws-sdk/polly-request-presigner";

import ssmlCheck from 'ssml-check';
import { UserStore } from "./redisStore";
const ssmlSettings: ssmlCheck.ISSMLCheckOptions = {
    platform: 'amazon',
    unsupportedTags: ['emphasis', 'say-as']
}

export const voiceGenders = ['Male', 'Female'] as const
type Voice = typeof voiceGenders[number]
const voiceMap: { [key in Voice]: VoiceId } = {
    'Male': 'Matthew',
    'Female': 'Danielle',
}

export async function textToSpeech(llmText: string, store: UserStore): Promise<String> {
    const { isSsml, text } = await repareSsml(llmText)
    const voiceGender = (await store.getValue('voice')) as Voice

    const url = await getSynthesizeSpeechUrl({
        client: new PollyClient({ region: 'eu-central-1' }),
        params: {
            Engine: 'neural',
            Text: text,
            OutputFormat: 'mp3',
            VoiceId: voiceMap[voiceGender],
            TextType: isSsml ? 'ssml' : 'text'
        },
        options: {
            expiresIn: 300
        }
    })
    // console.log('audio url:' + url)
    return url
}

async function repareSsml(text: string) {
    const ssmlText = "<speak>\n" + text.replace("\\\"", "\"") + "\n</speak>"
    const errors = await ssmlCheck.check(ssmlText, ssmlSettings)
    if (!errors || errors.length > 0) {
        const { fixedSSML: fixedText } = await ssmlCheck.verifyAndFix(ssmlText, ssmlSettings)
        if (fixedText) {
            return { isSsml: true, text: fixedText }
        }
        const tagRegex: RegExp = new RegExp('<[^>]+>', 'g')
        const pureText = text.replace(tagRegex, '')
        return { isSsml: false, text: pureText }
    }
    return { isSsml: true, text: ssmlText }
}
