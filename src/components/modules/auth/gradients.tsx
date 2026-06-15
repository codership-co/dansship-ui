import { Fluids } from '@components/svg';
import { cn } from '@helpers';

interface GradientsProps {
  className?: string;
  styles?: React.CSSProperties;
  flipped?: boolean;
  img: string;
}

export const Gradients = ({ className, flipped, img, styles }: GradientsProps) => {
  return (
    <section
      className={cn('pointer-events-none select-none relative bg-gradient-auth overflow-hidden', className)}
      style={{
        ...styles,
        viewTransitionName: 'gradients',
        contain: 'layout',
      }}
    >
      <Fluids
        className={cn(
          'absolute min-w-120 w-full max-w-220 drop-shadow-[0_0_1rem_#00000088]',
          flipped
            ? 'top-0 right-0 translate-x-1/3 -translate-y-1/3 rotate-45'
            : 'top-0 left-0 -translate-x-1/3 -translate-y-3/10 -rotate-45',
        )}
      />

      <svg
        viewBox='0 0 150 150'
        className={cn(
          'absolute bottom-0 min-w-90 w-full max-w-130 drop-shadow-[0_0_0.5rem]',
          flipped ? 'left-0 translate-y-1/3 -translate-x-1/4' : 'right-0 translate-1/4',
        )}
      >
        <path
          fill='var(--color-highlight)'
          d='M47.2,-51.9C59.9,-45.6,68,-29.5,67.2,-14.7C66.3,0,56.5,13.5,48.8,29.3C41,45.2,35.4,63.4,23.9,69.1C12.4,74.8,-4.9,67.9,-15.7,57.7C-26.5,47.5,-30.8,33.9,-41.8,21.1C-52.8,8.3,-70.6,-3.6,-71.6,-15.1C-72.5,-26.6,-56.7,-37.7,-42,-43.7C-27.3,-49.6,-13.6,-50.5,1.8,-52.6C17.3,-54.8,34.5,-58.2,47.2,-51.9Z'
          transform='translate(75 75)'
        />
      </svg>

      <img
        src={img}
        alt='Dancing'
        className={cn(
          'm-4 max-w-100 min-w-70 absolute w-3/4 bottom-0 ',
          flipped
            ? 'left-0 drop-shadow-[1px_1px_white,2px_2px_white]'
            : 'right-0 drop-shadow-[-1px_1px_white,-2px_2px_white]',
        )}
        style={{
          viewTransitionName: 'auth-image',
        }}
      />
    </section>
  );
};
