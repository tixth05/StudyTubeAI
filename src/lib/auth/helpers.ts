import { supabaseBrowser, supabaseAdmin } from '../supabase/client';

/**
 * Get current user session
 */
export async function getCurrentUser() {
    const supabase = supabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return !!user;
}

/**
 * Sign up with email - sends OTP code to email
 */
export async function signUpWithEmail(email: string) {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
            // No emailRedirectTo — forces Supabase to send numeric OTP only (not magic link)
        }
    });

    if (error) throw error;
    return data;
}

/**
 * Sign up with phone - sends OTP code to phone
 */
export async function signUpWithPhone(phone: string) {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
            shouldCreateUser: true
        }
    });

    if (error) throw error;
    return data;
}

/**
 * Send OTP to email
 */
export async function sendEmailOTP(email: string) {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: false
        }
    });

    if (error) throw error;
    return data;
}

/**
 * Send OTP to phone
 */
export async function sendPhoneOTP(phone: string) {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
            shouldCreateUser: false
        }
    });

    if (error) throw error;
    return data;
}

/**
 * Verify OTP
 */
export async function verifyOTP(emailOrPhone: string, token: string, type: 'email' | 'sms') {
    const supabase = supabaseBrowser();

    const verifyData = type === 'email'
        ? { email: emailOrPhone, token, type: 'email' as const }
        : { phone: emailOrPhone, token, type: 'sms' as const };

    const { data, error } = await supabase.auth.verifyOtp(verifyData);

    if (error) throw error;
    return data;
}

/**
 * Sign in with email/phone and password
 */
export async function signInWithPassword(emailOrPhone: string, password: string) {
    const supabase = supabaseBrowser();

    // Determine if it's email or phone
    const isEmail = emailOrPhone.includes('@');

    const credentials = isEmail
        ? { email: emailOrPhone, password }
        : { phone: emailOrPhone, password };

    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) throw error;
    return data;
}

/**
 * Sign out
 */
export async function signOut() {
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw error;
    return data;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) throw error;
    return data;
}

/**
 * Save user profile data after signup
 */
export async function saveUserProfile(profileData: {
    firstName: string;
    lastName: string;
    gender: string;
    occupation: string;
}) {
    const supabase = supabaseBrowser();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    // Update user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
        data: {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            gender: profileData.gender,
            occupation: profileData.occupation
        }
    });

    if (metadataError) throw metadataError;

    // Also save to users table
    const { error: dbError } = await supabase
        .from('users')
        .update({
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            gender: profileData.gender,
            occupation: profileData.occupation
        })
        .eq('id', user.id);

    if (dbError && dbError.code !== '23505') {
        throw dbError;
    }
}

/**
 * Create user profile in database (called after signup)
 */
export async function createUserProfile(userId: string, email?: string, phone?: string) {
    const supabase = supabaseAdmin();

    const { error } = await supabase
        .from('users')
        .insert({
            id: userId,
            email: email || null,
            phone: phone || null,
            monthly_credits: 30,
            credits_used: 0
        });

    if (error && error.code !== '23505') { // Ignore duplicate key error
        throw error;
    }
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string) {
    const supabase = supabaseBrowser();

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}
