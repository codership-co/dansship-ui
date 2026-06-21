import { useState } from 'react';

import { Fluids1, Fluids2 } from '@components/svg';
import { cn } from '@helpers';

interface GradientsProps {
  className?: string;
  styles?: React.CSSProperties;
  flipped?: boolean;
}

export const Gradients = ({ className, flipped, styles }: GradientsProps) => {
  const [lengthLogo, setLengthLogo] = useState(0);
  const [lengthLine, setLengthLine] = useState(0);

  return (
    <section
      className={cn('pointer-events-none select-none relative bg-primary overflow-hidden', className)}
      style={{
        ...styles,
        viewTransitionName: 'gradients',
      }}
    >
      <svg
        height='100%'
        className={cn('absolute bottom-0 left-1/2 h-full -translate-x-1/2', flipped ? 'rotate-y-180' : '')}
        viewBox='0 0 642 850'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M65.9946 849.5C-95.5054 642.5 81.4946 529.5 170.995 537C260.495 544.5 405.995 546 485.495 507M485.495 507C564.995 468 664.995 329 636.495 236.5C607.995 144 522.995 153.5 490.995 115C458.995 76.5001 449.495 42.5001 457.495 0.500122M485.495 507C574.495 463.34 468.495 286.5 403.995 286.5C369.495 286.5 349.901 312 360.495 337C371.088 362 415.236 376.5 438.995 350.5C462.753 324.5 485.995 274.5 366.995 189.5C247.995 104.5 413.995 70.0001 385.495 0.500122'
          stroke='var(--color-highlight-500)'
          strokeWidth='1'
          strokeOpacity='15%'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeDasharray={lengthLine / 6}
          strokeDashoffset={lengthLine}
          style={{
            animation: 'dash 15s linear forwards infinite',
          }}
          ref={el => {
            if (el) {
              setLengthLine(el.getTotalLength());
            }
          }}
        />
      </svg>

      <svg
        height='10%'
        className='absolute top-1/2 left-1/2 -translate-1/2 max-h-40'
        viewBox='0 0 552 251'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M517.979 190.264C513.223 216.075 450.506 245.671 392.304 235.081C340.228 225.578 332.328 191.11 220.921 100.752C145.871 39.8685 110.563 23.9632 84.4845 35.1976C82.2676 36.164 62.6788 44.9018 61.3083 59.8005C56.6731 110.375 276.867 142.468 267.959 190.264C261.994 222.316 219.873 249.376 142.284 235.081C80.5748 223.686 28.9827 184.546 26 120.684L102.945 134.857C150.708 216.277 245.186 224.491 251.756 188.935C261.994 133.73 30.474 137.596 44.9037 59.4784C49.7807 33.0635 110.281 7.21229 166.468 15.5475C287.83 33.6272 308.628 199.365 428.7 209.834C462.8 212.814 499.237 202.747 501.736 188.935C508.185 153.662 285.613 109.651 294.883 59.4784C300.929 26.7819 346.516 2.62189 416.447 15.5475C477.834 26.8624 515.883 71.6389 526 125.435L448.733 111.181C371.748 2.98429 316.73 30.285 311.288 59.8407C299.841 121.811 532.731 110.255 517.939 190.305L517.979 190.264Z'
          fill='var(--color-highlight-300)'
          fillOpacity='5%'
          stroke='var(--color-highlight-600)'
          strokeWidth='4'
          strokeOpacity='20%'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeDasharray={lengthLogo / 2}
          strokeDashoffset={lengthLogo}
          style={{
            animation: 'dash 30s linear forwards infinite',
          }}
          ref={el => {
            if (el) {
              setLengthLogo(el.getTotalLength());
            }
          }}
        />
      </svg>

      <Fluids1
        className={cn('absolute min-w-100 w-full max-w-[30vw] top-0', flipped ? 'right-0 rotate-y-180' : 'left-0')}
      />
      <Fluids2
        className={cn('absolute min-w-120 w-full max-w-[35vw] bottom-0', flipped ? 'left-0 rotate-y-180' : 'right-0')}
      />
    </section>
  );
};
