import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-full transition-all duration-300 btn-hover relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center';

  const variants = {
    primary: 'bg-gradient-to-r from-[#6C63FF] to-[#8B8BFF] text-white hover:shadow-xl hover:scale-105 shadow-lg',
    secondary: 'bg-white text-[#6C63FF] border-2 border-[#6C63FF] hover:bg-[#6C63FF] hover:text-white shadow-md',
    outline: 'bg-transparent text-[#6C63FF] border-2 border-[#6C63FF] hover:bg-[#6C63FF] hover:text-white',
    ghost: 'bg-transparent text-[#6C63FF] hover:bg-[#F5F7FF]'
  };

  const sizes = {
    sm: 'px-5 py-2 text-sm',
    md: 'px-7 py-3 text-base',
    lg: 'px-10 py-4 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="spinner w-5 h-5 border-2"></span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
