import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserCredits } from '@/lib/credits/manager';

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

        // Get user credits
        const credits = await getUserCredits(user.id);

        return NextResponse.json({
            success: true,
            data: credits
        });

    } catch (error) {
        console.error('Error fetching credits:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
