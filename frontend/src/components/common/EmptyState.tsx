import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card text-center py-12">
      {Icon && (
        <Icon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      )}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 text-sm mb-6">{description}</p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}

export default EmptyState;