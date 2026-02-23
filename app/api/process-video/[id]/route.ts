import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Service role client — bypasses RLS so the fire-and-forget fetch (no cookies) can read videos
function createServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const videoId = id;

    console.log(`[process-video] Starting pipeline for video ${videoId}`);

    try {
        const supabase = createServiceClient();

        const { data: video, error } = await supabase
            .from('videos')
            .select('id, video_script, scenes_json, status')
            .eq('id', videoId)
            .single();

        if (error || !video) {
            console.error('[process-video] Video lookup failed:', error?.message);
            return NextResponse.json(
                { success: false, error: 'Video not found' },
                { status: 404 }
            );
        }

        if (video.status === 'completed') {
            return NextResponse.json({ success: true, message: 'Already completed' });
        }

        // Dynamic import to avoid loading ffmpeg/sharp at module level
        const { runVideoPipeline } = await import('@/lib/video/pipeline');

        // scenes_json can be string[] (old) or {text, keywords}[] (new) — normalize to {text, keywords}[]
        const rawScenes: any[] = video.scenes_json || [];
        const scenes = rawScenes.map((s: any) =>
            typeof s === 'string'
                ? { text: s, keywords: [] }
                : { text: s.text || '', keywords: s.keywords || [] }
        );

        await runVideoPipeline(
            videoId,
            video.video_script || '',
            scenes
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error(`[process-video] Pipeline failed for ${videoId}:`, error.message);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
