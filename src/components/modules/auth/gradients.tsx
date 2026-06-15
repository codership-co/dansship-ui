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
      }}
    >
      <svg
        viewBox='0 0 150 150'
        className={cn(
          'absolute top-0 size-140 drop-shadow-[0_0_0.5rem]',
          flipped ? 'right-0 -translate-y-1/3 translate-x-1/3' : 'left-0 -translate-1/4',
        )}
      >
        <path
          fill='var(--color-tertiary)'
          d='M43.1,-43.3C58,-39,73.5,-27.3,70.7,-16.4C67.8,-5.5,46.7,4.6,35.8,17.9C24.8,31.3,24.1,47.8,17.3,52.3C10.5,56.7,-2.3,49.2,-18.3,45.5C-34.2,41.7,-53.2,41.7,-62.9,32.6C-72.5,23.5,-72.8,5.3,-69.3,-11.8C-65.9,-29,-58.6,-45.1,-46.4,-50C-34.3,-54.8,-17.1,-48.3,-1.5,-46.5C14.2,-44.7,28.3,-47.7,43.1,-43.3Z'
          transform='translate(75 75)'
        />
      </svg>
      <svg
        viewBox='0 0 150 150'
        className={cn(
          'absolute top-0 size-90 drop-shadow-[0_0_0.5rem] ',
          flipped ? 'right-0 -translate-y-1/3 translate-x-1/5' : 'left-0 -translate-1/4',
        )}
      >
        <path
          fill='var(--color-secondary)'
          d='M47.2,-51.9C59.9,-45.6,68,-29.5,67.2,-14.7C66.3,0,56.5,13.5,48.8,29.3C41,45.2,35.4,63.4,23.9,69.1C12.4,74.8,-4.9,67.9,-15.7,57.7C-26.5,47.5,-30.8,33.9,-41.8,21.1C-52.8,8.3,-70.6,-3.6,-71.6,-15.1C-72.5,-26.6,-56.7,-37.7,-42,-43.7C-27.3,-49.6,-13.6,-50.5,1.8,-52.6C17.3,-54.8,34.5,-58.2,47.2,-51.9Z'
          transform='translate(75 75)'
        />
      </svg>
      <svg
        viewBox='0 0 180 180'
        className={cn(
          'absolute top-0 size-60 drop-shadow-[0_0_0.5rem]',
          flipped ? 'right-0 -translate-y-1/3 translate-x-1/8' : 'left-0 -translate-1/3',
        )}
      >
        <path
          fill='var(--color-primary)'
          d='M49.4,-47C65.6,-45.3,81.3,-31.2,83.5,-15.3C85.6,0.7,74.2,18.5,61.8,31.7C49.4,44.9,36,53.6,23,54.7C9.9,55.8,-2.9,49.4,-16.9,44.9C-30.9,40.4,-46.1,37.9,-53.6,29C-61.1,20,-61,4.7,-58.1,-10C-55.3,-24.7,-49.8,-38.7,-39.6,-41.5C-29.5,-44.2,-14.7,-35.7,0.9,-36.8C16.6,-37.9,33.2,-48.6,49.4,-47Z'
          transform='translate(90 90)'
        />
      </svg>

      <svg
        viewBox='0 0 150 150'
        className={cn(
          'absolute bottom-0 size-120 drop-shadow-[0_0_0.5rem]',
          flipped ? 'left-0 translate-y-1/3 -translate-x-1/3' : 'right-0 translate-1/4',
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
