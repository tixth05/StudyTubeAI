'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { signUpWithEmail, signUpWithPhone, verifyOTP } from '@/lib/auth/helpers';
import Link from 'next/link';

type SignupStep = 'method' | 'profile' | 'credentials' | 'otp' | 'password';
type SignupMethod = 'email' | 'phone';

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<SignupStep>('method');
    const [method, setMethod] = useState<SignupMethod>('email');

    // Profile information
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('');
    const [occupation, setOccupation] = useState('');

    // Auth information
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleMethodSelect = (selectedMethod: SignupMethod) => {
        setMethod(selectedMethod);
        setStep('profile');
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter your first and last name');
            return;
        }

        if (!gender) {
            setError('Please select your gender');
            return;
        }

        if (!occupation) {
            setError('Please select your occupation');
            return;
        }

        setStep('credentials');
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (method === 'email') {
                await signUpWithEmail(emailOrPhone);
            } else {
                await signUpWithPhone(emailOrPhone);
            }
            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await verifyOTP(emailOrPhone, otp, method === 'email' ? 'email' : 'sms');
            setStep('password');
        } catch (err: any) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            // Import the new helper functions
            const { updatePassword, saveUserProfile } = await import('@/lib/auth/helpers');

            // Set password
            await updatePassword(password);

            // Save profile data
            await saveUserProfile({
                firstName,
                lastName,
                gender,
                occupation
            });

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to complete signup');
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
                    <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                    <p className="text-gray-600">Get started with StudyTube AI</p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Step 1: Method Selection */}
                {step === 'method' && (
                    <div className="space-y-4">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => handleMethodSelect('email')}
                            className="w-full"
                        >
                            Sign up with Email
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => handleMethodSelect('phone')}
                            className="w-full"
                        >
                            Sign up with Phone
                        </Button>
                    </div>
                )}

                {/* Step 2: Profile Information */}
                {step === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    required
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    required
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                                Gender
                            </label>
                            <select
                                id="gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#6C63FF] focus:outline-none transition-colors"
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-2">
                                Occupation
                            </label>
                            <select
                                id="occupation"
                                value={occupation}
                                onChange={(e) => setOccupation(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#6C63FF] focus:outline-none transition-colors"
                            >
                                <option value="">Select occupation</option>
                                <option value="student">Student</option>
                                <option value="working">Working Professional</option>
                            </select>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                        >
                            Continue
                        </Button>

                        <button
                            type="button"
                            onClick={() => setStep('method')}
                            className="w-full text-sm text-gray-600 hover:text-[#6C63FF]"
                        >
                            ← Back to method selection
                        </button>
                    </form>
                )}

                {/* Step 3: Enter Email/Phone */}
                {step === 'credentials' && (
                    <form onSubmit={handleSendOTP} className="space-y-5">
                        <div>
                            <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-2">
                                {method === 'email' ? 'Email Address' : 'Phone Number'}
                            </label>
                            <input
                                type={method === 'email' ? 'email' : 'tel'}
                                id="emailOrPhone"
                                value={emailOrPhone}
                                onChange={(e) => setEmailOrPhone(e.target.value)}
                                placeholder={method === 'email' ? 'Enter your email' : 'Enter your phone number'}
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
                            Send Verification Code
                        </Button>

                        <button
                            type="button"
                            onClick={() => setStep('profile')}
                            className="w-full text-sm text-gray-600 hover:text-[#6C63FF]"
                        >
                            ← Back to profile
                        </button>
                    </form>
                )}

                {/* Step 4: Verify OTP */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOTP} className="space-y-5">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 8-digit code"
                                required
                                maxLength={8}
                                className="w-full text-center text-2xl tracking-widest"
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                Code sent to {emailOrPhone}
                            </p>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={loading}
                            className="w-full"
                        >
                            Verify Code
                        </Button>
                    </form>
                )}

                {/* Step 5: Set Password */}
                {step === 'password' && (
                    <form onSubmit={handleSetPassword} className="space-y-5">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Create Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password (min 6 characters)"
                                required
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter password"
                                required
                                className="w-full"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                        >
                            Create Account
                        </Button>
                    </form>
                )}

                {/* Login link */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-[#6C63FF] hover:text-[#5A52E0] font-semibold">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
