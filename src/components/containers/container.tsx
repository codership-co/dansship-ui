import { cn } from 'polpo/helpers';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return <section className={cn('bg-white px-8 py-8 rounded-xl shadow-lg', className)}>{children}</section>;
}
