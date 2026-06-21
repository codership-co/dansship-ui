interface ErrorLayoutProps {
  hero?: string;
  title: string;
  description: string;
  image: React.ReactNode;
  actions: React.ReactNode;
  footer: React.ReactNode;
}

export const ErrorLayout = ({ hero, image, title, description, actions, footer }: ErrorLayoutProps) => {
  return (
    <main className='flex items-center justify-center content-center px-6 py-20 min-h-dvh'>
      <section className='relative w-xl group'>
        <div className='bg-primary/40 absolute -z-10 left-[-25%] top-[-5%] h-96 w-96 rounded-full animate-pulse duration-4000' />
        <div className='bg-secondary/80 absolute -z-10 right-[-20%] top-[5%] h-56 w-56 rounded-full animate-pulse duration-8000' />
        <div className='bg-tertiary/40 absolute -z-10 bottom-[-10%] right-[-10%] h-75 w-75 rounded-full animate-pulse duration-12000' />

        <div className='rounded-4xl px-8 pb-8 pt-16 text-center shadow-2xl backdrop-blur-xl bg-secondary/30'>
          {image}

          {Boolean(hero) && (
            <h1 className='select-none text-[7rem] text-shadow-[-10px_-10px_var(--color-tertiary),-9px_-9px_var(--color-tertiary),-8px_-8px_var(--color-tertiary),-7px_-7px_var(--color-tertiary),-6px_-6px_var(--color-tertiary),-5px_-5px_var(--color-tertiary),-4px_-4px_var(--color-tertiary),-3px_-3px_var(--color-tertiary),-2px_-2px_var(--color-tertiary),-1px_-1px_var(--color-tertiary),0_0_10px_var(--color-primary)] text-primary animate-glitch group-hover:scale-110 group-hover:rotate-3'>
              {hero}
            </h1>
          )}

          <h3 className='mb-4 font-bold text-foreground'>{title}</h3>

          <p className='mx-auto mb-8 max-w-xl text-muted-foreground'>{description}</p>

          <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>{actions}</div>

          <p className='mt-8 text-label opacity-60 p-4 rounded-lg bg-tertiary/10'>{footer}</p>
        </div>
      </section>
    </main>
  );
};
