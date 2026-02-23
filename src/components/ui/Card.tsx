import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glass?: boolean;
}

export default function Card({ children, className = '', hover = false, glass = false }: CardProps) {
    const baseStyles = 'rounded-2xl p-6';
    const hoverStyles = hover ? 'card-shadow cursor-pointer' : 'shadow-md';
    const glassStyles = glass ? 'glass' : 'bg-white';

    return (
        <div className={`${baseStyles} ${hoverStyles} ${glassStyles} ${className}`}>
            {children}
        </div>
    );
}
