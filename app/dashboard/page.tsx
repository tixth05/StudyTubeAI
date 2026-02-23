'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Navbar from '@/components/layout/Navbar';
import { getCurrentUser, signOut } from '@/lib/auth/helpers';
import { Video } from '@/types';

export default function DashboardPage() {
    const router = useRouter();
    const [credits, setCredits] = useState<any>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                router.push('/auth/login');
                return;
            }
            setUser(currentUser);

            // Fetch credits (cookie-based auth handled by server)
            const creditsRes = await fetch('/api/user/credits');
            if (creditsRes.ok) {
                const creditsData = await creditsRes.json();
                if (creditsData.success) {
                    setCredits(creditsData.data);
                }
            }

            // Fetch videos
            const videosRes = await fetch('/api/videos');
            if (videosRes.ok) {
                const videosData = await videosRes.json();
                if (videosData.success) {
                    setVideos(videosData.data);
                }
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen px-4 py-8 pt-24">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
                            <p className="text-gray-600">Welcome back! Ready to create amazing study videos?</p>
                        </div>
                        <Button variant="ghost" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </div>

                    {/* Credits Display */}
                    <Card glass className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-1">Monthly Credits</h3>
                                <p className="text-3xl font-bold gradient-text">
                                    {credits?.remaining_credits ?? 0} / {credits?.monthly_credits ?? 30}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Resets on {credits?.reset_date ? new Date(credits.reset_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => router.push('/chat')}
                                    disabled={credits !== null && !credits?.has_credits}
                                >
                                    + New Video Chat
                                </Button>
                                {credits !== null && !credits?.has_credits && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push('/pricing')}
                                    >
                                        Buy More Credits
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-[#6C63FF] to-[#8B8BFF] h-3 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(((credits?.remaining_credits ?? 0) / (credits?.monthly_credits ?? 30)) * 100).toFixed(0)}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </Card>

                    {/* Video History */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Your Videos</h2>

                        {videos.length === 0 ? (
                            <Card glass className="text-center py-12">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#6C63FF] to-[#8B8BFF] rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No videos yet</h3>
                                <p className="text-gray-500 mb-6">Create your first AI-powered study video!</p>
                                <Button variant="primary" onClick={() => router.push('/chat')}>
                                    Create Your First Video
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {videos.map((video) => (
                                    <Card key={video.id} hover glass>
                                        <div className="aspect-video bg-gradient-to-br from-[#6C63FF] to-[#8B8BFF] rounded-lg mb-4 flex items-center justify-center">
                                            <svg className="w-16 h-16 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1 truncate">{video.title || 'Study Session'}</h3>
                                        <p className="text-sm text-gray-500 mb-1">
                                            {new Date(video.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                        {video.input_text && (
                                            <p className="text-xs text-gray-400 mb-4 line-clamp-2">{video.input_text.substring(0, 100)}...</p>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => router.push(`/video/${video.id}`)}
                                        >
                                            View Summary & Quiz
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
