import { GoogleGenerativeAI } from '@google/generative-ai';
import { VideoGenerationResult } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Process study text and generate structured content
 */
export async function processStudyText(inputText: string): Promise<VideoGenerationResult> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert educational content creator. Analyze the following study material and create comprehensive learning content.

Study Material:
${inputText}

Generate a JSON response with the following structure (MUST be valid JSON):
{
  "summary": "A concise 2-3 sentence summary of the key concepts",
  "narration_script": "A clear, engaging narration script (60-90 seconds) explaining the topic as if teaching a student",
  "scenes": [
    {
      "text": "Key point or concept to display visually",
      "duration": 5,
      "image_prompt": "Description for generating a relevant educational image"
    }
  ],
  "quiz": [
    {
      "question": "Clear, specific question testing understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Why this answer is correct and others are wrong"
    }
  ]
}

Requirements:
- Create 4-6 scenes, each 4-6 seconds long
- Generate 4-5 quiz questions with 4 options each
- Make the narration engaging and educational
- Ensure quiz questions test real understanding, not just memorization
- Return ONLY valid JSON, no markdown formatting or extra text`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean the response - remove markdown code blocks if present
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```\n?/g, '');
        }

        const parsed = JSON.parse(cleanedText);

        // Validate the structure
        if (!parsed.summary || !parsed.narration_script || !parsed.scenes || !parsed.quiz) {
            throw new Error('Invalid response structure from Gemini');
        }

        return parsed as VideoGenerationResult;
    } catch (error) {
        console.error('Error processing study text:', error);
        throw new Error('Failed to process study text with AI');
    }
}

/**
 * Generate a title for the video based on content
 */
export async function generateTitle(inputText: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate a short, catchy title (max 60 characters) for this study content:\n\n${inputText.substring(0, 500)}...\n\nReturn ONLY the title, nothing else.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const title = response.text().trim().replace(/['"]/g, '');
        return title.substring(0, 60);
    } catch (error) {
        console.error('Error generating title:', error);
        return 'Study Video';
    }
}
