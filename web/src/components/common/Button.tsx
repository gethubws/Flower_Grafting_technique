import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'danger' | 'secondary';
  disabled?: boolean;
  className?: string;
}

const variants = {
  primary: 'bg-[#533483] hover:bg-[#6b44b8] text-white',
  danger: 'bg-red-700 hover:bg-red-600 text-white',
  secondary: 'bg-[#1a1a2e] hover:bg-[#0f3460] text-gray-300 border border-[#0f3460]',
};

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  className = '',
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${className}`}
  >
    {children}
  </button>
);
