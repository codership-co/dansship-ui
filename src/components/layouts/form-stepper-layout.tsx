import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import { LuCircleArrowRight, LuCircleCheck } from 'react-icons/lu';

import { Badge } from '@components/ui';
import { cn } from '@helpers';

export interface FormStepperStep<T extends string> {
  title: string;
  subtitle: string;
  step: T;
  Icon: IconType;
  form: React.ReactNode;
}

interface FormStepperLayoutProps<T extends string> {
  steps: Array<FormStepperStep<T>>;
  currentStep: T;
  noAvailableStepMessage: string;
}

export const FormStepperLayout = <T extends string>({
  steps,
  currentStep,
  noAvailableStepMessage,
}: FormStepperLayoutProps<T>) => {
  const { t } = useTranslation();
  const stepIndex = steps.findIndex(step => step.step === currentStep);

  if (stepIndex === -1) {
    return <p className='text-sm text-gray-600'>{noAvailableStepMessage}</p>;
  }

  return (
    <section className='shadow-2xl rounded-xl md:rounded-2xl'>
      <section className='grid md:grid-cols-[auto_1fr] bg-white rounded-xl md:rounded-2xl overflow-hidden'>
        <section className='px-8 py-6 md:py-16 md:pl-8 md:pr-16 bg-gradient-onboarding grid grid-flow-col md:grid-flow-row gap-6 md:gap-8 justify-start content-start select-none'>
          {steps.map(({ title, step, Icon }, index) => (
            <section
              key={step}
              className={cn(
                'grid content-start md:content-center md:grid-cols-[auto_1fr] md:gap-4',
                index < stepIndex && 'text-active-600',
                index === stepIndex && 'text-tertiary',
                index > stepIndex && 'text-neutral-400',
              )}
            >
              {index < stepIndex && <LuCircleCheck className='size-8 md:size-12 md:mt-2' />}
              {index === stepIndex && <Icon className='size-8 md:size-12 md:mt-2 animate-pulse' />}
              {index > stepIndex && <Icon className='size-8 md:size-12 md:mt-2' />}
              <section className='relative hidden xs:block'>
                <small className='hidden md:block text-neutral-400 m-0'>{t('common:step', { step: index + 1 })}</small>
                <h4 className='hidden md:block m-0'>{title}</h4>
                <label className='block md:hidden font-bold m-0'>{title}</label>
                {index < stepIndex && (
                  <Badge variant='outlineActive' size='small'>
                    {t('common:complete')}
                  </Badge>
                )}
                {index === stepIndex && (
                  <Badge variant='outlineTertiary' size='small'>
                    {t('common:inProgress')}
                  </Badge>
                )}
                {index > stepIndex && (
                  <Badge variant='outlineNeutral' size='small'>
                    {t('common:pending')}
                  </Badge>
                )}

                {index === stepIndex && (
                  <LuCircleArrowRight className='hidden md:block absolute top-3 -right-21 size-10 p-2 bg-white rounded-full' />
                )}
              </section>
            </section>
          ))}
        </section>
        <section className='px-8 py-16'>
          <section className='mb-10'>
            <h4 className='m-0 text-primary'>{steps[stepIndex].title}</h4>
            <label>{steps[stepIndex].subtitle}</label>
          </section>
          {steps[stepIndex].form}
        </section>
      </section>
    </section>
  );
};
