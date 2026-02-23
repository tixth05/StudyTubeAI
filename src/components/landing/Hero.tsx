'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function Hero() {
    const router = useRouter();

    const handleCTA = async () => {
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            router.push('/dashboard');
        } else {
            router.push('/auth/login');
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center px-4 pt-24 pb-20">
            <div className="max-w-5xl mx-auto text-center animate-fadeIn">
                {/* Main heading */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                    Transform Your Study Notes Into
                    <br />
                    <span className="gradient-text">AI-Powered Videos</span>
                </h1>

                {/* Subheading */}
                <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    StudyTube AI converts your study material into engaging video lessons,
                    complete with summaries and interactive quizzes.
                </p>

                {/* Features */}
                <div className="flex flex-wrap justify-center gap-6 mb-12">
                    <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-6 h-6 text-[#6C63FF]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">AI-Generated Summaries</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-6 h-6 text-[#6C63FF]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Interactive Quizzes</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-6 h-6 text-[#6C63FF]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Explainer Videos</span>
                    </div>
                </div>

                {/* CTA Button */}
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCTA}
                    className="text-xl px-12 py-5 mb-6"
                >
                    Create Video From Text →
                </Button>

                {/* Trust badge */}
                <p className="text-sm text-gray-500">
                    ✨ 30 free videos per month • No credit card required
                </p>

                {/* Visual demonstration */}
                <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="glass rounded-2xl p-8 card-shadow animate-scaleIn">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#6C63FF] to-[#8B8BFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">1. Paste Your Notes</h3>
                        <p className="text-gray-600">Simply paste your study material or lecture notes</p>
                    </div>

                    <div className="glass rounded-2xl p-8 card-shadow animate-scaleIn" style={{ animationDelay: '0.1s' }}>
                        <div className="w-16 h-16 bg-gradient-to-br from-[#6C63FF] to-[#8B8BFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">2. AI Processing</h3>
                        <p className="text-gray-600">Our AI analyzes and creates engaging content</p>
                    </div>

                    <div className="glass rounded-2xl p-8 card-shadow animate-scaleIn" style={{ animationDelay: '0.2s' }}>
                        <div className="w-16 h-16 bg-gradient-to-br from-[#6C63FF] to-[#8B8BFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">3. Get Your Video</h3>
                        <p className="text-gray-600">Watch, quiz yourself, and master the topic</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
