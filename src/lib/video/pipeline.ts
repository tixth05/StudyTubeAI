import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { generateAudio } from './tts';
import { createServerClient } from '@supabase/ssr';

// Resolve ffmpeg-static binary safely
const ffmpegPath = ffmpegStatic;
if (!ffmpegPath) {
    throw new Error('ffmpeg-static binary not found. Run: npm install ffmpeg-static');
}
console.log('[FFmpeg] Using binary at:', ffmpegPath);
ffmpeg.setFfmpegPath(ffmpegPath);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PipelineScene {
    text: string;
    keywords: string[];
}

// ---------------------------------------------------------------------------
// Supabase service client
// ---------------------------------------------------------------------------
function createSupabaseServiceClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

// ---------------------------------------------------------------------------
// Audio duration via ffprobe
// ---------------------------------------------------------------------------
async function getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
            if (err || !metadata?.format?.duration) resolve(30);
            else resolve(metadata.format.duration);
        });
    });
}

// ---------------------------------------------------------------------------
// Unsplash image fetch + download
// ---------------------------------------------------------------------------
async function fetchUnsplashImage(
    keywords: string[],
    sceneIdx: number,
    tmpDir: string,
): Promise<string | null> {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey || accessKey === 'your_unsplash_access_key_here') {
        console.log(`[Unsplash] No API key configured — using gradient fallback for scene ${sceneIdx + 1}`);
        return null;
    }

    const query = keywords.slice(0, 3).join(' ') || `scene ${sceneIdx + 1}`;

    try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
        const res = await fetch(url, {
            headers: { Authorization: `Client-ID ${accessKey}` },
        });

        if (!res.ok) {
            console.warn(`[Unsplash] API error ${res.status} for query: "${query}"`);
            return null;
        }

        const data: any = await res.json();
        const imageUrl = data?.results?.[0]?.urls?.regular;
        if (!imageUrl) {
            console.warn(`[Unsplash] No results for query: "${query}"`);
            return null;
        }

        // Download the image
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) return null;

        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        const imgPath = path.join(tmpDir, `bg-${sceneIdx}.jpg`);
        fs.writeFileSync(imgPath, imgBuffer);
        console.log(`[Unsplash] Scene ${sceneIdx + 1}: downloaded "${query}" → ${imgPath}`);
        return imgPath;

    } catch (err: any) {
        console.warn(`[Unsplash] Failed for scene ${sceneIdx + 1}:`, err.message);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------
const SCENE_COLORS = [
    { r1: 26, g1: 5, b1: 51, r2: 108, g2: 99, b2: 255 },
    { r1: 45, g1: 27, b1: 105, r2: 139, g2: 139, b2: 255 },
    { r1: 20, g1: 20, b1: 80, r2: 100, g2: 200, b2: 255 },
    { r1: 50, g1: 10, b1: 80, r2: 200, g2: 100, b2: 255 },
    { r1: 10, g1: 30, b1: 60, r2: 80, g2: 180, b2: 220 },
];

function escapeDrawtext(text: string): string {
    return text
        .replace(/\\/g, '\\\\')    // backslash must go first
        .replace(/['"]/g, '')       // remove quotes — apostrophes break single-quote delimiters
        .replace(/,/g, ' ')         // comma is the FFmpeg filter chain separator — replace with space
        .replace(/:/g, '\\:')       // colon is the option key=value separator
        .replace(/%/g, '%%');       // percent triggers FFmpeg expressions
}

function getTextLines(text: string, maxWidth = 46): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
        if ((cur + ' ' + w).trim().length <= maxWidth) {
            cur = (cur + ' ' + w).trim();
        } else {
            if (cur) lines.push(cur);
            cur = w;
        }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
}

/** Split TTS script into sentences, filtering blanks */
function splitScriptSentences(script: string): string[] {
    return script
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

/** Chunk sentences evenly into sceneCount buckets */
function assignSentencesToScenes(sentences: string[], sceneCount: number): string[] {
    const perScene = Math.ceil(sentences.length / sceneCount);
    return Array.from({ length: sceneCount }, (_, i) =>
        sentences.slice(i * perScene, (i + 1) * perScene).join(' ')
    );
}

// ---------------------------------------------------------------------------
// FFmpeg spawn helper
// ---------------------------------------------------------------------------
function runFFmpeg(args: string[], label: string): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`[FFmpeg:${label}] args:`, args.join(' '));
        const proc = spawn(ffmpegPath!, args);
        let stderr = '';
        proc.stderr.on('data', (buf: Buffer) => {
            const line = buf.toString();
            stderr += line;
            if (line.includes('frame=') || line.includes('time=')) {
                process.stdout.write(`[FFmpeg:${label}] ${line}`);
            }
        });
        proc.on('close', (code) => {
            if (code === 0) { console.log(`[FFmpeg:${label}] Done`); resolve(); }
            else {
                console.error(`[FFmpeg:${label}] Failed (exit ${code})\n${stderr.slice(-1500)}`);
                reject(new Error(`FFmpeg ${label} failed (exit ${code})`));
            }
        });
        proc.on('error', reject);
    });
}

// ---------------------------------------------------------------------------
// Build drawtext subtitle filter chain
// ---------------------------------------------------------------------------
function buildSubtitleFilters(sceneText: string, sceneIdx: number, sceneCount: number): string {
    const lines = getTextLines(sceneText);
    const lineHeight = 46;
    const baseY = 720 - 60 - lines.length * lineHeight;

    const textFilters = lines.map((line, li) => {
        const escaped = escapeDrawtext(line);
        const y = baseY + li * lineHeight;
        return (
            `drawtext=text='${escaped}':fontsize=30:fontcolor=white:` +
            `x=(w-text_w)/2:y=${y}:box=1:boxcolor=black@0.6:boxborderw=14`
        );
    });

    const badge =
        `drawtext=text='Scene ${sceneIdx + 1} of ${sceneCount}':` +
        `fontsize=20:fontcolor=white@0.8:x=60:y=40`;

    return [...textFilters, badge].join(',');
}

// ---------------------------------------------------------------------------
// Generate a single scene segment — with Unsplash image or gradient fallback
// ---------------------------------------------------------------------------
async function generateSceneSegment(
    scene: PipelineScene,
    sceneIdx: number,
    sceneCount: number,
    sceneDur: number,           // padded segment duration (for -t flag)
    framesPerScene: number,     // frames for zoompan d= (based on actual audio duration per scene)
    subtitleText: string,       // from TTS script sentences, not scene.text
    outputPath: string,
    imagePath: string | null,
): Promise<void> {
    const fps = 25;
    // zoompan frames = framesPerScene (actual audio duration, NOT padded)
    // segment length = sceneDur (padded) — extra frames are trimmed by -shortest in concat
    const subtitleChain = buildSubtitleFilters(subtitleText, sceneIdx, sceneCount);

    if (imagePath) {
        // ── Image-based background ──────────────────────────────────────────
        // Input 0: loop a single image for sceneDur seconds
        // -vf: scale→crop to 1920×1080 → boxblur → dark overlay → zoompan → subtitles
        const vfChain = [
            // Fit and crop to 1920×1080
            'scale=1920:1080:force_original_aspect_ratio=increase',
            'crop=1920:1080',
            // Subtle blur for cinematic feel
            'boxblur=6:1',
            // Dark semi-transparent overlay via colorchannelmixer can't easily be done
            // Use format+geq to darken: multiply all channels by 0.55
            'format=rgb24',
            `geq=r='r(X\\,Y)*0.55':g='g(X\\,Y)*0.55':b='b(X\\,Y)*0.55'`,
            // Slow Ken Burns zoom
            `zoompan=z='min(zoom+0.0003\\,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${framesPerScene}:s=1280x720:fps=${fps}`,
            // Text overlays
            subtitleChain,
        ].join(',');

        const args = [
            '-y',
            '-loop', '1',
            '-i', imagePath,
            '-vf', vfChain,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-pix_fmt', 'yuv420p',
            '-t', sceneDur.toFixed(3),
            outputPath,
        ];

        await runFFmpeg(args, `scene-${sceneIdx + 1}-img`);

    } else {
        // ── Gradient fallback ───────────────────────────────────────────────
        const c = SCENE_COLORS[sceneIdx % SCENE_COLORS.length];

        const vfChain = [
            'format=rgb24',
            `geq=r='clip(${c.r1}+${c.r2 - c.r1}*X/W\\,0\\,255)':` +
            `g='clip(${c.g1}+${c.g2 - c.g1}*Y/H\\,0\\,255)':` +
            `b='clip(${c.b1}+${c.b2 - c.b1}*(X+Y)/(W+H)\\,0\\,255)'`,
            `zoompan=z='min(zoom+0.0005\\,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${framesPerScene}:s=1280x720:fps=${fps}`,
            subtitleChain,
        ].join(',');

        const args = [
            '-y',
            '-f', 'lavfi',
            '-i', `color=c=black:s=1920x1080:d=${sceneDur.toFixed(3)}:r=${fps}`,
            '-vf', vfChain,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-pix_fmt', 'yuv420p',
            '-t', sceneDur.toFixed(3),
            outputPath,
        ];

        await runFFmpeg(args, `scene-${sceneIdx + 1}-grad`);
    }
}

// ---------------------------------------------------------------------------
// Concat all segments + audio
// ---------------------------------------------------------------------------
async function concatSegmentsWithAudio(
    segmentPaths: string[],
    audioPath: string,
    outputPath: string,
    tmpDir: string,
): Promise<void> {
    const concatListPath = path.join(tmpDir, 'concat.txt');
    const content = segmentPaths
        .map((p) => `file '${p.replace(/\\/g, '/').replace(/'/g, "\\'")}'`)
        .join('\n');
    fs.writeFileSync(concatListPath, content, 'utf-8');
    console.log('[Pipeline] Concat list:\n', content);

    await runFFmpeg([
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-i', audioPath,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-shortest',
        '-movflags', '+faststart',
        outputPath,
    ], 'concat');
}

// ---------------------------------------------------------------------------
// createVideo: orchestrate segments → concat
// ---------------------------------------------------------------------------
async function createVideo(
    script: string,             // full TTS script — used for subtitle sentences
    scenes: PipelineScene[],
    audioPath: string,
    outputPath: string,
    audioDuration: number,
    tmpDir: string,
): Promise<void> {
    const sceneCount = Math.min(scenes.length, 5);
    if (sceneCount === 0) throw new Error('No scenes provided');

    // Split TTS script into sentences and assign to scenes
    const sentences = splitScriptSentences(script);
    const subtitles = assignSentencesToScenes(sentences, sceneCount);

    // ── Duration calculations ──────────────────────────────────────────────
    // frames_per_scene: based on ACTUAL audio duration per scene (no padding)
    // used for zoompan d= so zoom finishes exactly when the scene is meant to end
    const frames_per_scene = Math.ceil((audioDuration / sceneCount) * 25);

    // sceneDur: padded by +2s so concatenated video always exceeds audio length
    // the -shortest flag in concatSegmentsWithAudio trims to exact audio length
    const sceneDur = (audioDuration / sceneCount) + 2;
    const expectedVideoTotal = sceneDur * sceneCount;

    console.log('[Pipeline] Duration plan:');
    console.log(`  audioDuration      = ${audioDuration.toFixed(3)}s`);
    console.log(`  sceneCount         = ${sceneCount}`);
    console.log(`  frames_per_scene   = ${frames_per_scene} @ 25fps`);
    console.log(`  sceneDur (padded)  = ${sceneDur.toFixed(3)}s`);
    console.log(`  total segments     = ${expectedVideoTotal.toFixed(3)}s (trimmed to audio by -shortest)`);
    console.log(`  Script sentences   = ${sentences.length} across ${sceneCount} scenes`);

    // Fetch all Unsplash images in parallel
    const imagePaths: (string | null)[] = await Promise.all(
        scenes.slice(0, sceneCount).map((scene, i) =>
            fetchUnsplashImage(scene.keywords, i, tmpDir)
        )
    );

    // Generate segments sequentially (FFmpeg is CPU-heavy)
    const segmentPaths: string[] = [];
    for (let i = 0; i < sceneCount; i++) {
        const segPath = path.join(tmpDir, `segment-${i}.mp4`);
        await generateSceneSegment(
            scenes[i], i, sceneCount, sceneDur,
            frames_per_scene,
            subtitles[i] || scenes[i].text,  // fallback to scene.text if no sentence
            segPath, imagePaths[i]
        );
        segmentPaths.push(segPath);
    }

    await concatSegmentsWithAudio(segmentPaths, audioPath, outputPath, tmpDir);
}

// ---------------------------------------------------------------------------
// Public: runVideoPipeline
// ---------------------------------------------------------------------------
export async function runVideoPipeline(
    videoId: string,
    script: string,
    scenes: PipelineScene[],
): Promise<void> {
    const supabase = createSupabaseServiceClient();

    // realpathSync expands 8.3 short paths (TIRTHS~1 → TIRTH SHAH)
    const baseTmp = fs.realpathSync(os.tmpdir());
    const tmpDir = fs.mkdtempSync(path.join(baseTmp, 'stube-'));
    console.log(`[Pipeline] Starting video ${videoId} — tmpDir: ${tmpDir}`);

    try {
        // 1. Narration audio
        console.log('[Pipeline] 1/3 Generating audio...');
        const audioPath = path.join(tmpDir, 'audio.mp3');
        await generateAudio(script, audioPath);

        const audioDuration = await getAudioDuration(audioPath);
        console.log(`[Pipeline] Audio: ${audioDuration}s`);

        // 2. Video
        console.log('[Pipeline] 2/3 Creating video...');
        const videoPath = path.join(tmpDir, 'final-video.mp4');
        await createVideo(script, scenes, audioPath, videoPath, audioDuration, tmpDir);

        // 3. Upload
        console.log('[Pipeline] 3/3 Uploading...');
        const videoBuffer = fs.readFileSync(videoPath);
        const storagePath = `${videoId}/final-video.mp4`;

        const { error: uploadError } = await supabase.storage
            .from('videos')
            .upload(storagePath, videoBuffer, { contentType: 'video/mp4', upsert: true });

        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;
        console.log(`[Pipeline] Public URL: ${publicUrl}`);

        const { error: updateError } = await supabase
            .from('videos')
            .update({ video_url: publicUrl, status: 'completed' })
            .eq('id', videoId);

        if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

        console.log(`[Pipeline] ✅ Video ${videoId} completed!`);
    } catch (err: any) {
        console.error(`[Pipeline] ❌ Error:`, err.message);
        await supabase.from('videos').update({ status: 'failed' }).eq('id', videoId);
        throw err;
    } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); }
        catch (e) { console.warn('[Pipeline] Failed to clean tmp:', e); }
    }
}
