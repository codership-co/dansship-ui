import { Link } from 'react-router';

import { Gradients } from '@components/modules';
import { Logotype } from '@components/svg';
import { PageURLS } from '@core/constants';
import { cn } from '@helpers';

interface AuthFormLayoutProps {
  isFlipped?: boolean;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}

export const AuthFormLayout = ({ isFlipped, title, subtitle, children }: AuthFormLayoutProps) => {
  return (
    <div className='min-h-dvh grid xs:items-center xs:justify-center md:items-stretch md:justify-stretch xs:py-12 xs:px-6 md:p-0'>
      <div
        className={cn(
          'bg-white shadow-2xl w-full xs:rounded-lg md:rounded-none xs:max-w-100 md:max-w-none md:min-h-200 md:h-dvh',
          // eslint-disable-next-line quotes
          "grid overflow-hidden xs:rounded-lg md:rounded-none grid-cols-1 [grid-template-areas:'form']",
          isFlipped
            ? // eslint-disable-next-line quotes
              "md:grid-cols-[minmax(400px,40vw)_1fr] md:[grid-template-areas:'form_gradients']"
            : // eslint-disable-next-line quotes
              "md:grid-cols-[1fr_minmax(400px,40vw)] md:[grid-template-areas:'gradients_form']",
        )}
      >
        <Gradients className='hidden md:block' flipped={isFlipped} styles={{ gridArea: 'gradients' }} />

        <section
          className='relative pt-18 pb-8 px-10 grid content-center justify-center max-w-108 mx-auto h-full overflow-auto'
          style={{
            gridArea: 'form',
            viewTransitionName: 'auth-form',
          }}
        >
          <div className='text-center mb-4 mx-auto'>
            <Link to={PageURLS.home} className='absolute top-6 left-1/2 -translate-x-1/2'>
              <Logotype className='h-6 m-auto' />
            </Link>
            <h4 className='text-primary'>{title}</h4>
            <label>{subtitle}</label>
          </div>

          {children}
        </section>
      </div>
    </div>
  );
};
