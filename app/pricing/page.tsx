'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const pricingPlans = [
    {
        name: 'Starter Pack',
        videos: 10,
        price: 9.99,
        features: [
            '10 AI-generated videos',
            'Full quiz access',
            'HD video quality',
            'Valid for 30 days'
        ]
    },
    {
        name: 'Pro Pack',
        videos: 50,
        price: 39.99,
        popular: true,
        features: [
            '50 AI-generated videos',
            'Full quiz access',
            'HD video quality',
            'Valid for 60 days',
            'Priority processing'
        ]
    },
    {
        name: 'Premium Pack',
        videos: 100,
        price: 69.99,
        features: [
            '100 AI-generated videos',
            'Full quiz access',
            'HD video quality',
            'Valid for 90 days',
            'Priority processing',
            'Early access to new features'
        ]
    }
];

export default function PricingPage() {
    const router = useRouter();

    const handlePurchase = (plan: typeof pricingPlans[0]) => {
        // This is a dummy payment page - no real integration yet
        alert(`Payment integration coming soon!\n\nYou selected: ${plan.name}\nPrice: $${plan.price}\nVideos: ${plan.videos}`);
    };

    return (
        <div className="min-h-screen px-4 py-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold gradient-text mb-4">Choose Your Plan</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Get more credits to create unlimited study videos and ace your exams
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {pricingPlans.map((plan, index) => (
                        <Card
                            key={index}
                            glass
                            className={`relative ${plan.popular ? 'ring-4 ring-[#6C63FF] scale-105' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-[#6C63FF] to-[#8B8BFF] text-white px-4 py-1 rounded-full text-sm font-semibold">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <div className="mb-4">
                                    <span className="text-5xl font-bold gradient-text">${plan.price}</span>
                                </div>
                                <p className="text-gray-600 font-medium">{plan.videos} Videos</p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-[#6C63FF] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.popular ? 'primary' : 'outline'}
                                size="lg"
                                onClick={() => handlePurchase(plan)}
                                className="w-full"
                            >
                                Get {plan.name}
                            </Button>
                        </Card>
                    ))}
                </div>

                {/* FAQ or Additional Info */}
                <Card glass className="max-w-3xl mx-auto">
                    <h3 className="text-2xl font-bold mb-4 text-center">Why Buy More Credits?</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-[#6C63FF] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold mb-1">Unlimited Learning</h4>
                                <p className="text-sm text-gray-600">Create videos for all your subjects</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-[#6C63FF] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold mb-1">Save Time</h4>
                                <p className="text-sm text-gray-600">Study smarter, not harder</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-[#6C63FF] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold mb-1">Better Retention</h4>
                                <p className="text-sm text-gray-600">Visual learning improves memory</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-[#6C63FF] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold mb-1">Ace Your Exams</h4>
                                <p className="text-sm text-gray-600">Interactive quizzes test knowledge</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Back to Dashboard */}
                <div className="text-center mt-8">
                    <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                        ← Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
