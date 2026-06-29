import { useMemo } from 'react';

import { cn } from '@helpers';

type Particle = {
  size: number;
  distance: number;
  position: number;
  duration: number;
  delay: number;
};

const random = (min: number, max: number) => min + Math.random() * (max - min);

const isSafariBrowser = () => {
  const ua = navigator.userAgent.toLowerCase();

  // 1. Must contain 'safari' and 'applewebkit'
  const hasSafariKeywords = ua.includes('safari') && ua.includes('applewebkit');

  // 2. Must NOT contain 'chrome', 'chromium', or 'edg' (which also use webkit strings)
  const isNotChromium = !ua.includes('chrome') && !ua.includes('chromium') && !ua.includes('edg');

  return hasSafariKeywords && isNotChromium;
};

const PARTICLE_MAX_SIZE = 8;

interface GroovyLayoutProps {
  children: React.ReactNode;
  particles?: number;
  minDistance?: number;
  maxDistance?: number;
  marginTop?: React.CSSProperties['marginTop'];
  background?: React.CSSProperties['background'];
  className?: string;
}

export function GroovyLayout({
  children,
  particles: particlesCount = 200,
  minDistance = 10,
  maxDistance = 25,
  className,
  marginTop = `${maxDistance * 0.75}vh`,
  background = 'var(--color-primary)',
}: GroovyLayoutProps) {
  const isSafari = useMemo(isSafariBrowser, []);
  const particles = useMemo<Array<Particle>>(() => {
    return Array.from({ length: particlesCount }, () => ({
      size: random(5, PARTICLE_MAX_SIZE),
      distance: random(minDistance, maxDistance),
      position: random(-5, 110),
      duration: random(3, 6),
      delay: random(-10, 0),
    }));
  }, [maxDistance, minDistance, particlesCount]);

  return (
    <section
      className={cn('relative w-full', className)}
      style={{
        background,
        marginTop: isSafari ? 0 : marginTop,
      }}
    >
      <svg className='h-px w-px pointer-events-none opacity-0 absolute' xmlns='http://www.w3.org/2000/svg'>
        <defs>
          <filter id='gooey-footer' colorInterpolationFilters='sRGB'>
            <feGaussianBlur in='SourceGraphic' stdDeviation='15' result='blur' />
            <feColorMatrix
              in='blur'
              mode='matrix'
              values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 25 -8'
              result='gooey-footer'
            />
            <feBlend in='SourceGraphic' in2='gooey-footer' />
          </filter>
        </defs>
      </svg>

      <section
        className={cn(
          'pointer-events-none absolute w-full z-0 left-0 bottom-1/2 flex bg-red overflow-hidden',
          isSafari && 'hidden',
        )}
        style={{
          height: `calc(${PARTICLE_MAX_SIZE * 0.4}rem + ${maxDistance}vh)`,
        }}
      >
        <div
          className='w-full mt-auto relative'
          style={{
            height: `${PARTICLE_MAX_SIZE * 1.1}rem`,
            filter: 'url(#gooey-footer)',
            background,
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
                  bottom: 0,
                  left: 'var(--pos-x, 50%)',
                  width: 'var(--dim, 5rem)',
                  height: 'var(--dim, 5rem)',
                  transform: 'translate(-50%)',
                  animation: 'float-up var(--dur, 4s) ease-in infinite',
                  animationDelay: 'var(--delay, 0s)',
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </section>

      <div className='relative z-10'>{children}</div>
    </section>
  );
}
