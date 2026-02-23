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

        // Get user credits
        const { data: user, error } = await supabase
            .from('users')
            .select('monthly_credits, credits_used, reset_date')
            .eq('id', session.user.id)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const remainingCredits = user.monthly_credits - user.credits_used;

        return NextResponse.json({
            success: true,
            data: {
                monthly_credits: user.monthly_credits,
                credits_used: user.credits_used,
                remaining_credits: remainingCredits,
                reset_date: user.reset_date,
                has_credits: remainingCredits > 0
            }
        });

    } catch (error: any) {
        console.error('Error fetching credits:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
