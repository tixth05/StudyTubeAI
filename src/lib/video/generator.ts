import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { VideoScene } from '@/types';
import { generateSlides, cleanupSlides } from './canvas-renderer';
import { generateSpeech, cleanupAudioFile, estimateSpeechDuration } from '../tts/hybrid-tts';
import { supabaseAdmin } from '../supabase/client';

/**
 * Generate video from scenes and narration
 */
export async function generateVideo(
    scenes: VideoScene[],
    narrationScript: string,
    userId: string
): Promise<string> {
    try {
        // Generate slides for each scene
        const slidePaths = await generateSlides(scenes);

        // Generate narration audio
        const audioPath = await generateSpeech(narrationScript);

        // Create video from slides
        const videoPath = await createVideoFromSlides(slidePaths, scenes, audioPath);

        // Upload to Supabase Storage
        const publicUrl = await uploadVideoToStorage(videoPath, userId);

        // Cleanup temporary files
        cleanupSlides(slidePaths);
        cleanupAudioFile(audioPath);
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }

        return publicUrl;
    } catch (error) {
        console.error('Error generating video:', error);
        throw new Error('Failed to generate video');
    }
}

/**
 * Create video from slides using FFmpeg
 */
async function createVideoFromSlides(
    slidePaths: string[],
    scenes: VideoScene[],
    audioPath: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        const tempDir = path.join(process.cwd(), 'temp', 'videos');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, `video-${Date.now()}.mp4`);

        // Create a concat file for FFmpeg
        const concatFilePath = path.join(tempDir, `concat-${Date.now()}.txt`);
        const concatContent = slidePaths
            .map((slidePath, index) => {
                const duration = scenes[index]?.duration || 5;
                return `file '${slidePath.replace(/\\/g, '/')}'\nduration ${duration}`;
            })
            .join('\n');

        fs.writeFileSync(concatFilePath, concatContent);

        // Use FFmpeg to create video
        ffmpeg()
            .input(concatFilePath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions([
                '-c:v libx264',
                '-pix_fmt yuv420p',
                '-r 30',
                '-preset fast'
            ])
            .output(outputPath)
            .on('end', () => {
                // Clean up concat file
                if (fs.existsSync(concatFilePath)) {
                    fs.unlinkSync(concatFilePath);
                }
                resolve(outputPath);
            })
            .on('error', (err: Error) => {
                console.error('FFmpeg error:', err);
                reject(new Error('Failed to create video with FFmpeg'));
            })
            .run();
    });
}

/**
 * Upload video to Supabase Storage
 */
async function uploadVideoToStorage(videoPath: string, userId: string): Promise<string> {
    const supabase = supabaseAdmin();

    const fileName = `${userId}/${Date.now()}.mp4`;
    const fileBuffer = fs.readFileSync(videoPath);

    const { data, error } = await supabase.storage
        .from('videos')
        .upload(fileName, fileBuffer, {
            contentType: 'video/mp4',
            upsert: false
        });

    if (error) {
        throw new Error('Failed to upload video to storage');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

/**
 * Delete video from storage
 */
export async function deleteVideo(videoUrl: string): Promise<void> {
    const supabase = supabaseAdmin();

    // Extract file path from URL
    const urlParts = videoUrl.split('/videos/');
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    await supabase.storage
        .from('videos')
        .remove([filePath]);
}
