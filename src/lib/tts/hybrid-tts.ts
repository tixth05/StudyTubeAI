import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

/**
 * TTS System using Microsoft Edge-TTS (msedge-tts)
 * No API keys required.
 */

const VOICE = 'en-US-GuyNeural';

/**
 * Generate speech using Edge-TTS
 */
export async function generateSpeech(text: string): Promise<string> {
    const tempDir = path.join(os.tmpdir(), 'studytube-ai');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, `narration-${Date.now()}.mp3`);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioFilePath } = await tts.toFile(tempDir, text);

    // Rename auto-generated filename to our expected path
    if (audioFilePath !== outputPath) {
        fs.renameSync(audioFilePath, outputPath);
    }

    tts.close();
    console.log('✅ Generated speech with Edge-TTS');
    return outputPath;
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
    } catch (error) {
        console.error('Error cleaning up audio file:', error);
    }
}
