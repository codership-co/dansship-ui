import { Spinner } from './spinner';

import { cn } from '@helpers';

interface SpinnerLoaderProps {
  message?: string;
  className?: string;
}

export const SpinnerLoader = ({ message, className }: SpinnerLoaderProps) => {
  return (
    <section className={cn('grid place-content-center gap-4 w-full h-full', className)}>
      <Spinner />
      {message && <p>{message}</p>}
    </section>
  );
};
