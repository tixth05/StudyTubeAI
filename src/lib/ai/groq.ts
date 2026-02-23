import OpenAI from "openai";

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export interface Scene {
    text: string;
    keywords: string[];
}

export interface GroqResponse {
    summary: {
        key_concepts: string[];
        definitions: string[];
        important_points: string[];
        quick_revision: string[];
    };
    video_script: string;
    scenes: Scene[];
    quiz: QuizQuestion[];
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}

export async function generateStudyContent(text: string): Promise<GroqResponse> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
    }

    // Truncate input to 1500 characters to stay within token limits
    const truncatedText = text.length > 1500
        ? text.substring(0, 1500) + '...'
        : text;

    const prompt = `You are an expert YouTube-style study explainer.

Analyze the study material below and return ONLY valid JSON with NO markdown, NO code blocks, NO extra text.

JSON structure (copy exactly):
{
  "summary": {
    "key_concepts": ["concept 1", "concept 2", "concept 3"],
    "definitions": ["Term: definition", "Term: definition"],
    "important_points": ["point 1", "point 2", "point 3"],
    "quick_revision": ["tip 1", "tip 2", "tip 3"]
  },
  "video_script": "A conversational 150-200 word explainer script. Friendly YouTube teacher tone. DO NOT copy the input — summarize and teach. Cover only 3-5 main ideas. No bullet points, flowing natural speech.",
  "scenes": [
    { "text": "Hook sentence introducing the topic (1-2 sentences)", "keywords": ["keyword1", "keyword2", "keyword3"] },
    { "text": "First key concept explained simply (1-2 sentences)", "keywords": ["keyword1", "keyword2", "keyword3"] },
    { "text": "Second key concept explained simply (1-2 sentences)", "keywords": ["keyword1", "keyword2", "keyword3"] },
    { "text": "Third key concept or example (1-2 sentences)", "keywords": ["keyword1", "keyword2", "keyword3"] },
    { "text": "Wrap-up with why this matters (1-2 sentences)", "keywords": ["keyword1", "keyword2", "keyword3"] }
  ],
  "quiz": [
    {
      "question": "Question 1?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Why this is correct"
    },
    {
      "question": "Question 2?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 1,
      "explanation": "Why this is correct"
    },
    {
      "question": "Question 3?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 2,
      "explanation": "Why this is correct"
    }
  ]
}

Rules:
- video_script: 150-200 words, conversational tone, DO NOT copy the input text
- scenes: exactly 5 objects, each with "text" (1-2 simple sentences) and "keywords" (3-5 important nouns, good for image search)
- quiz: exactly 3 questions, 4 options each, correct_index is 0-3
- Return ONLY the JSON object, nothing else

Study material:
${truncatedText}`;

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
        });

        const rawText = completion.choices[0].message.content || '';

        // Strip markdown code fences if model adds them
        let jsonText = rawText.trim();
        const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) {
            jsonText = fenceMatch[1].trim();
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\w*\n?/g, '').replace(/```\n?$/g, '').trim();
        }

        const parsed = JSON.parse(jsonText);

        // Validate required fields
        if (!parsed.summary || !parsed.video_script || !parsed.scenes || !parsed.quiz) {
            throw new Error('Invalid response structure from Groq - missing required fields');
        }

        // Normalise scenes — support both old string[] and new {text, keywords}[] format
        parsed.scenes = parsed.scenes.map((s: any) => {
            if (typeof s === 'string') {
                return { text: s, keywords: [] };
            }
            return {
                text: s.text || '',
                keywords: Array.isArray(s.keywords) ? s.keywords : [],
            };
        });

        // Normalize quiz correct_index
        parsed.quiz = parsed.quiz.map((q: any) => {
            if (q.answer !== undefined && q.correct_index === undefined) {
                const idx = q.options.indexOf(q.answer);
                return { ...q, correct_index: idx >= 0 ? idx : 0, explanation: q.explanation || '' };
            }
            if (typeof q.correct_index !== 'number') q.correct_index = 0;
            return q;
        });

        return parsed as GroqResponse;
    } catch (error: any) {
        console.error('Groq API error:', error);
        if (error instanceof SyntaxError) {
            throw new Error('Failed to parse AI response as JSON');
        }
        throw new Error(`AI generation failed: ${error.message}`);
    }
}
