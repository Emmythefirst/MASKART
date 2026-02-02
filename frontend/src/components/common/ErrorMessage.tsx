import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  retry?: () => void;
}

function ErrorMessage({ message, retry }: ErrorMessageProps) {
  return (
    <div className="card bg-red-500/10 border-red-500/20">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-400 mb-1">Error</h3>
          <p className="text-sm text-gray-300">{message}</p>
          {retry && (
            <button
              onClick={retry}
              className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Try again →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorMessage;