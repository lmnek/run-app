import { openai } from "./llm";
import fs from "fs";
import path from "path";

import { PollyClient, Polly } from "@aws-sdk/client-polly";
import { getSynthesizeSpeechUrl } from "@aws-sdk/polly-request-presigner";

export async function textToSpeech(text: string): Promise<String> {
    const url = await getSynthesizeSpeechUrl({
        client: new PollyClient({ region: 'eu-central-1' }),
        params: {
            Engine: 'neural',
            Text: text,
            OutputFormat: 'mp3',
            VoiceId: 'Matthew',
            TextType: 'ssml'
        },
        options: {
            expiresIn: 300
        }
    })
    console.log('audio url:' + url)
    return url
}

// NOTE: not time efficient
export async function textToSpeechOpenAI(text: string): Promise<string> {
    const res = await openai.audio.speech.create({
        model: "tts-1", // 1 sec, 2 sec hd
        voice: "echo",
        response_format: "mp3",
        input: text,
        speed: 1.0
    })
    // takes ~5secs
    const buffer = Buffer.from(await res.arrayBuffer());

    //TODO: remove file saving
    const speechFile = path.resolve("./speech.mp3");
    await fs.promises.writeFile(speechFile, buffer);

    // convert to base64 (alternative: save audio file from buffer)
    console.time('to-base-64')
    const b64audio = buffer.toString('base64');
    console.timeEnd('to-base-64')
    console.timeEnd('all')
    return b64audio;
}
