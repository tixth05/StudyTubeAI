import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Video ID is required' },
                { status: 400 }
            );
        }

        const supabase = await supabaseServer();

        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { data: video, error } = await supabase
            .from('videos')
            .select('id, status, video_url, summary, quiz_json, input_text, created_at')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (error || !video) {
            return NextResponse.json(
                { success: false, error: 'Video not found' },
                { status: 404 }
            );
        }

        // Parse summary if stored as JSON string
        let summary = video.summary;
        try {
            if (typeof summary === 'string') summary = JSON.parse(summary);
        } catch { /* keep as-is */ }

        return NextResponse.json({
            success: true,
            data: {
                id: video.id,
                status: video.status || 'completed', // default for old rows without status column
                video_url: video.video_url,
                summary,
                quiz: video.quiz_json?.questions || [],
                input_text: video.input_text,
                created_at: video.created_at,
            }
        });

    } catch (error: any) {
        console.error('Error fetching video:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
