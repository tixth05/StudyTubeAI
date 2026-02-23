import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Hybrid TTS System
 * Primary: ElevenLabs API (free tier)
 * Fallback: Browser Web Speech API
 */

interface TTSOptions {
    text: string;
    voice?: string;
}

/**
 * Generate speech using ElevenLabs API (Primary)
 */
async function generateWithElevenLabs(text: string): Promise<string | null> {
    try {
        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            console.log('ElevenLabs API key not found, using fallback');
            return null;
        }

        const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Default voice (Rachel)

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_flash_v2_5',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                })
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                console.log('ElevenLabs API key invalid, using fallback');
            } else if (response.status === 429) {
                console.log('ElevenLabs rate limit exceeded, using fallback');
            } else {
                console.log(`ElevenLabs API error: ${response.status}, using fallback`);
            }
            return null;
        }

        // Save audio to temp file
        const tempDir = path.join(os.tmpdir(), 'studytube-ai');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, `narration-${Date.now()}.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fs.writeFileSync(outputPath, buffer);

        console.log('✅ Generated speech with ElevenLabs');
        return outputPath;

    } catch (error) {
        console.error('ElevenLabs error:', error);
        return null;
    }
}

/**
 * Generate speech using Web Speech API (Fallback)
 * This creates a silent placeholder that will be replaced by client-side TTS
 */
async function generateWithWebSpeech(text: string): Promise<string> {
    console.log('⚠️ Using Web Speech API fallback (client-side narration)');

    // Create temp directory if it doesn't exist
    const tempDir = path.join(os.tmpdir(), 'studytube-ai');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, `narration-fallback-${Date.now()}.mp3`);

    // Create a metadata file that signals client-side TTS should be used
    const metadata = {
        type: 'web-speech-fallback',
        text: text,
        timestamp: Date.now()
    };

    // Write metadata as JSON (will be used by frontend)
    fs.writeFileSync(outputPath.replace('.mp3', '.json'), JSON.stringify(metadata));

    // Create empty MP3 placeholder
    fs.writeFileSync(outputPath, '');

    return outputPath;
}

/**
 * Main TTS function with hybrid strategy
 */
export async function generateSpeech(text: string): Promise<string> {
    // Try ElevenLabs first
    const elevenLabsPath = await generateWithElevenLabs(text);

    if (elevenLabsPath) {
        return elevenLabsPath;
    }

    // Fallback to Web Speech API
    return await generateWithWebSpeech(text);
}

/**
 * Calculate estimated duration of speech in seconds
 * Average speaking rate: ~150 words per minute
 */
export function estimateSpeechDuration(text: string): number {
    const words = text.split(/\s+/).length;
    const wordsPerSecond = 150 / 60; // 150 words per minute
    return Math.ceil(words / wordsPerSecond);
}

/**
 * Clean up temporary audio files
 */
export function cleanupAudioFile(filePath: string): void {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Also cleanup metadata file if exists
        const metadataPath = filePath.replace('.mp3', '.json');
        if (fs.existsSync(metadataPath)) {
            fs.unlinkSync(metadataPath);
        }
    } catch (error) {
        console.error('Error cleaning up audio file:', error);
    }
}

/**
 * Check if ElevenLabs is available
 */
export function isElevenLabsAvailable(): boolean {
    return !!process.env.ELEVENLABS_API_KEY;
}
