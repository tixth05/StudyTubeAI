import { supabaseAdmin, supabaseBrowser } from '../supabase/client';

export interface CreditCheckResult {
    hasCredits: boolean;
    creditsRemaining: number;
    monthlyCredits: number;
    creditsUsed: number;
    resetDate: string;
}

/**
 * Check if user has available credits and reset if needed
 */
export async function checkCredits(userId: string): Promise<CreditCheckResult> {
    const supabase = supabaseAdmin();

    // Get user's credit info
    const { data: user, error } = await supabase
        .from('users')
        .select('monthly_credits, credits_used, reset_date')
        .eq('id', userId)
        .single();

    if (error || !user) {
        throw new Error('Failed to fetch user credits');
    }

    // Check if we need to reset monthly credits
    const resetDate = new Date(user.reset_date);
    const now = new Date();

    if (now >= resetDate) {
        // Reset credits
        await resetMonthlyCredits(userId);
        return {
            hasCredits: true,
            creditsRemaining: user.monthly_credits,
            monthlyCredits: user.monthly_credits,
            creditsUsed: 0,
            resetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
    }

    const creditsRemaining = user.monthly_credits - user.credits_used;

    return {
        hasCredits: creditsRemaining > 0,
        creditsRemaining,
        monthlyCredits: user.monthly_credits,
        creditsUsed: user.credits_used,
        resetDate: user.reset_date
    };
}

/**
 * Deduct credits from user account
 */
export async function deductCredit(userId: string, amount: number = 1): Promise<boolean> {
    const supabase = supabaseAdmin();

    // First check if user has credits
    const creditCheck = await checkCredits(userId);

    if (!creditCheck.hasCredits) {
        return false;
    }

    // Increment credits_used
    const { error } = await supabase
        .from('users')
        .update({
            credits_used: creditCheck.creditsUsed + amount,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) {
        throw new Error('Failed to deduct credits');
    }

    return true;
}

/**
 * Reset monthly credits (called when reset_date has passed)
 */
export async function resetMonthlyCredits(userId: string): Promise<void> {
    const supabase = supabaseAdmin();

    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);

    const { error } = await supabase
        .from('users')
        .update({
            credits_used: 0,
            reset_date: nextResetDate.toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) {
        throw new Error('Failed to reset monthly credits');
    }
}

/**
 * Add credits to user account (for purchases)
 */
export async function addCredits(userId: string, amount: number): Promise<void> {
    const supabase = supabaseAdmin();

    const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('monthly_credits')
        .eq('id', userId)
        .single();

    if (fetchError || !user) {
        throw new Error('Failed to fetch user');
    }

    const { error } = await supabase
        .from('users')
        .update({
            monthly_credits: user.monthly_credits + amount,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) {
        throw new Error('Failed to add credits');
    }
}

/**
 * Get user's credit information (for display)
 */
export async function getUserCredits(userId: string): Promise<CreditCheckResult> {
    return checkCredits(userId);
}
