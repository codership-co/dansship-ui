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
    <main className='relative grid sm:place-content-center sm:px-6 sm:py-20 min-h-dvh'>
      <section className='fixed hidden sm:block -z-10 size-full top-0 left-0 overflow-hidden bg-blue'>
        <div className='bg-primary/40 absolute right-[-6%] top-[-5%] size-96 rounded-full' />
        <div className='bg-secondary/80 absolute left-[-2%] top-[5%] size-56 rounded-full' />
        <div className='bg-tertiary/40 absolute bottom-[-8%] left-[-6%] size-120 rounded-full' />
      </section>
      <section className='relative sm:max-w-xl group'>
        <div className='sm:rounded-4xl px-8 pt-40 pb-20 sm:pb-8 sm:pt-16 text-center grid content-center sm:shadow-2xl sm:backdrop-blur-xl sm:bg-secondary/30 h-full sm:h-auto'>
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
