import { Gradients } from '@components/modules';
import { Logotype } from '@components/svg';
import { cn } from '@helpers';

interface AuthFormLayoutProps {
  isFlipped?: boolean;
  gradientsImage: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}

export const AuthFormLayout = ({ isFlipped, gradientsImage, title, subtitle, children }: AuthFormLayoutProps) => {
  return (
    <div className='min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <section className='shadow-2xl max-w-100 md:max-w-6xl w-full'>
        <div
          className={cn(
            'bg-white grid rounded-xl md:rounded-lg w-full md:h-180 overflow-hidden',
            isFlipped
              ? // eslint-disable-next-line quotes
                "md:grid-cols-[400px_1fr] md:[grid-template-areas:'form_gradients']"
              : // eslint-disable-next-line quotes
                "md:grid-cols-[1fr_400px] md:[grid-template-areas:'gradients_form']",
          )}
        >
          <Gradients
            className='hidden md:block'
            img={gradientsImage}
            flipped={isFlipped}
            styles={{ gridArea: 'gradients' }}
          />

          <section
            className='pt-12 px-10 pb-8 grid content-center h-full overflow-auto'
            style={{
              gridArea: 'form',
              viewTransitionName: 'auth-form',
            }}
          >
            <div className='text-center mb-4'>
              <Logotype className='w-60 m-auto' mainColor={isFlipped ? 'var(--color-tertiary)' : undefined} />
              <h4 className='text-primary'>{title}</h4>
              <label>{subtitle}</label>
            </div>

            {children}
          </section>
        </div>
      </section>
    </div>
  );
};
