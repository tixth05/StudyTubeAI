import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    try {
        // Get user from session
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: request.headers.get('Authorization') || ''
                    }
                }
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch user's videos
        const { data: videos, error: dbError } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch videos' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: videos
        });

    } catch (error) {
        console.error('Error fetching videos:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
