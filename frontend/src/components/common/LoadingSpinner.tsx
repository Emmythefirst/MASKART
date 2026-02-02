interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
}

function LoadingSpinner({ size = 'md', fullScreen = false, message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`spinner ${sizeClasses[size]}`} />
      {message && (
        <p className="text-gray-400 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;