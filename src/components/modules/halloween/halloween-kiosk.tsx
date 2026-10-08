import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HalloweenWheel } from './halloween-wheel';
import {
  HALLOWEEN_REST_INDEX,
  HALLOWEEN_SPIN_DURATION_MS,
  HALLOWEEN_SPIN_TURNS,
  pickWinningSlice,
  rotationForSlice,
} from './pick-winning-slice';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';

const SPIN_FALLBACK_MS = HALLOWEEN_SPIN_DURATION_MS + 100;

type WheelPhase = 'idle' | 'spinning' | 'result';

export function HalloweenKiosk() {
  const { t } = useTranslation();
  const [rotation, setRotation] = useState(() => rotationForSlice(HALLOWEEN_REST_INDEX, 0, 0));
  const [phase, setPhase] = useState<WheelPhase>('idle');

  function spin() {
    if (phase !== 'idle') {
      return;
    }

    const index = pickWinningSlice();

    setPhase('spinning');
    setRotation(current => rotationForSlice(index, current, HALLOWEEN_SPIN_TURNS));
  }

  function finishSpin() {
    setPhase(current => (current === 'spinning' ? 'result' : current));
  }

  useEffect(() => {
    if (phase !== 'spinning') {
      return;
    }

    const timer = window.setTimeout(() => {
      setPhase(current => (current === 'spinning' ? 'result' : current));
    }, SPIN_FALLBACK_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

  function reset() {
    setPhase('idle');
  }

  return (
    <main className='relative min-h-dvh overflow-hidden bg-background text-foreground'>
      <HalloweenDecor />

      <div className='relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-10'>
        <header className='text-center'>
          <p className='m-0 font-brand text-3xl text-highlight'>{t('halloween:kicker')}</p>
          <h1 className='m-0 mt-2 font-title text-header2 text-primary'>{t('halloween:title')}</h1>
          <p className='m-0 mt-2 text-muted-foreground'>{t('halloween:subtitle')}</p>
        </header>

        <HalloweenWheel rotation={rotation} onSpinEnd={finishSpin} />

        <Button color='highlight' size='large' type='button' disabled={phase !== 'idle'} onClick={spin}>
          {t('halloween:spin')}
        </Button>

        <Dialog
          open={phase === 'result'}
          onOpenChange={open => {
            if (!open) reset();
          }}
        >
          <DialogContent
            showCloseButton={false}
            className='max-w-md border-border bg-card text-center sm:max-w-md'
            onOpenAutoFocus={event => event.preventDefault()}
          >
            <DialogHeader className='items-center text-center sm:text-center'>
              <p className='m-0 text-sm font-semibold tracking-wide text-highlight uppercase'>
                {t('halloween:resultKicker')}
              </p>
              <DialogTitle className='font-title text-header4 text-primary'>{t('halloween:resultTitle')}</DialogTitle>
              <DialogDescription>{t('halloween:resultBody')}</DialogDescription>
            </DialogHeader>
            <Button color='primary' size='large' type='button' onClick={reset}>
              {t('halloween:next')}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}

function HalloweenDecor() {
  return (
    <div className='pointer-events-none absolute inset-0' aria-hidden>
      <Cobweb className='absolute top-0 left-0 size-36 text-primary/25 sm:size-48' />
      <Cobweb className='absolute top-0 right-0 size-36 -scale-x-100 text-primary/25 sm:size-48' />
      <Cobweb className='absolute bottom-0 left-0 size-28 scale-y-[-1] text-primary/20 sm:size-40' />
      <Cobweb className='absolute right-0 bottom-0 size-28 -scale-x-100 scale-y-[-1] text-primary/20 sm:size-40' />

      <Bat className='absolute top-16 left-[8%] w-14 -rotate-12 text-foreground/80 sm:w-20' />
      <Bat className='absolute top-24 right-[12%] w-10 rotate-6 text-foreground/70 sm:w-14' />
      <Bat className='absolute bottom-20 left-[14%] w-12 rotate-12 text-foreground/60' />

      <Pumpkin className='absolute right-[7%] bottom-10 w-16 text-highlight sm:w-24' />
    </div>
  );
}

function Cobweb({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 120 120' className={className} fill='none'>
      <path d='M0 0 L120 40 M0 0 L90 120 M0 0 L40 120 M0 0 L120 90' className='stroke-current' strokeWidth='1' />
      <path
        d='M18 6 Q40 18 28 36 Q48 28 70 22 M14 28 Q36 40 30 62 M10 52 Q28 58 24 84'
        className='stroke-current'
        strokeWidth='1'
      />
    </svg>
  );
}

function Bat({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 80 36' className={className}>
      <path
        d='M40 20 C34 8 22 6 8 14 C18 16 24 22 28 28 C30 18 36 16 40 20 C44 16 50 18 52 28 C56 22 62 16 72 14 C58 6 46 8 40 20 Z'
        className='fill-current'
      />
    </svg>
  );
}

function Pumpkin({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 80 80' className={className}>
      <path d='M40 16 Q46 8 42 4' className='fill-none stroke-active' strokeWidth='3' strokeLinecap='round' />
      <ellipse cx='40' cy='46' rx='16' ry='22' className='fill-current' />
      <ellipse cx='26' cy='48' rx='12' ry='18' className='fill-current opacity-80' />
      <ellipse cx='54' cy='48' rx='12' ry='18' className='fill-current opacity-80' />
      <path
        d='M30 42 h6 M44 42 h6 M32 54 q8 6 16 0'
        className='fill-none stroke-foreground'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  );
}
