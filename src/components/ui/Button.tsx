'use client';

import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { useSound } from '@/components/providers/SoundProvider';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'purple' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  noSound?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, noSound, children, disabled, onClick, ...props }, ref) => {
    const { playClick } = useSound();

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (!noSound && !disabled && !isLoading) {
        playClick();
      }
      onClick?.(e);
    };

    const baseStyles = `
      btn-retro
      inline-flex items-center justify-center
      font-bold uppercase tracking-wider
      transition-all
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6B6B]
      disabled:pointer-events-none disabled:opacity-50
      select-none
    `;

    const variants = {
      primary: 'bg-[#FF6B6B] text-white hover:bg-[#FF8A8A] border-3 border-[#1a1a1a]',
      secondary: 'bg-[#4ECDC4] text-[#1a1a1a] hover:bg-[#6EE7DF] border-3 border-[#1a1a1a]',
      accent: 'bg-[#FFE66D] text-[#1a1a1a] hover:bg-[#F5D93A] border-3 border-[#1a1a1a]',
      purple: 'bg-[#9B5DE5] text-white hover:bg-[#7B3DC5] border-3 border-[#1a1a1a]',
      outline: 'bg-white text-[#1a1a1a] hover:bg-[#FFF1E6] border-3 border-[#1a1a1a]',
      ghost: 'bg-transparent text-[#1a1a1a] hover:bg-[#FFF1E6] border-3 border-transparent hover:border-[#1a1a1a] shadow-none hover:shadow-[4px_4px_0_#1a1a1a]',
      destructive: 'bg-[#FF6B6B] text-white hover:bg-[#E55555] border-3 border-[#1a1a1a]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      xl: 'h-14 px-8 text-lg',
    };

    // Retro 3D shadow styling
    const shadowStyle = variant !== 'ghost' ? 'shadow-[4px_4px_0_#1a1a1a] hover:shadow-[6px_6px_0_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[0_0_0_#1a1a1a] active:translate-x-[4px] active:translate-y-[4px]' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${shadowStyle} ${className}`}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="animate-bounce-retro mr-2">*</span>
            Loading
            <span className="loading-dots"></span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Icon button variant for compact icons
export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'ghost', size = 'md', isLoading, noSound, children, disabled, onClick, ...props }, ref) => {
    const { playClick } = useSound();

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (!noSound && !disabled && !isLoading) {
        playClick();
      }
      onClick?.(e);
    };

    const sizes = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-14 w-14',
    };

    const variants = {
      primary: 'bg-[#FF6B6B] text-white hover:bg-[#FF8A8A]',
      secondary: 'bg-[#4ECDC4] text-[#1a1a1a] hover:bg-[#6EE7DF]',
      accent: 'bg-[#FFE66D] text-[#1a1a1a] hover:bg-[#F5D93A]',
      purple: 'bg-[#9B5DE5] text-white hover:bg-[#7B3DC5]',
      outline: 'bg-white text-[#1a1a1a] hover:bg-[#FFF1E6]',
      ghost: 'bg-transparent text-[#1a1a1a] hover:bg-[#FFF1E6]',
      destructive: 'bg-[#FF6B6B] text-white hover:bg-[#E55555]',
    };

    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center
          border-3 border-[#1a1a1a]
          shadow-[3px_3px_0_#1a1a1a]
          hover:shadow-[4px_4px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]
          active:shadow-[0_0_0_#1a1a1a] active:translate-x-[3px] active:translate-y-[3px]
          transition-all
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B6B]
          disabled:pointer-events-none disabled:opacity-50
          select-none
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
