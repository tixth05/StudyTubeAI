export interface GeminiResponse {
    summary: string;
    video_script: string;
    scenes: string[];
    quiz: QuizQuestion[];
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

export async function generateStudyContent(studyText: string): Promise<GeminiResponse> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    // Truncate input to 1500 characters to reduce token usage
    const truncatedText = studyText.length > 1500
        ? studyText.substring(0, 1500) + '...'
        : studyText;

    const prompt = `Analyze this study material and return JSON:

${truncatedText}

Return this exact JSON format:
{
  "summary": "**Key Concepts:**\\n- [list main concepts]\\n\\n**Important Definitions:**\\n- [key terms]\\n\\n**Important Points:**\\n- [critical facts]\\n\\n**Quick Revision:**\\n- [exam tips]",
  "video_script": "[Max 200 words explaining the topic clearly]",
  "scenes": ["Scene 1", "Scene 2", "Scene 3", "Scene 4", "Scene 5"],
  "quiz": [
    {"question": "Q1", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "Why correct"},
    {"question": "Q2", "options": ["A","B","C","D"], "correct_index": 1, "explanation": "Why correct"},
    {"question": "Q3", "options": ["A","B","C","D"], "correct_index": 2, "explanation": "Why correct"}
  ]
}

Limits: summary max 120 words, video_script max 200 words, exactly 5 scenes, exactly 3 quiz questions. Return only JSON.`;

    try {
        // Use REST API directly to avoid SDK version issues
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Gemini API error (${response.status}): ${errorData}`);
        }

        const data = await response.json();

        // Extract text from Gemini response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No text content in Gemini response');
        }

        // Clean up the response text
        let jsonText = text.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        // Parse the JSON response
        const parsedResponse = JSON.parse(jsonText);

        // Validate response structure
        if (!parsedResponse.summary || !parsedResponse.video_script || !parsedResponse.scenes || !parsedResponse.quiz) {
            throw new Error('Invalid response structure from Gemini - missing required fields');
        }

        // Ensure quiz questions have correct_index
        parsedResponse.quiz = parsedResponse.quiz.map((q: any, index: number) => {
            // If answer field exists instead of correct_index, convert it
            if (q.answer !== undefined && q.correct_index === undefined) {
                const answerIndex = q.options.indexOf(q.answer);
                return {
                    question: q.question,
                    options: q.options,
                    correct_index: answerIndex >= 0 ? answerIndex : 0,
                    explanation: q.explanation || 'No explanation provided.'
                };
            }

            // Validate correct_index
            if (typeof q.correct_index !== 'number' || q.correct_index < 0 || q.correct_index > 3) {
                console.warn(`Invalid correct_index for question ${index + 1}, defaulting to 0`);
                q.correct_index = 0;
            }

            return q;
        });

        return parsedResponse as GeminiResponse;
    } catch (error: any) {
        console.error('Error calling Gemini API:', error);

        // Provide more specific error messages
        if (error.message?.includes('API key') || error.message?.includes('401')) {
            throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.');
        } else if (error.message?.includes('quota') || error.message?.includes('429')) {
            throw new Error('Gemini API quota exceeded. Please try again later.');
        } else if (error instanceof SyntaxError) {
            throw new Error('Failed to parse AI response as JSON. The AI may have returned invalid format.');
        }

        throw new Error(`Failed to generate content: ${error.message}`);
    }
}
