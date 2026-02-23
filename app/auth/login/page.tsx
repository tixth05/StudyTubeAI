'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { signInWithPassword } from '@/lib/auth/helpers';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithPassword(emailOrPhone, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="auth-card animate-scaleIn">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#6C63FF] to-[#8B8BFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                    <p className="text-gray-600">Sign in to continue to StudyTube AI</p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Login form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-2">
                            Email or Phone
                        </label>
                        <input
                            type="text"
                            id="emailOrPhone"
                            value={emailOrPhone}
                            onChange={(e) => setEmailOrPhone(e.target.value)}
                            placeholder="Enter your email or phone"
                            required
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="w-full"
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <Link href="/auth/forgot-password" className="text-[#6C63FF] hover:text-[#5A52E0] font-medium">
                            Forgot password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={loading}
                        className="w-full"
                    >
                        Sign In
                    </Button>
                </form>

                {/* Sign up link */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="text-[#6C63FF] hover:text-[#5A52E0] font-semibold">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
