import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkCredits, deductCredit } from '@/lib/credits/manager';
import { processStudyText, generateTitle } from '@/lib/gemini/processor';
import { generateVideo } from '@/lib/video/generator';

export async function POST(request: NextRequest) {
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

        // Parse request body
        const { text } = await request.json();

        if (!text || text.trim().length < 50) {
            return NextResponse.json(
                { success: false, error: 'Text must be at least 50 characters long' },
                { status: 400 }
            );
        }

        // Check if user has credits
        const creditCheck = await checkCredits(user.id);
        if (!creditCheck.hasCredits) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Insufficient credits',
                    creditsRemaining: 0
                },
                { status: 403 }
            );
        }

        // Process text with Gemini AI
        const aiResult = await processStudyText(text);

        // Generate title
        const title = await generateTitle(text);

        // Generate video
        const videoUrl = await generateVideo(aiResult.scenes, aiResult.narration_script, user.id);

        // Save to database
        const { data: video, error: dbError } = await supabase
            .from('videos')
            .insert({
                user_id: user.id,
                title,
                input_text: text,
                summary: aiResult.summary,
                video_url: videoUrl,
                quiz_json: { questions: aiResult.quiz },
                credits_cost: 1
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { success: false, error: 'Failed to save video' },
                { status: 500 }
            );
        }

        // Deduct credit
        await deductCredit(user.id, 1);

        // Return success response
        return NextResponse.json({
            success: true,
            data: {
                video_id: video.id,
                video_url: videoUrl,
                summary: aiResult.summary,
                quiz: aiResult.quiz,
                title
            }
        });

    } catch (error) {
        console.error('Error generating video:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
