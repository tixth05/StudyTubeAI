import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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

        const { text } = await request.json();

        if (!text || text.trim().length < 50) {
            return NextResponse.json(
                { success: false, error: 'Text must be at least 50 characters' },
                { status: 400 }
            );
        }

        // Check user credits
        let { data: user, error: userError } = await supabase
            .from('users')
            .select('monthly_credits, credits_used')
            .eq('id', session.user.id)
            .single();

        // If user doesn't exist, create profile automatically
        if (userError && userError.code === 'PGRST116') {
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: session.user.id,
                    email: session.user.email,
                    phone: session.user.phone,
                    monthly_credits: 30,
                    credits_used: 0
                });

            if (insertError) {
                return NextResponse.json(
                    { success: false, error: 'Failed to create user profile' },
                    { status: 500 }
                );
            }

            const { data: newUser } = await supabase
                .from('users')
                .select('monthly_credits, credits_used')
                .eq('id', session.user.id)
                .single();

            user = newUser;
        } else if (userError || !user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const remainingCredits = user!.monthly_credits - user!.credits_used;
        if (remainingCredits <= 0) {
            return NextResponse.json(
                { success: false, error: 'Insufficient credits' },
                { status: 403 }
            );
        }

        // Generate content using Groq AI
        const { generateStudyContent } = await import('@/lib/ai/groq');

        let aiResponse;
        try {
            aiResponse = await generateStudyContent(text);
        } catch (aiError: any) {
            console.error('[generate-video] Groq AI error:', aiError.message);
            return NextResponse.json(
                { success: false, error: `AI generation failed: ${aiError.message}` },
                { status: 500 }
            );
        }

        // Serialize summary for database storage
        const summaryText = JSON.stringify(aiResponse.summary);

        // Deduct credit
        await supabase
            .from('users')
            .update({ credits_used: user!.credits_used + 1 })
            .eq('id', session.user.id);

        // Save video record with status='processing'
        const { data: savedVideo, error: insertError } = await supabase
            .from('videos')
            .insert({
                user_id: session.user.id,
                input_text: text,
                summary: summaryText,
                video_script: aiResponse.video_script,
                scenes_json: aiResponse.scenes,
                video_url: null,
                quiz_json: { questions: aiResponse.quiz },
                credits_cost: 1,
                status: 'processing'
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('[generate-video] Error saving video:', insertError.message);
        }

        const videoId = savedVideo?.id;

        // Fire-and-forget: run pipeline directly in background.
        // setImmediate defers until after this HTTP response is sent.
        // No internal fetch() — direct function call only.
        if (videoId) {
            // Service-role client for the pipeline (bypasses RLS)
            const serviceClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // Normalize scenes to {text, keywords}[]
            const scenes = (aiResponse.scenes || []).map((s: any) =>
                typeof s === 'string'
                    ? { text: s, keywords: [] }
                    : { text: s.text || '', keywords: s.keywords || [] }
            );

            setImmediate(async () => {
                try {
                    const { runVideoPipeline } = await import('@/lib/video/pipeline');
                    await runVideoPipeline(videoId, aiResponse!.video_script || '', scenes);
                } catch (err: any) {
                    console.error('[generate-video] Pipeline failed for', videoId, ':', err.message);
                    // Mark video as failed so frontend stops polling
                    await serviceClient
                        .from('videos')
                        .update({ status: 'failed' })
                        .eq('id', videoId);
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: videoId,
                summary: aiResponse.summary,
                video_script: aiResponse.video_script,
                scenes: aiResponse.scenes,
                video_url: null,
                quiz: aiResponse.quiz,
                status: 'processing'
            }
        });

    } catch (error: any) {
        console.error('[generate-video] Unhandled error:', error.message);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
