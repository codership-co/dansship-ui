import { Logotype } from '@components/svg';

export const RootLoader = () => {
  return (
    <section className='h-dvh relative select-none grid gap-8 place-content-center justify-items-center bg-gradient-primary overflow-hidden'>
      <div className='absolute -top-30 -left-50 h-96 w-96 rounded-full bg-primary-300 blur-3xl filter animate-pulse' />
      <div className='absolute left-1/2 top-1/2 transform-[translate(-50%,-50%)] h-100 w-100 rounded-full bg-tertiary-300 blur-3xl filter animate-pulse [animation-delay:80ms]' />
      <div className='absolute -bottom-1/10 -right-1/10 h-85 w-85 rounded-full bg-secondary opacity-50 blur-3xl filter animate-pulse [animation-delay:110ms]' />

      <div className='animate-fade-in-down duration-200 relative w-80 h-80 p-4'>
        <div className='absolute t-0 l-0 w-80 h-80 rounded-full inset-0 border-2 border-secondary border-t-transparent animate-spin backdrop-blur-xl -z-1'></div>
        <img
          className='block w-full h-full rounded-full object-cover shadow-lg'
          src='/assets/images/logo.png'
          alt='Logo'
        />
      </div>
      <Logotype className='h-16 animate-fade-in-down duration-200 opacity-0 [animation-delay:100ms]' />
    </section>
  );
};
