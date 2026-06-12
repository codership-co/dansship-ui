import { Spinner } from './spinner';

interface SpinnerLoaderProps {
  message?: string;
}

export const SpinnerLoader = ({ message }: SpinnerLoaderProps) => {
  return (
    <section className='grid place-content-center gap-4 w-full h-full'>
      <Spinner />
      {message && <p>{message}</p>}
    </section>
  );
};
