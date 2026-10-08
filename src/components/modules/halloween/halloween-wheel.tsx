import { useTranslation } from 'react-i18next';

import { HALLOWEEN_SLICES, HALLOWEEN_SPIN_DURATION_MS } from './pick-winning-slice';

const SIZE = 100;
const CENTER = 50;
const RADIUS = 46;

const SLICE_STYLES = [
  { fill: 'fill-primary', text: 'fill-primary-foreground' },
  { fill: 'fill-highlight', text: 'fill-white' },
  { fill: 'fill-tertiary', text: 'fill-tertiary-foreground' },
  { fill: 'fill-accent', text: 'fill-accent-foreground' },
  { fill: 'fill-primary-700', text: 'fill-primary-foreground' },
  { fill: 'fill-secondary', text: 'fill-secondary-foreground' },
];

function point(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;

  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  };
}

function wedgePath(index: number, count: number) {
  const slice = 360 / count;
  const start = index * slice - slice / 2;
  const end = start + slice;
  const startPoint = point(start, RADIUS);
  const endPoint = point(end, RADIUS);

  return `M ${CENTER} ${CENTER} L ${startPoint.x} ${startPoint.y} A ${RADIUS} ${RADIUS} 0 0 1 ${endPoint.x} ${endPoint.y} Z`;
}

interface HalloweenWheelProps {
  rotation: number;
  onSpinEnd: () => void;
}

export function HalloweenWheel({ rotation, onSpinEnd }: HalloweenWheelProps) {
  const { t } = useTranslation();
  const count = HALLOWEEN_SLICES.length;

  return (
    <div className='relative size-[min(92vw,28rem)]'>
      <svg
        viewBox='0 0 36 42'
        className='pointer-events-none absolute top-0 left-1/2 z-10 w-9 -translate-x-1/2 -translate-y-1'
        aria-hidden
      >
        <path d='M18 42 L3 10 Q18 0 33 10 Z' className='fill-foreground' />
        <circle cx='18' cy='12' r='3' className='fill-highlight' />
      </svg>

      <div
        data-testid='halloween-wheel'
        className='size-full'
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: `transform ${HALLOWEEN_SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.6, 0.08, 1)`,
        }}
        onTransitionEnd={event => {
          if (event.target !== event.currentTarget) {
            return;
          }

          if (event.propertyName && event.propertyName !== 'transform') {
            return;
          }

          onSpinEnd();
        }}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role='img' aria-label={t('halloween:wheelLabel')} className='size-full'>
          {HALLOWEEN_SLICES.map((slice, index) => {
            const style = SLICE_STYLES[index];
            const centerAngle = index * (360 / count);
            const labelPoint = point(centerAngle, RADIUS * 0.64);
            const label = t(slice.labelKey);
            const lines = label.split(' ');

            return (
              <g key={`${slice.id}-${index}`}>
                <path d={wedgePath(index, count)} className={`${style.fill} stroke-background`} strokeWidth='0.8' />
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor='middle'
                  dominantBaseline='middle'
                  transform={`rotate(${centerAngle} ${labelPoint.x} ${labelPoint.y})`}
                  fontSize='4.6'
                  fontWeight='700'
                  className={style.text}
                  style={{ fontFamily: 'var(--font-title)' }}
                >
                  {lines.length === 1
                    ? label
                    : lines.map((line, lineIndex) => (
                        <tspan key={line} x={labelPoint.x} dy={lineIndex === 0 ? '-0.55em' : '1.15em'}>
                          {line}
                        </tspan>
                      ))}
                </text>
              </g>
            );
          })}

          <circle cx={CENTER} cy={CENTER} r='6.5' className='fill-background stroke-primary' strokeWidth='1.2' />
        </svg>
      </div>
    </div>
  );
}
