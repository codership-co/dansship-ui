import { useMemo } from 'react';

import { cn } from '@helpers';

type Particle = {
  size: number;
  distance: number;
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
  marginTop?: number;
  background?: React.CSSProperties['background'];
  className?: string;
}

export function GroovyLayout({
  children,
  particles: particlesCount = 12,
  minDistance = 10,
  maxDistance = 15,
  className,
  marginTop = 0.8,
  background = 'var(--color-primary)',
}: GroovyLayoutProps) {
  const isSafari = useMemo(isSafariBrowser, []);
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const resolvedCount = prefersReducedMotion ? 0 : particlesCount;
  const particles = useMemo<Array<Particle>>(() => {
    return Array.from({ length: resolvedCount }, () => ({
      size: random(5, PARTICLE_MAX_SIZE),
      distance: random(minDistance, maxDistance),
      duration: random(5, 8),
      delay: random(-10, 0),
    }));
  }, [maxDistance, minDistance, resolvedCount]);

  return (
    <section
      className={cn('relative w-full', className)}
      style={{
        background,
        marginTop: isSafari ? 0 : `${(PARTICLE_MAX_SIZE * -0.5 + maxDistance) * marginTop}rem`,
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
          'pointer-events-none absolute w-full z-0 left-0 bottom-full flex overflow-hidden',
          isSafari && 'hidden',
        )}
        style={{
          transform: `translateY(${PARTICLE_MAX_SIZE}rem)`,
          height: `${PARTICLE_MAX_SIZE * 0.5 + maxDistance}rem`,
        }}
      >
        <div
          className='w-full mt-auto relative'
          style={{
            height: `${PARTICLE_MAX_SIZE}rem`,
            filter: 'url(#gooey-footer)',
            background,
          }}
        >
          {particles.map((particle, index) => (
            <span
              key={index}
              style={
                {
                  '--uplift': `-${particle.distance}rem`,
                  position: 'absolute',
                  background,
                  borderRadius: '50%',
                  top: 0,
                  left: `${(110 / particles.length) * index - 5}%`,
                  width: `${particle.size}rem`,
                  height: `${particle.size}rem`,
                  transform: 'translate(-50%)',
                  animation: `float-up ${particle.duration}s ease-in infinite`,
                  animationDelay: `${particle.delay}s`,
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
