import { Container } from '@components/containers';
import { cn } from '@helpers';

function Bone({ className }: { className?: string }) {
  return <div className={cn('rounded-md bg-secondary', className)} />;
}

function PurpleBone({ className }: { className?: string }) {
  return <div className={cn('rounded-md bg-primary/15', className)} />;
}

function ClassesDayTabSkeleton({ delayMs }: { delayMs: number }) {
  return (
    <section
      className='flex animate-pulse items-center justify-center rounded-2xl bg-white/45 px-2 py-4 text-center md:px-4 md:py-8'
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <section className='grid lg:mr-2 lg:border-r lg:border-r-solid lg:pr-2'>
        <Bone className='mx-auto h-[34px] w-3 xs:h-3.5 xs:w-[38px]' />
        <Bone className='mt-2 hidden h-[11px] w-[52px] sm:block' />
      </section>
      <section className='hidden content-center justify-items-center gap-1.5 lg:grid'>
        <PurpleBone className='h-5 w-[18px]' />
        <Bone className='h-2 w-9' />
      </section>
    </section>
  );
}

function ClassesCardSkeleton({ delayMs, titleClassName }: { delayMs: number; titleClassName: string }) {
  return (
    <section
      className='relative grid animate-pulse content-end gap-3 rounded-2xl bg-[hsl(285_26%_82%)] px-4 py-4 pt-20 xs:pt-30 sm:pt-40'
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className='absolute top-0 right-0 m-3 h-7 w-[78px] rounded-2xl bg-white/60 sm:m-4 sm:h-8 sm:w-[88px]' />
      <section className='grid gap-4 rounded-xl bg-white/50 px-4 py-4 backdrop-blur-md sm:px-8'>
        <PurpleBone className={cn('mx-auto h-[22px] sm:mx-0 sm:h-[26px]', titleClassName)} />
        <section className='flex flex-col-reverse items-center justify-between gap-8 pb-4 sm:flex-row'>
          <section className='grid w-full grid-cols-2 items-center gap-8 sm:grid-cols-none sm:grid-flow-col'>
            <section className='grid justify-items-center gap-1.5'>
              <Bone className='h-5 w-[66px] sm:h-[22px] sm:w-[78px]' />
              <Bone className='h-[11px] w-[42px] sm:h-3 sm:w-[46px]' />
            </section>
            <section className='grid justify-items-center gap-1.5'>
              <Bone className='h-5 w-[66px] sm:h-[22px] sm:w-[78px]' />
              <Bone className='h-[11px] w-[52px] sm:h-3 sm:w-[60px]' />
            </section>
            <section className='hidden justify-items-center gap-1.5 sm:grid'>
              <Bone className='h-[22px] w-[110px]' />
              <Bone className='h-3 w-9' />
            </section>
          </section>
          <section className='grid w-40 content-center justify-items-center gap-3 sm:gap-4'>
            <PurpleBone className='size-[72px] rounded-full border-2 border-primary/25 sm:size-20' />
            <PurpleBone className='h-[13px] w-[110px] sm:h-3.5 sm:w-[120px]' />
          </section>
        </section>
      </section>
      <div className='absolute top-full right-6 h-[38px] w-[150px] -translate-y-1/2 rounded-[10px] bg-primary/20 sm:right-8 sm:h-10 sm:w-[170px]' />
    </section>
  );
}

export function ClassesCalendarSkeleton() {
  return (
    <section className='grid gap-8' aria-hidden>
      <section className='grid grid-flow-col overflow-x-auto pb-4 xs:pb-8 sm:gap-4'>
        {Array.from({ length: 7 }).map((_, index) => (
          <ClassesDayTabSkeleton key={index} delayMs={index * 80} />
        ))}
      </section>

      <Container className='lg:hidden grid grid-flow-col items-center justify-between gap-8 bg-white/40 py-4'>
        <div className='grid gap-2'>
          <Bone className='h-4 w-24' />
          <Bone className='h-3 w-[72px]' />
        </div>
        <div className='grid justify-items-center gap-1.5'>
          <PurpleBone className='h-5 w-[18px]' />
          <Bone className='h-2 w-10' />
        </div>
      </Container>

      <section className='grid gap-12'>
        <ClassesCardSkeleton delayMs={0} titleClassName='w-4/5 sm:w-[280px]' />
        <ClassesCardSkeleton delayMs={150} titleClassName='w-[70%] sm:w-[240px]' />
      </section>
    </section>
  );
}
