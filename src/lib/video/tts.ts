import * as fs from 'fs';
import * as path from 'path';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VOICE = 'en-US-GuyNeural';

export async function generateAudio(text: string, outputPath: string): Promise<void> {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    // toFile writes to a directory with an auto-generated filename,
    // so we write to the parent dir then rename to the desired outputPath.
    const dir = path.dirname(outputPath);
    const { audioFilePath } = await tts.toFile(dir, text);

    // Rename the auto-generated file to the expected output path
    if (audioFilePath !== outputPath) {
        fs.renameSync(audioFilePath, outputPath);
    }

    tts.close();
    console.log(`[TTS] Audio saved to ${outputPath}`);
}
