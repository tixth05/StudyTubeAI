'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { resetPassword } from '@/lib/auth/helpers';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await resetPassword(email);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
                    <p className="text-gray-600">
                        {submitted ? 'Check your email' : 'Enter your email to reset password'}
                    </p>
                </div>

                {!submitted ? (
                    <>
                        {/* Error message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Reset form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                isLoading={loading}
                                className="w-full"
                            >
                                Send Reset Link
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-gray-600 mb-6">
                            We've sent a password reset link to <strong>{email}</strong>.
                            Please check your inbox and follow the instructions.
                        </p>
                    </div>
                )}

                {/* Back to login */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    <Link href="/auth/login" className="text-[#6C63FF] hover:text-[#5A52E0] font-semibold">
                        ← Back to login
                    </Link>
                </p>
            </div>
        </div>
    );
}
