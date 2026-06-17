import { useMemo } from 'react';

type Particle = {
  size: number;
  distance: number;
  position: number;
  duration: number;
  delay: number;
};

const random = (min: number, max: number) => min + Math.random() * (max - min);

const PARTICLE_MAX_SIZE = 8;

interface GroovyLayoutProps {
  children: React.ReactNode;
  particles?: number;
  minDistance?: number;
  maxDistance?: number;
  background?: React.CSSProperties['background'];
  marginTop?: React.CSSProperties['marginTop'];
}

export function GroovyLayout({
  children,
  particles: particlesCount = 200,
  minDistance = 10,
  maxDistance = 25,
  marginTop,
  background = 'var(--color-primary)',
}: GroovyLayoutProps) {
  const particles = useMemo<Array<Particle>>(() => {
    return Array.from({ length: particlesCount }, () => ({
      size: random(3, PARTICLE_MAX_SIZE),
      distance: random(minDistance, maxDistance),
      position: random(-5, 105),
      duration: random(3, 6),
      delay: random(-10, 0),
    }));
  }, [maxDistance, minDistance, particlesCount]);

  return (
    <section className='overflow-x-hidden'>
      <section
        className='relative w-full'
        style={{
          marginTop: marginTop ?? `calc(${maxDistance}vh - ${PARTICLE_MAX_SIZE}rem)`,
          background,
        }}
      >
        <div
          className='pointer-events-none relative w-full z-0 overflow-visible'
          style={{
            height: `${PARTICLE_MAX_SIZE}rem`,
            background,
            filter: 'url(#gooey-footer)',
          }}
        >
          {particles.map((particle, index) => (
            <span
              key={index}
              style={
                {
                  '--dim': `${particle.size}rem`,
                  '--uplift': `${particle.distance}vh`,
                  '--pos-x': `${particle.position}%`,
                  '--dur': `${particle.duration}s`,
                  '--delay': `${particle.delay}s`,

                  position: 'absolute',
                  background,
                  borderRadius: '50%',
                  top: '50%',
                  left: 'var(--pos-x, 50%)',
                  width: 'var(--dim, 5rem)',
                  height: 'var(--dim, 5rem)',
                  transform: 'translate(-50%, -50%)',
                  animation: 'float-up var(--dur, 4s) ease-in infinite',
                  animationDelay: 'var(--delay, 0s)',
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className='relative z-10'>{children}</div>

        <svg className='h-0 w-0 overflow-hidden' xmlns='http://www.w3.org/2000/svg'>
          <defs>
            <filter id='gooey-footer'>
              <feGaussianBlur in='SourceGraphic' stdDeviation='12' result='blur' />

              <feColorMatrix
                in='blur'
                mode='matrix'
                values='
                  1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 19 -9
                '
                result='goo'
              />
            </filter>
          </defs>
        </svg>
      </section>
    </section>
  );
}
