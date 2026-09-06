import React from 'react';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

interface CTAButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'lg';
  className?: string;
}

export function CTAButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'default',
  className = ''
}: CTAButtonProps) {
  const baseClasses = "rounded-full transition-all duration-300 hover:shadow-lg";
  
  const variantClasses = {
    primary: "bg-[var(--river-blue)] hover:bg-[var(--river-blue)]/90 text-white",
    secondary: "bg-[var(--warm-brown)] hover:bg-[var(--warm-brown)]/90 text-white"
  };

  const sizeClasses = {
    default: "px-6 py-3",
    lg: "px-8 py-4"
  };

  return (
    <Button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
      <ArrowRight className="ml-2 inline-block" size={20} />
    </Button>
  );
}
