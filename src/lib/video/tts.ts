import * as fs from 'fs';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
// Default voice: Rachel (professional female voice)
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

export async function generateAudio(script: string, outputPath: string): Promise<void> {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg',
            },
            body: JSON.stringify({
                text: script.substring(0, 2500), // ElevenLabs free tier limit
                model_id: 'eleven_flash_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log(`[TTS] Audio saved to ${outputPath}`);
}
