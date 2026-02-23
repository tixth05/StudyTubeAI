'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import InteractiveQuiz from '@/components/quiz/InteractiveQuiz';
import { QuizQuestion } from '@/types';

export default function ChatPage() {
    const router = useRouter();
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [isVideoProcessing, setIsVideoProcessing] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, []);

    const startPolling = (videoId: string) => {
        setIsVideoProcessing(true);
        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/videos/${videoId}`);
                if (!res.ok) return;
                const data = await res.json();
                const video = data.data;
                if (video?.status === 'completed' && video?.video_url) {
                    setResult((prev: any) => ({ ...prev, video_url: video.video_url, status: 'completed' }));
                    setIsVideoProcessing(false);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                } else if (video?.status === 'failed') {
                    setIsVideoProcessing(false);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                }
            } catch (e) {
                // Keep polling on transient errors
            }
        }, 3000); // Poll every 3 seconds
    };

    const handleGenerate = async () => {
        if (inputText.trim().length < 50) {
            setError('Please enter at least 50 characters of study content');
            return;
        }

        setError('');
        setIsGenerating(true);

        try {
            const response = await fetch('/api/generate-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: inputText })
            });

            const data = await response.json();

            if (!data.success) {
                if (response.status === 403) {
                    // Out of credits
                    router.push('/pricing');
                    return;
                }
                throw new Error(data.error || 'Failed to generate video');
            }

            setResult(data.data);

            // Start polling if video is processing
            if (data.data?.id && data.data?.status === 'processing') {
                startPolling(data.data.id);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNewChat = () => {
        setInputText('');
        setResult(null);
        setError('');
        setIsVideoProcessing(false);
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">
                            {result ? 'Your Study Video' : 'Create Study Video'}
                        </h1>
                        <p className="text-gray-600">
                            {result ? 'Review your generated content below' : 'Paste your study material to get started'}
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                        ← Dashboard
                    </Button>
                </div>

                {/* Input Section (shown when no result) */}
                {!result && (
                    <Card glass className="mb-8">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="studyText" className="block text-sm font-medium text-gray-700 mb-2">
                                    Study Material
                                </label>
                                <textarea
                                    id="studyText"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent outline-none transition-all resize-none"
                                    rows={12}
                                    placeholder="Paste your study notes, lecture content, or any educational material here...

Example:
Photosynthesis is the process by which plants convert light energy into chemical energy. It occurs in the chloroplasts of plant cells and involves two main stages: the light-dependent reactions and the Calvin cycle..."
                                    disabled={isGenerating}
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    {inputText.length} characters (minimum 50 required)
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleGenerate}
                                isLoading={isGenerating}
                                disabled={inputText.length < 50}
                                className="w-full"
                            >
                                {isGenerating ? 'Generating Your Video...' : 'Generate Study Video'}
                            </Button>

                            {isGenerating && (
                                <div className="text-center text-gray-600 space-y-2">
                                    <p className="font-medium">Creating your personalized study content...</p>
                                    <p className="text-sm">This may take 30-60 seconds</p>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Results Section */}
                {result && (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Summary */}
                        <Card glass>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Summary
                            </h2>
                            {result.summary && typeof result.summary === 'object' ? (
                                <div className="space-y-4">
                                    {result.summary.key_concepts?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-[#6C63FF] mb-2">🔑 Key Concepts</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {result.summary.key_concepts.map((item: string, i: number) => (
                                                    <li key={i} className="text-gray-700 text-sm">{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {result.summary.definitions?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-[#6C63FF] mb-2">📖 Important Definitions</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {result.summary.definitions.map((item: string, i: number) => (
                                                    <li key={i} className="text-gray-700 text-sm">{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {result.summary.important_points?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-[#6C63FF] mb-2">⭐ Important Points to Remember</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {result.summary.important_points.map((item: string, i: number) => (
                                                    <li key={i} className="text-gray-700 text-sm">{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {result.summary.quick_revision?.length > 0 && (
                                        <div className="bg-[#6C63FF]/5 border border-[#6C63FF]/20 rounded-lg p-4">
                                            <h3 className="font-semibold text-[#6C63FF] mb-2">⚡ Quick Revision Notes</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {result.summary.quick_revision.map((item: string, i: number) => (
                                                    <li key={i} className="text-gray-700 text-sm">{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-700 leading-relaxed">{result.summary}</p>
                            )}
                        </Card>

                        {/* Video Player */}
                        <Card glass>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Explainer Video
                            </h2>
                            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                                {result.video_url ? (
                                    <video
                                        controls
                                        className="w-full h-full"
                                        src={result.video_url}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white">
                                        <div className="text-center">
                                            {isVideoProcessing ? (
                                                <>
                                                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                                                    <p className="font-medium">Video is being processed...</p>
                                                    <p className="text-sm opacity-60 mt-1">This takes 30–90 seconds. Page updates automatically.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    <p className="opacity-75">Video unavailable</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Interactive Quiz */}
                        {result.quiz && result.quiz.length > 0 && (
                            <Card glass>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    Test Your Knowledge
                                </h2>
                                <InteractiveQuiz questions={result.quiz} />
                            </Card>
                        )}

                        {/* New Chat Button */}
                        <div className="text-center">
                            <Button variant="primary" size="lg" onClick={handleNewChat}>
                                + Start New Chat
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
