'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Button from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/client';
import { signOut } from '@/lib/auth/helpers';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Don't show navbar on auth pages
    const isAuthPage = pathname?.startsWith('/auth');

    useEffect(() => {
        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabaseBrowser().auth.onAuthStateChange((event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAuth = async () => {
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        setLoading(false);
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (isAuthPage) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#6C63FF] to-[#8B8BFF] rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-[#6C63FF] to-[#8B8BFF] bg-clip-text text-transparent">
                            StudyTube AI
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-gray-600 hover:text-[#6C63FF] transition-colors font-medium">
                            Home
                        </Link>
                        <Link href="/pricing" className="text-gray-600 hover:text-[#6C63FF] transition-colors font-medium">
                            Pricing
                        </Link>
                    </div>

                    {/* Auth Buttons */}
                    {!loading && (
                        <div className="flex items-center space-x-3">
                            {isAuthenticated ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push('/dashboard')}
                                        className="hidden sm:block"
                                    >
                                        Dashboard
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleSignOut}
                                    >
                                        Sign Out
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push('/auth/login')}
                                        className="hidden sm:block"
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => router.push('/auth/signup')}
                                    >
                                        Sign Up
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
