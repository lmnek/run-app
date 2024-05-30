// ============================================================================
// TTS API - Text-to-speech using AWS Polly service
// ============================================================================

import { PollyClient, VoiceId } from "@aws-sdk/client-polly";
import { getSynthesizeSpeechUrl } from "@aws-sdk/polly-request-presigner";
import ssmlCheck from 'ssml-check';
import { logger } from "../utils/logger.js";
import { VoiceConfig, TtsConfig } from "./types.js";

// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: SSML validation configuration
export class SsmlValidationConfig {
    private static readonly settings = {
        platform: 'amazon' as const,
        unsupportedTags: ['emphasis', 'say-as']
    };

    static getSettings() {
        return { ...this.settings };
    }
}

// Data element: Voice mapping configuration
export class VoiceMappingConfig {
    private static readonly voiceMap: Record<string, VoiceId> = {
        'Male': 'Matthew',
        'Female': 'Danielle',
    };

    static getVoiceId(gender: string): VoiceId {
        return this.voiceMap[gender] || 'Matthew';
    }

    static getAvailableGenders(): string[] {
        return Object.keys(this.voiceMap);
    }
}

// Data element: TTS configuration
export class TtsServiceConfig {
    private static readonly config: TtsConfig = {
        engine: 'neural',
        outputFormat: 'mp3',
        region: 'eu-central-1',
        expiresIn: 300
    };

    static getConfig(): TtsConfig {
        return { ...this.config };
    }
}

// Data element: SSML processing result
export interface SsmlProcessingResult {
    isSsml: boolean;
    text: string;
}

// Data element: TTS request parameters
export interface TtsRequestParams {
    text: string;
    voiceGender: string;
    isSsml: boolean;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: SSML validation and repair
export class SsmlValidator {
    static async validateAndRepair(text: string): Promise<SsmlProcessingResult> {
        const settings = SsmlValidationConfig.getSettings();
        const ssmlText = "<speak>\n" + text.replace("\\\"", "\"") + "\n</speak>";
        
        try {
            const errors = await ssmlCheck.check(ssmlText, settings);
            
            if (!errors || errors.length === 0) {
                return { isSsml: true, text: ssmlText };
            }

            // Try to fix SSML
            const { fixedSSML: fixedText } = await ssmlCheck.verifyAndFix(ssmlText, settings);
            
            if (fixedText) {
                return { isSsml: true, text: fixedText };
            }

            // Fallback to plain text
            const tagRegex: RegExp = new RegExp('<[^>]+>', 'g');
            const pureText = text.replace(tagRegex, '');
            return { isSsml: false, text: pureText };
        } catch (error) {
            logger.warn('SSML validation failed, falling back to plain text', { error });
            const tagRegex: RegExp = new RegExp('<[^>]+>', 'g');
            const pureText = text.replace(tagRegex, '');
            return { isSsml: false, text: pureText };
        }
    }
}

// Task element: TTS URL generation
export class TtsUrlGenerator {
    private pollyClient: PollyClient;

    constructor(region?: string) {
        const config = TtsServiceConfig.getConfig();
        this.pollyClient = new PollyClient({ region: region || config.region });
    }

    async generateUrl(params: TtsRequestParams): Promise<string> {
        const config = TtsServiceConfig.getConfig();
        const voiceId = VoiceMappingConfig.getVoiceId(params.voiceGender);

        const url = await getSynthesizeSpeechUrl({
            client: this.pollyClient,
            params: {
                Engine: config.engine,
                Text: params.text,
                OutputFormat: config.outputFormat,
                VoiceId: voiceId,
                TextType: params.isSsml ? 'ssml' : 'text'
            },
            options: {
                expiresIn: config.expiresIn
            }
        });

        return url;
    }
}

// Task element: TTS request validation
export class TtsRequestValidator {
    static validate(text: string, voiceGender: string): boolean {
        const availableGenders = VoiceMappingConfig.getAvailableGenders();
        
        return (
            typeof text === 'string' &&
            text.length > 0 &&
            availableGenders.includes(voiceGender)
        );
    }
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Complete TTS process
export class TtsWorkflow {
    private urlGenerator: TtsUrlGenerator;

    constructor(urlGenerator?: TtsUrlGenerator) {
        this.urlGenerator = urlGenerator || new TtsUrlGenerator();
    }

    async execute(text: string, voiceGender: string): Promise<string> {
        try {
            // Validate input parameters
            if (!TtsRequestValidator.validate(text, voiceGender)) {
                throw new Error('Invalid TTS request parameters');
            }

            // Process SSML if present
            const ssmlResult = await SsmlValidator.validateAndRepair(text);
            
            // Generate TTS URL
            const url = await this.urlGenerator.generateUrl({
                text: ssmlResult.text,
                voiceGender,
                isSsml: ssmlResult.isSsml
            });

            logger.debug('TTS URL generated successfully', { 
                voiceGender, 
                isSsml: ssmlResult.isSsml,
                urlLength: url.length 
            });

            return url;
        } catch (error) {
            logger.error('TTS workflow failed', { text, voiceGender, error });
            throw error;
        }
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: TTS API coordinator
export class TtsApiConnector {
    private workflow: TtsWorkflow;

    constructor(workflow?: TtsWorkflow) {
        this.workflow = workflow || new TtsWorkflow();
    }

    async textToSpeech(text: string, voiceGender: string): Promise<string> {
        return await this.workflow.execute(text, voiceGender);
    }
}

// ============================================================================
// TRIGGER ELEMENTS - Control when actions are triggered
// ============================================================================

// Trigger element: Voice gender constants (maintains backward compatibility)
export const voiceGenders = ['Male', 'Female'] as const;

// Trigger element: Default TTS API export (maintains backward compatibility)
export async function textToSpeech(text: string, voiceGender: string): Promise<string> {
    const connector = new TtsApiConnector();
    return await connector.textToSpeech(text, voiceGender);
}
