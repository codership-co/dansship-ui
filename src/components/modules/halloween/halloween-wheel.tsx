import { useTranslation } from 'react-i18next';

import { HALLOWEEN_SPIN_DURATION_MS, wedgeSpan, type WheelWedge } from './pick-winning-slice';

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

function wedgePath(centerAngle: number, span: number) {
  const start = centerAngle - span / 2;
  const end = centerAngle + span / 2;
  const startPoint = point(start, RADIUS);
  const endPoint = point(end, RADIUS);
  const largeArc = span > 180 ? 1 : 0;

  return `M ${CENTER} ${CENTER} L ${startPoint.x} ${startPoint.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y} Z`;
}

function centerAngle(wedges: ReadonlyArray<WheelWedge>, index: number) {
  let cursor = -wedgeSpan(wedges, 0) / 2;

  for (let current = 0; current < index; current += 1) {
    cursor += wedgeSpan(wedges, current);
  }

  return cursor + wedgeSpan(wedges, index) / 2;
}

function uprightRotation(center: number) {
  const normalized = ((center % 360) + 360) % 360;

  return normalized > 90 && normalized < 270 ? center + 180 : center;
}

interface SliceLine {
  text: string;
  size: number;
}

function sliceLines(
  t: (key: string, options?: Record<string, unknown>) => string,
  wedge: WheelWedge,
): Array<SliceLine> {
  if (wedge.percent !== null) {
    return [
      { text: t('halloween:prizes.sliceValue', { percent: wedge.percent }), size: 4.6 },
      { text: t('halloween:prizes.sliceDiscount'), size: 2.3 },
    ];
  }

  return [
    { text: t('halloween:prizes.sliceFreeClass'), size: 3.2 },
    { text: t('halloween:prizes.sliceFreeClassCaption'), size: 2.3 },
  ];
}

interface HalloweenWheelProps {
  wedges: ReadonlyArray<WheelWedge>;
  rotation: number;
  onSpinEnd: () => void;
}

export function HalloweenWheel({ wedges, rotation, onSpinEnd }: HalloweenWheelProps) {
  const { t } = useTranslation();

  return (
    <div className='relative size-full'>
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
          {wedges.map((wedge, index) => {
            const style = SLICE_STYLES[index % SLICE_STYLES.length];
            const center = centerAngle(wedges, index);
            const span = wedgeSpan(wedges, index);
            const path = wedgePath(center, span);
            const lines = sliceLines(t, wedge);
            const textRotation = uprightRotation(center);

            return (
              <g key={`${wedge.code}-${index}`}>
                <path d={path} className={`${style.fill} stroke-background`} strokeWidth='0.8' />
                <clipPath id={`halloween-wedge-${index}`}>
                  <path d={path} />
                </clipPath>
                <g clipPath={`url(#halloween-wedge-${index})`}>
                  {lines.map((line, lineIndex) => {
                    const labelPoint = point(center, RADIUS * 0.74 - lineIndex * 5.4);

                    return (
                      <text
                        key={line.text}
                        x={labelPoint.x}
                        y={labelPoint.y}
                        textAnchor='middle'
                        dominantBaseline='middle'
                        transform={`rotate(${textRotation} ${labelPoint.x} ${labelPoint.y})`}
                        fontSize={line.size}
                        fontWeight='700'
                        className={style.text}
                        style={{ fontFamily: 'var(--font-title)' }}
                      >
                        {line.text}
                      </text>
                    );
                  })}
                </g>
              </g>
            );
          })}

          <circle cx={CENTER} cy={CENTER} r='6.5' className='fill-background stroke-primary' strokeWidth='1.2' />
        </svg>
      </div>
    </div>
  );
}
