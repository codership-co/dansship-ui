import { Isotype, Logotype } from '@components/svg';

export const RootLoader = () => {
  return (
    <section className='h-dvh relative select-none grid gap-12 place-content-center justify-items-center bg-gradient-primary overflow-hidden'>
      <div className='absolute -top-30 -left-50 h-96 w-96 rounded-full bg-primary-300 blur-3xl filter animate-pulse' />
      <div className='absolute left-1/2 top-1/2 transform-[translate(-50%,-50%)] h-100 w-100 rounded-full bg-tertiary-300 blur-3xl filter animate-pulse [animation-delay:80ms]' />
      <div className='absolute -bottom-1/10 -right-1/10 h-85 w-85 rounded-full bg-secondary opacity-50 blur-3xl filter animate-pulse [animation-delay:110ms]' />

      <div className='animate-fade-in-down duration-200 relative size-70 p-4'>
        <div className='absolute t-0 l-0 size-full rounded-full inset-0 border-2 border-secondary border-t-transparent animate-spin backdrop-blur-xl -z-1'></div>
        <section className='size-full rounded-full grid place-content-center place-items-center bg-primary shadow-lg'>
          <Isotype mainColor='var(--color-primary-foreground)' className='w-2/3' />
        </section>
      </div>
      <Logotype className='h-12 animate-fade-in-down duration-200 opacity-0 [animation-delay:100ms]' />
    </section>
  );
};
