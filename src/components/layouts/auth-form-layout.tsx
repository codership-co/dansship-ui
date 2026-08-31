import { Link } from 'react-router';

import { Gradients } from '@components/modules/auth/gradients';
import { Logotype } from '@components/svg';
import { PageURLS } from '@core/constants';
import { cn } from '@helpers';

interface AuthFormLayoutProps {
  isFlipped?: boolean;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  dataComponent?: string;
}

export const AuthFormLayout = ({ isFlipped, title, subtitle, children, dataComponent }: AuthFormLayoutProps) => {
  return (
    <div
      data-component={dataComponent}
      className={cn(
        'relative',
        'md:min-h-200 md:h-dvh',
        // eslint-disable-next-line quotes
        "grid overflow-hidden grid-cols-1 [grid-template-areas:'form']",
        isFlipped
          ? // eslint-disable-next-line quotes
            "md:grid-cols-[minmax(432px,40vw)_1fr] md:[grid-template-areas:'form_gradients']"
          : // eslint-disable-next-line quotes
            "md:grid-cols-[1fr_minmax(432px,40vw)] md:[grid-template-areas:'gradients_form']",
      )}
    >
      <Gradients
        className={cn('hidden', 'block absolute top-0 left-0 w-full h-full', 'md:relative')}
        flipped={isFlipped}
        styles={{ gridArea: 'gradients' }}
      />

      <section
        className={cn(
          'relative [grid-area:form] [view-transition-name:auth-form]',
          'h-full w-full bg-white/60',
          'xs:h-fit xs:max-w-108 xs:bg-white/50 xs:backdrop-blur-sm xs:rounded-2xl xs:shadow-2xl',
          'md:h-full md:max-w-full md:bg-white md:backdrop-blur-none md:rounded-none md:shadow-none',
          'pt-18 pb-8 px-10 grid content-center justify-center  m-auto overflow-auto',
        )}
      >
        <section className='xs:max-w-88 mx-auto'>
          <div className='text-center mb-4 mx-auto'>
            <Link to={PageURLS.home} className='hidden md:block absolute top-8 left-1/2 -translate-x-1/2'>
              <Logotype className='h-6 m-auto text-white md:text-primary' />
            </Link>
            <h3 className='text-primary'>{title}</h3>
            <label>{subtitle}</label>
          </div>

          {children}
        </section>
      </section>

      <Link to={PageURLS.home} className='md:hidden fixed top-8 left-1/2 -translate-x-1/2'>
        <Logotype className='h-6 m-auto text-primary xs:text-white md:text-primary' />
      </Link>
    </div>
  );
};
