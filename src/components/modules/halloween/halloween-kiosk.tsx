import { Button } from 'polpo/components';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { HalloweenWheel } from './halloween-wheel';
import {
  HALLOWEEN_SPIN_DURATION_MS,
  HALLOWEEN_SPIN_TURNS,
  pickWinningSlice,
  rotationForSlice,
  spreadSlices,
} from './pick-winning-slice';

import { Input } from '@components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import {
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  type HalloweenSpinResult,
  type UserResponse,
} from '@core/api';
import { useHalloweenWheel, usePromise } from '@hooks';

const SPIN_FALLBACK_MS = HALLOWEEN_SPIN_DURATION_MS + 100;

type WheelPhase = 'idle' | 'spinning' | 'result';

function prizeLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  labelKey: string,
  percent: number | null,
) {
  return t(labelKey, { percent: percent ?? '' });
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeZone: 'America/Bogota',
  }).format(new Date(value));
}

function errorMessage(t: (key: string) => string, error: unknown) {
  if (error instanceof DansshipAPIError) {
    switch (error.body.error_code) {
      case DANSSHIP_ERROR_CODE.HALLOWEEN_WHEEL_CLOSED:
        return t('halloween:errors.closed');
      case DANSSHIP_ERROR_CODE.HALLOWEEN_ALREADY_SPUN:
        return t('halloween:errors.alreadySpun');
      case DANSSHIP_ERROR_CODE.HALLOWEEN_STUDENT_NOT_FOUND:
        return t('halloween:errors.notFound');
      case DANSSHIP_ERROR_CODE.HALLOWEEN_WHEEL_MISCONFIGURED:
        return t('halloween:errors.misconfigured');
      default:
        return t('halloween:errors.network');
    }
  }

  return t('halloween:errors.network');
}

function FitSquare({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) {
      return;
    }

    const measure = () => {
      const bounds = frame.getBoundingClientRect();

      setSize(Math.max(0, Math.floor(Math.min(bounds.width, bounds.height))));
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);

    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className='flex min-h-0 w-full flex-1 items-center justify-center'>
      <div className='relative max-h-full max-w-full' style={size > 0 ? { width: size, height: size } : undefined}>
        {children}
      </div>
    </div>
  );
}

export function HalloweenKiosk() {
  const { t } = useTranslation();
  const { config, configError, isLoading } = useHalloweenWheel();
  const wedges = config
    ? spreadSlices(
        config.outcomes.map(outcome => ({
          code: outcome.code,
          weight: outcome.weight,
          labelKey: outcome.label_key,
          percent: outcome.percent,
        })),
      )
    : [];
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<WheelPhase>('idle');
  const [student, setStudent] = useState<UserResponse | null>(null);
  const [knownResult, setKnownResult] = useState<HalloweenSpinResult | null>(null);
  const [pendingResult, setPendingResult] = useState<HalloweenSpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpinningRequest, setIsSpinningRequest] = useState(false);
  const [searchGeneration, setSearchGeneration] = useState(0);

  const shownResult = phase === 'result' ? (pendingResult ?? knownResult) : knownResult;
  const windowOpen = config?.window_open === true;
  const canSpin = Boolean(student) && windowOpen && !knownResult && phase === 'idle' && !isSpinningRequest;

  function finishSpin() {
    setPhase(current => (current === 'spinning' ? 'result' : current));
  }

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyInset: body.style.inset,
      bodyWidth: body.style.width,
      htmlHeight: html.style.height,
      bodyHeight: body.style.height,
    };

    html.style.overflow = 'hidden';
    html.style.height = '100dvh';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.inset = '0';
    body.style.width = '100%';
    body.style.height = '100dvh';

    return () => {
      html.style.overflow = previous.htmlOverflow;
      html.style.height = previous.htmlHeight;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.inset = previous.bodyInset;
      body.style.width = previous.bodyWidth;
      body.style.height = previous.bodyHeight;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'spinning') {
      return;
    }

    const timer = window.setTimeout(() => {
      setPhase(current => (current === 'spinning' ? 'result' : current));
    }, SPIN_FALLBACK_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

  async function onSelect(next: UserResponse) {
    setStudent(next);
    setError(null);
    setKnownResult(null);
    setPendingResult(null);
    setPhase('idle');
    const status = await DansshipAPI.halloweenAdmin.status(next.id);

    if (!status.ok) {
      setError(errorMessage(t, status.error));

      return;
    }

    if (status.data.spun && status.data.result) {
      setKnownResult(status.data.result);
      setPhase('result');
    }
  }

  async function spin() {
    if (!student || !canSpin || wedges.length === 0) {
      return;
    }

    setError(null);
    setIsSpinningRequest(true);
    const response = await DansshipAPI.halloweenAdmin.spin(student.id);

    setIsSpinningRequest(false);

    if (!response.ok) {
      setError(errorMessage(t, response.error));

      return;
    }

    const index = pickWinningSlice(response.data.outcome, Math.random, wedges);

    setPendingResult(response.data);
    setPhase('spinning');
    setRotation(current => rotationForSlice(index, current, HALLOWEEN_SPIN_TURNS, wedges));
  }

  function reset() {
    setStudent(null);
    setKnownResult(null);
    setPendingResult(null);
    setPhase('idle');
    setError(null);
    setSearchGeneration(current => current + 1);
  }

  return (
    <main className='fixed top-0 left-0 h-dvh w-full overflow-hidden overscroll-none bg-background text-foreground'>
      <HalloweenDecor />

      <div className='relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]'>
        <header className='shrink-0 text-center'>
          <p className='m-0 font-brand text-2xl leading-none text-highlight'>{t('halloween:kicker')}</p>
          <h1 className='m-0 mt-1 font-title text-2xl leading-tight text-primary sm:text-3xl'>
            {t('halloween:title')}
          </h1>
          <p className='m-0 mt-1 text-sm text-muted-foreground'>{t('halloween:subtitle')}</p>
        </header>

        <StudentSearch key={searchGeneration} selected={student} onSelect={next => void onSelect(next)} />

        <FitSquare>
          {wedges.length > 0 ? <HalloweenWheel wedges={wedges} rotation={rotation} onSpinEnd={finishSpin} /> : null}
        </FitSquare>

        <div className='flex w-full max-w-md shrink-0 flex-col items-center gap-2'>
          {configError ? (
            <p role='alert' className='m-0 text-sm text-destructive'>
              {t('halloween:errors.misconfigured')}
            </p>
          ) : null}
          {config && !windowOpen ? (
            <p className='m-0 text-sm text-muted-foreground'>{t('halloween:windowClosed')}</p>
          ) : null}
          {error ? (
            <p role='alert' className='m-0 text-center text-sm text-destructive'>
              {error}
            </p>
          ) : null}

          <Button
            color='highlight'
            size='large'
            type='button'
            disabled={!canSpin || isLoading}
            onClick={() => void spin()}
          >
            {t('halloween:spin')}
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(shownResult && student && phase === 'result')}
        onOpenChange={open => {
          if (!open) {
            reset();
          }
        }}
      >
        <DialogContent className='border-border bg-card text-card-foreground sm:max-w-lg'>
          {shownResult && student ? (
            <>
              <DialogHeader className='items-center gap-3 sm:text-center'>
                <p className='m-0 text-5xl leading-none' aria-hidden>
                  {t('halloween:congratsEmoji')}
                </p>
                <DialogTitle className='text-3xl leading-tight'>{t('halloween:congrats')}</DialogTitle>
                <DialogDescription className='text-center text-xl'>
                  {prizeLabel(t, shownResult.label_key, shownResult.percent)}
                </DialogDescription>
                <p className='m-0 text-center text-lg text-muted-foreground'>
                  {t('halloween:expires', { date: formatExpiry(shownResult.expires_at) })}
                </p>
                <p className='m-0 text-center text-lg text-muted-foreground'>
                  {t('halloween:delivered', { name: student.full_name })}
                </p>
              </DialogHeader>
              <DialogFooter className='sm:justify-center'>
                <Button color='primary' size='large' type='button' onClick={reset}>
                  {t('halloween:next')}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function StudentSearch({
  selected,
  onSelect,
}: {
  selected: UserResponse | null;
  onSelect: (student: UserResponse) => void;
}) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(searchInput.trim()), 500);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { response, isLoading } = usePromise(
    () => DansshipAPI.usersAdmin.search({ search: debounced, limit: 8 }),
    debounced.length > 2,
    [debounced],
  );
  const users = response?.ok ? response.data.items : [];

  return (
    <div className='relative w-full max-w-md shrink-0' ref={dropdownRef}>
      <label className='mb-1 block text-sm font-medium' htmlFor='halloween-student-search'>
        {t('halloween:searchLabel')}
      </label>
      <Input
        id='halloween-student-search'
        className='py-3'
        value={searchInput}
        placeholder={t('halloween:searchPlaceholder')}
        onChange={event => {
          setSearchInput(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {selected ? <p className='mt-1 mb-0 text-sm text-foreground'>{selected.full_name}</p> : null}
      {open && debounced.length > 2 ? (
        <div className='absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-md border border-border bg-card shadow-sm'>
          {isLoading ? null : users.length === 0 ? (
            <p className='px-3 py-2 text-sm text-muted-foreground'>{t('halloween:noUsers')}</p>
          ) : (
            users.map(user => (
              <button
                key={user.id}
                type='button'
                className='block w-full px-3 py-2 text-left text-sm hover:bg-muted'
                onClick={() => {
                  onSelect(user);
                  setSearchInput(user.full_name);
                  setOpen(false);
                }}
              >
                {user.full_name}
                <span className='block text-muted-foreground'>{user.email}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
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
