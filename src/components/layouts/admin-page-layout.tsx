import { cn } from '@helpers';

interface AdminPageLayoutProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  dataComponent?: string;
  className?: string;
}

export const AdminPageLayout = ({
  title,
  subtitle,
  children,
  actions,
  dataComponent,
  className,
}: AdminPageLayoutProps) => {
  return (
    <div data-component={dataComponent} className={cn('mx-auto max-w-7xl space-y-6 px-4 py-8 pt-20', className)}>
      <header className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))]'>
        <div className='flex flex-row items-center justify-between gap-4'>
          <div>
            <h1 className='text-primary'>{title}</h1>

            {subtitle ? <p className='mt-1 text-sm text-muted-foreground'>{subtitle}</p> : null}
          </div>

          {actions ? <div className='flex flex-row items-center gap-2'>{actions}</div> : null}
        </div>
      </header>

      {children}
    </div>
  );
};
