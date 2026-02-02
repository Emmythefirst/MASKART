import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled,
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost'
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'py-3 px-6',
    lg: 'py-4 px-8 text-lg'
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button 
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="spinner w-5 h-5" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;