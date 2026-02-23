'use client';

import React, { useState } from 'react';
import { QuizQuestion } from '@/types';
import Button from '@/components/ui/Button';

interface InteractiveQuizProps {
    questions: QuizQuestion[];
}

export default function InteractiveQuiz({ questions }: InteractiveQuizProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    const handleAnswerSelect = (index: number) => {
        if (showFeedback) return; // Prevent changing answer after submission
        setSelectedAnswer(index);
    };

    const handleSubmitAnswer = () => {
        if (selectedAnswer === null) return;

        setShowFeedback(true);

        // Check if answer is correct
        if (selectedAnswer === questions[currentQuestion].correct_index) {
            setScore(score + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
        } else {
            setCompleted(true);
        }
    };

    const handleRestart = () => {
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setScore(0);
        setCompleted(false);
    };

    if (completed) {
        const percentage = Math.round((score / questions.length) * 100);
        const isPassing = percentage >= 70;

        return (
            <div className="text-center py-8 animate-fadeIn">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isPassing ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                    {isPassing ? (
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>

                <h3 className="text-3xl font-bold mb-2">Quiz Complete!</h3>
                <p className="text-xl text-gray-600 mb-6">
                    You scored <span className="font-bold gradient-text">{score}</span> out of {questions.length}
                </p>

                <div className="mb-8">
                    <div className="text-5xl font-bold gradient-text mb-2">{percentage}%</div>
                    <p className="text-gray-600">
                        {isPassing ? '🎉 Great job!' : '💪 Keep practicing!'}
                    </p>
                </div>

                <Button variant="primary" onClick={handleRestart}>
                    Retake Quiz
                </Button>
            </div>
        );
    }

    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct_index;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>Score: {score}/{currentQuestion + (showFeedback ? 1 : 0)}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div
                    className="bg-gradient-to-r from-[#6C63FF] to-[#8B8BFF] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            {/* Question */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{question.question}</h3>
            </div>

            {/* Options */}
            <div className="space-y-3">
                {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrectAnswer = index === question.correct_index;

                    let optionClass = 'w-full p-4 rounded-lg border-2 text-left transition-all cursor-pointer ';

                    if (!showFeedback) {
                        optionClass += isSelected
                            ? 'border-[#6C63FF] bg-[#F5F7FF]'
                            : 'border-gray-300 hover:border-[#6C63FF] hover:bg-[#F5F7FF]';
                    } else {
                        if (isCorrectAnswer) {
                            optionClass += 'border-green-500 bg-green-50';
                        } else if (isSelected && !isCorrect) {
                            optionClass += 'border-red-500 bg-red-50';
                        } else {
                            optionClass += 'border-gray-300 bg-gray-50 opacity-60';
                        }
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={showFeedback}
                            className={optionClass}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${showFeedback && isCorrectAnswer ? 'border-green-500 bg-green-500' :
                                        showFeedback && isSelected && !isCorrect ? 'border-red-500 bg-red-500' :
                                            isSelected ? 'border-[#6C63FF] bg-[#6C63FF]' : 'border-gray-400'
                                    }`}>
                                    {showFeedback && isCorrectAnswer && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    {showFeedback && isSelected && !isCorrect && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                    {!showFeedback && isSelected && (
                                        <div className="w-3 h-3 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <span className="font-medium">{option}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            {showFeedback && question.explanation && (
                <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className="font-medium mb-1">
                        {isCorrect ? '✅ Correct!' : '📚 Explanation:'}
                    </p>
                    <p className="text-gray-700">{question.explanation}</p>
                </div>
            )}

            {/* Action Button */}
            <div className="pt-4">
                {!showFeedback ? (
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSubmitAnswer}
                        disabled={selectedAnswer === null}
                        className="w-full"
                    >
                        Submit Answer
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleNextQuestion}
                        className="w-full"
                    >
                        {currentQuestion < questions.length - 1 ? 'Next Question →' : 'View Results'}
                    </Button>
                )}
            </div>
        </div>
    );
}
