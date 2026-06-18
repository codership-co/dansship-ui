import { Fluids1, Fluids2 } from '@components/svg';
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
        contain: 'paint',
      }}
    >
      <img
        src={img}
        alt='Dancing'
        className={cn(
          'm-4 max-w-100 min-w-70 absolute w-3/4 bottom-0 ',
          flipped
            ? 'left-0 drop-shadow-[1px_1px_white,2px_2px_white]'
            : 'right-0 drop-shadow-[-1px_1px_white,-2px_2px_white]',
        )}
      />

      <Fluids1
        className={cn('absolute min-w-100 w-full max-w-120 top-0', flipped ? 'right-0 rotate-y-180' : 'left-0')}
      />
      <Fluids2
        className={cn('absolute min-w-120 w-full max-w-160 bottom-0', flipped ? 'left-0 rotate-y-180' : 'right-0')}
      />
    </section>
  );
};
