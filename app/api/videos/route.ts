import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const supabase = await supabaseServer();

        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch videos for the current user
        const { data: videos, error } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching videos:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch videos' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: videos || []
        });

    } catch (error: any) {
        console.error('Error in /api/videos:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
