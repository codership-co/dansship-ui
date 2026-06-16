import { IconType } from 'react-icons';
import { LuCircleCheck } from 'react-icons/lu';

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
  const stepIndex = steps.findIndex(step => step.step === currentStep);

  if (stepIndex === -1) {
    return <p className='text-sm text-gray-600'>{noAvailableStepMessage}</p>;
  }

  return (
    <section className='grid md:grid-cols-[auto_1fr] bg-white rounded-xl md:rounded-2xl overflow-hidden'>
      <section className='px-8 py-6 md:py-16 md:pl-8 md:pr-16 bg-secondary grid grid-flow-col md:grid-flow-row gap-4 md:gap-8 justify-start content-start select-none'>
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
            {index < stepIndex && <LuCircleCheck className='size-8 md:size-12' />}
            {index === stepIndex && <Icon className='size-8 md:size-12' />}
            {index > stepIndex && <Icon className='size-8 md:size-12' />}
            <h4 className='hidden md:block'>{title}</h4>
            <label className='hidden xs:block md:hidden font-bold m-0'>{title}</label>
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
  );
};
