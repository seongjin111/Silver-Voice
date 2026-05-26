import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false,
  type = 'button'
}) => {
  const variants = {
    primary: 'bg-yellow-400 text-black border-4 border-black active:bg-yellow-500',
    secondary: 'bg-white text-black border-4 border-black active:bg-gray-100',
    accent: 'bg-blue-600 text-white border-4 border-black active:bg-blue-700',
    danger: 'bg-red-500 text-white border-4 border-black active:bg-red-600'
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`
        w-full py-6 px-4 rounded-3xl text-3xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
        transition-all active:translate-x-1 active:translate-y-1 active:shadow-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
