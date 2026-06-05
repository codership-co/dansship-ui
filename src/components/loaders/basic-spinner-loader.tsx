import { LuLoader } from 'react-icons/lu';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BasicSpinnerLoader({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return <LuLoader className={`animate-spin text-purple-600 ${sizeClasses[size]} ${className}`} />;
}
