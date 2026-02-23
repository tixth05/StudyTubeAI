import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import sharp from 'sharp';
import { generateAudio } from './tts';
import { createServerClient } from '@supabase/ssr';

// ---------------------------------------------------------------------------
// FFmpeg setup — use ffmpeg-static binary, never system ffmpeg
// ---------------------------------------------------------------------------
const ffmpegPath = ffmpegStatic;
if (!ffmpegPath) {
    throw new Error('ffmpeg-static binary not found. Run: npm install ffmpeg-static');
}
console.log('[FFmpeg] Binary:', ffmpegPath);
ffmpeg.setFfmpegPath(ffmpegPath);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PipelineScene {
    text: string;
    keywords: string[];
}

// ---------------------------------------------------------------------------
// Supabase service client (bypasses RLS for background processing)
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
        console.log(`[Unsplash] No API key — gradient fallback for scene ${sceneIdx + 1}`);
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

        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) return null;

        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        const imgPath = path.join(tmpDir, `bg-${sceneIdx}.jpg`);
        fs.writeFileSync(imgPath, imgBuffer);
        console.log(`[Unsplash] Scene ${sceneIdx + 1}: "${query}" → ${imgPath}`);
        return imgPath;

    } catch (err: any) {
        console.warn(`[Unsplash] Failed for scene ${sceneIdx + 1}:`, err.message);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Sentence splitting & assignment
// ---------------------------------------------------------------------------
function splitScriptSentences(script: string): string[] {
    return script
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

function assignSentencesToScenes(sentences: string[], sceneCount: number): string[] {
    const perScene = Math.ceil(sentences.length / sceneCount);
    return Array.from({ length: sceneCount }, (_, i) =>
        sentences.slice(i * perScene, (i + 1) * perScene).join(' ')
    );
}

// ---------------------------------------------------------------------------
// Scene gradient colors (used when no Unsplash image is available)
// ---------------------------------------------------------------------------
const SCENE_GRADIENTS = [
    ['#1a0533', '#6C63FF'],
    ['#2d1b69', '#8B8BFF'],
    ['#14145e', '#64C8FF'],
    ['#32065e', '#C864FF'],
    ['#0a1e3c', '#50B4DC'],
];

// ---------------------------------------------------------------------------
// SVG helpers — all text/overlay is built as SVG, composited by Sharp
// NO drawtext in FFmpeg anywhere
// ---------------------------------------------------------------------------

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function wrapTextForSvg(text: string, maxChars = 52): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
        if ((cur + ' ' + w).trim().length <= maxChars) {
            cur = (cur + ' ' + w).trim();
        } else {
            if (cur) lines.push(cur);
            cur = w;
        }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
}

/**
 * Build an SVG overlay containing:
 *  - Bottom fade gradient (for text legibility)
 *  - Semi-transparent subtitle box + white text lines
 *  - Scene badge (top-left)
 *
 * No fonts embedded — uses generic sans-serif (available everywhere).
 */
function buildSvgOverlay(
    subtitleText: string,
    sceneIdx: number,
    sceneCount: number,
    w: number,
    h: number,
): string {
    const lines = wrapTextForSvg(subtitleText);
    const lineH = 56;
    const fontSize = 38;
    const padding = 26;

    const totalTextH = lines.length * lineH;
    const boxH = totalTextH + padding * 2;
    const boxY = h - boxH - 50;

    const textLines = lines.map((line, i) => {
        const textY = boxY + padding + i * lineH + fontSize - 8;
        return `<text x="${w / 2}" y="${textY}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(line)}</text>`;
    }).join('\n    ');

    const sceneLabel = escapeXml(`Scene ${sceneIdx + 1} of ${sceneCount}`);

    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.72"/>
    </linearGradient>
  </defs>

  <!-- Dark fade at bottom for contrast -->
  <rect x="0" y="${Math.round(h * 0.52)}" width="${w}" height="${Math.round(h * 0.48)}" fill="url(#bottomFade)"/>

  <!-- Subtitle background box -->
  <rect x="60" y="${boxY}" width="${w - 120}" height="${boxH}" rx="14" fill="black" fill-opacity="0.62"/>

  <!-- Subtitle text lines -->
  ${textLines}

  <!-- Scene badge top-left -->
  <rect x="40" y="28" width="200" height="48" rx="10" fill="black" fill-opacity="0.55"/>
  <text x="140" y="60" font-family="Arial,Helvetica,sans-serif" font-size="24" fill="white" fill-opacity="0.9" text-anchor="middle">${sceneLabel}</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Sharp: render final scene image (background + blur + overlay + text)
// FFmpeg never touches text — Sharp handles everything visual.
// ---------------------------------------------------------------------------
async function renderSceneImage(
    rawImagePath: string | null,
    subtitleText: string,
    sceneIdx: number,
    sceneCount: number,
    outputPath: string,
    w = 1920,
    h = 1080,
): Promise<void> {
    const svgOverlay = buildSvgOverlay(subtitleText, sceneIdx, sceneCount, w, h);
    const svgBuf = Buffer.from(svgOverlay, 'utf-8');

    if (rawImagePath) {
        // Unsplash photo: scale → blur → dark overlay → SVG text
        await sharp(rawImagePath)
            .resize(w, h, { fit: 'cover', position: 'centre' })
            .blur(5)
            .composite([
                // Dark semi-transparent veil
                {
                    input: {
                        create: {
                            width: w,
                            height: h,
                            channels: 4,
                            background: { r: 0, g: 0, b: 0, alpha: 120 }, // ~47% opacity
                        },
                    },
                    blend: 'over',
                },
                // SVG overlay (fade gradient + subtitle box + text + badge)
                { input: svgBuf, blend: 'over' },
            ])
            .jpeg({ quality: 88 })
            .toFile(outputPath);
    } else {
        // Gradient fallback: render SVG gradient → composite text overlay
        const colors = SCENE_GRADIENTS[sceneIdx % SCENE_GRADIENTS.length];
        const gradientSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors[0]}"/>
      <stop offset="100%" stop-color="${colors[1]}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
</svg>`;

        await sharp(Buffer.from(gradientSvg, 'utf-8'))
            .composite([{ input: svgBuf, blend: 'over' }])
            .jpeg({ quality: 88 })
            .toFile(outputPath);
    }

    console.log(`[Sharp] Scene ${sceneIdx + 1} rendered → ${outputPath}`);
}

// ---------------------------------------------------------------------------
// FFmpeg spawn helper
// ---------------------------------------------------------------------------
function runFFmpeg(args: string[], label: string): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`[FFmpeg:${label}] ${args.join(' ')}`);
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
// Generate a single scene segment
// FFmpeg responsibility: zoompan + encode ONLY. No text. No filters that
// require font libraries. Works on any Linux container.
// ---------------------------------------------------------------------------
async function generateSceneSegment(
    renderedImagePath: string, // Sharp-prepped JPEG (1920×1080, text already baked in)
    sceneIdx: number,
    framesPerScene: number,    // for zoompan d= (actual audio frames, not padded)
    sceneDur: number,          // padded duration for -t (guarantees video > audio)
    outputPath: string,
): Promise<void> {
    const fps = 25;

    // Only zoompan — no drawtext, no boxblur, no geq, no format conversions
    // Sharp already handled: resize, blur, dark overlay, text
    const vfChain = `zoompan=z='min(zoom+0.0003\\,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${framesPerScene}:s=1280x720:fps=${fps}`;

    await runFFmpeg([
        '-y',
        '-loop', '1',
        '-i', renderedImagePath,
        '-vf', vfChain,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-pix_fmt', 'yuv420p',
        '-t', sceneDur.toFixed(3),
        outputPath,
    ], `scene-${sceneIdx + 1}`);
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
// createVideo: orchestrate Sharp rendering → FFmpeg segments → concat
// ---------------------------------------------------------------------------
async function createVideo(
    script: string,
    scenes: PipelineScene[],
    audioPath: string,
    outputPath: string,
    audioDuration: number,
    tmpDir: string,
): Promise<void> {
    const sceneCount = Math.min(scenes.length, 5);
    if (sceneCount === 0) throw new Error('No scenes provided');

    // Subtitle sentences from TTS script
    const sentences = splitScriptSentences(script);
    const subtitles = assignSentencesToScenes(sentences, sceneCount);

    // Duration plan
    const frames_per_scene = Math.ceil((audioDuration / sceneCount) * 25);
    const sceneDur = (audioDuration / sceneCount) + 2; // padded
    const expectedTotal = sceneDur * sceneCount;

    console.log('[Pipeline] Duration plan:');
    console.log(`  audioDuration      = ${audioDuration.toFixed(3)}s`);
    console.log(`  sceneCount         = ${sceneCount}`);
    console.log(`  frames_per_scene   = ${frames_per_scene} @ 25fps`);
    console.log(`  sceneDur (padded)  = ${sceneDur.toFixed(3)}s`);
    console.log(`  total segments     = ${expectedTotal.toFixed(3)}s (trimmed to audio by -shortest)`);
    console.log(`  Script sentences   = ${sentences.length} across ${sceneCount} scenes`);

    // 1. Fetch Unsplash images in parallel
    const rawImagePaths: (string | null)[] = await Promise.all(
        scenes.slice(0, sceneCount).map((scene, i) =>
            fetchUnsplashImage(scene.keywords, i, tmpDir)
        )
    );

    // 2. Render each scene image with Sharp (text baked in) then generate FFmpeg segment
    const segmentPaths: string[] = [];
    for (let i = 0; i < sceneCount; i++) {
        const renderedPath = path.join(tmpDir, `rendered-${i}.jpg`);
        await renderSceneImage(
            rawImagePaths[i],
            subtitles[i] || scenes[i].text,
            i, sceneCount,
            renderedPath,
        );

        const segPath = path.join(tmpDir, `segment-${i}.mp4`);
        await generateSceneSegment(renderedPath, i, frames_per_scene, sceneDur, segPath);
        segmentPaths.push(segPath);
    }

    // 3. Concat segments + audio → final video
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

    // realpathSync expands 8.3 short paths (TIRTHS~1 → TIRTH SHAH) on Windows
    const baseTmp = fs.realpathSync(os.tmpdir());
    const tmpDir = fs.mkdtempSync(path.join(baseTmp, 'stube-'));
    console.log(`[Pipeline] Starting video ${videoId} — tmpDir: ${tmpDir}`);

    try {
        // 1. Narration audio via TTS
        console.log('[Pipeline] 1/3 Generating audio...');
        const audioPath = path.join(tmpDir, 'audio.mp3');
        await generateAudio(script, audioPath);

        const audioDuration = await getAudioDuration(audioPath);
        console.log(`[Pipeline] Audio duration: ${audioDuration.toFixed(3)}s`);

        // 2. Render scenes + encode video
        console.log('[Pipeline] 2/3 Creating video...');
        const videoPath = path.join(tmpDir, 'final-video.mp4');
        await createVideo(script, scenes, audioPath, videoPath, audioDuration, tmpDir);

        // 3. Upload to Supabase Storage
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
        console.error(`[Pipeline] ❌ Error for ${videoId}:`, err.message);
        await supabase.from('videos').update({ status: 'failed' }).eq('id', videoId);
        throw err;

    } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); }
        catch (e) { console.warn('[Pipeline] Failed to clean tmp:', e); }
    }
}
