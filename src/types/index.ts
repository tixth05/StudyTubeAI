// Quiz types
export interface QuizQuestion {
    question: string;
    options: string[];
    correct_index: number;
    explanation?: string;
}

export interface Quiz {
    questions: QuizQuestion[];
}

// Video generation types
export interface VideoScene {
    text: string;
    duration: number;
    image_prompt?: string;
}

export interface VideoGenerationResult {
    summary: string;
    narration_script: string;
    scenes: VideoScene[];
    quiz: QuizQuestion[];
}

// Video record type
export interface Video {
    id: string;
    user_id: string;
    title: string | null;
    input_text: string;
    summary: string | null;
    video_url: string | null;
    quiz_json: Quiz | null;
    credits_cost: number;
    created_at: string;
}

// User profile type
export interface UserProfile {
    id: string;
    email: string | null;
    phone: string | null;
    first_name: string | null;
    last_name: string | null;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
    occupation: 'student' | 'working' | null;
    monthly_credits: number;
    credits_used: number;
    reset_date: string;
    created_at: string;
    updated_at: string;
}

// API response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface GenerateVideoRequest {
    text: string;
}

export interface GenerateVideoResponse {
    video_id: string;
    video_url: string;
    summary: string;
    quiz: QuizQuestion[];
}
