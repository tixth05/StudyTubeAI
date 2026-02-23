'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import InteractiveQuiz from '@/components/quiz/InteractiveQuiz';

export default function VideoDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [video, setVideo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (params?.id) {
            loadVideo(params.id as string);
        }
    }, [params?.id]);

    const loadVideo = async (id: string) => {
        try {
            const res = await fetch(`/api/videos/${id}`);
            if (!res.ok) {
                setError('Video not found');
                return;
            }
            const data = await res.json();
            if (data.success) {
                setVideo(data.data);
            } else {
                setError(data.error || 'Failed to load video');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading video...</p>
                </div>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card glass className="text-center p-8">
                    <p className="text-red-500 mb-4">{error || 'Video not found'}</p>
                    <Button variant="primary" onClick={() => router.push('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    // Parse summary if it's a JSON string
    let summary = video.summary;
    try {
        if (typeof summary === 'string') {
            summary = JSON.parse(summary);
        }
    } catch {
        // Keep as string if not valid JSON
    }

    // Parse quiz
    const quiz = video.quiz_json?.questions || [];

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">Study Video</h1>
                        <p className="text-gray-500 text-sm">
                            Created on {new Date(video.created_at).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                        ← Dashboard
                    </Button>
                </div>

                <div className="space-y-8">
                    {/* Summary */}
                    <Card glass>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Summary
                        </h2>
                        {summary && typeof summary === 'object' ? (
                            <div className="space-y-4">
                                {summary.key_concepts?.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-[#6C63FF] mb-2">🔑 Key Concepts</h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {summary.key_concepts.map((item: string, i: number) => (
                                                <li key={i} className="text-gray-700 text-sm">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {summary.definitions?.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-[#6C63FF] mb-2">📖 Important Definitions</h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {summary.definitions.map((item: string, i: number) => (
                                                <li key={i} className="text-gray-700 text-sm">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {summary.important_points?.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-[#6C63FF] mb-2">⭐ Important Points to Remember</h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {summary.important_points.map((item: string, i: number) => (
                                                <li key={i} className="text-gray-700 text-sm">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {summary.quick_revision?.length > 0 && (
                                    <div className="bg-[#6C63FF]/5 border border-[#6C63FF]/20 rounded-lg p-4">
                                        <h3 className="font-semibold text-[#6C63FF] mb-2">⚡ Quick Revision Notes</h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {summary.quick_revision.map((item: string, i: number) => (
                                                <li key={i} className="text-gray-700 text-sm">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-700 leading-relaxed">{summary}</p>
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
                            {video.video_url ? (
                                <video controls className="w-full h-full" src={video.video_url}>
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white">
                                    <div className="text-center">
                                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <p className="opacity-75">Video generation coming soon</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Quiz */}
                    {quiz.length > 0 && (
                        <Card glass>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <svg className="w-6 h-6 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Test Your Knowledge
                            </h2>
                            <InteractiveQuiz questions={quiz} />
                        </Card>
                    )}

                    {/* Original Input */}
                    {video.input_text && (
                        <Card glass>
                            <h2 className="text-xl font-bold mb-3 text-gray-700">Original Study Material</h2>
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-6">{video.input_text}</p>
                        </Card>
                    )}

                    <div className="text-center">
                        <Button variant="primary" size="lg" onClick={() => router.push('/chat')}>
                            + Create New Video
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
