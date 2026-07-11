import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Button } from 'polpo/components';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuBuilding, LuCalendar, LuHouse, LuIdCard, LuUser } from 'react-icons/lu';
import { z } from 'zod';

import { DateField, SelectField, TextField } from '@components/form-fields';
import { COUNTRY_CODE_OPTIONS, DOCUMENT_TYPE_OPTIONS } from '@core/constants';

export const createStudentProfileSchema = (t: TFunction) => {
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  return z.object({
    full_name: z.string().min(1, { message: t('auth:onboarding.validationRequired') }),
    birth_date: z
      .date(t('auth:onboarding.validationRequired'))
      .max(tenYearsAgo, { message: t('auth:onboarding.validationMinAge10') }),
    phone_country_code: z.string().min(1, { message: t('auth:onboarding.validationRequired') }),
    phone_number: z.string().regex(/^\d{10}$/, { message: t('auth:onboarding.validationPhoneLength') }),
    document_type: z.string().min(1, { message: t('auth:onboarding.validationRequired') }),
    document_value: z.string().min(1, { message: t('auth:onboarding.validationRequired') }),
    city: z.string().optional(),
    address: z.string().optional(),
  });
};

type StudentProfileFormValues = z.infer<ReturnType<typeof createStudentProfileSchema>>;

interface OnboardingStudentProfileFormProps {
  isLoading: boolean;
  error: string | null;
  onSubmit: (values: StudentProfileFormValues) => void;
}

export function OnboardingStudentProfileForm({ isLoading, error, onSubmit }: OnboardingStudentProfileFormProps) {
  const { t } = useTranslation();
  const schema = createStudentProfileSchema(t);

  const { handleSubmit, control } = useForm<StudentProfileFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      birth_date: undefined,
      phone_country_code: '+57',
      phone_number: '',
      document_type: '',
      document_value: '',
      city: '',
      address: '',
    },
  });

  return (
    <div className='space-y-6'>
      <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-start'>
          <div className='space-y-2'>
            <TextField
              control={control}
              label={t('auth:onboarding.fields.fullName.label')}
              name='full_name'
              placeholder={t('auth:onboarding.fields.fullName.placeholder')}
              icon={<LuUser className='mr-2 h-4 w-4' />}
            />
          </div>

          <div className='space-y-2'>
            <DateField
              control={control}
              name='birth_date'
              label={t('auth:onboarding.fields.birthDate.label')}
              icon={<LuCalendar className='mr-2 h-4 w-4' />}
              placeholder={t('auth:onboarding.fields.birthDate.placeholder')}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-start'>
          <SelectField
            control={control}
            name='document_type'
            label={t('auth:onboarding.fields.documentType.label')}
            options={DOCUMENT_TYPE_OPTIONS.map(option => ({
              ...option,
              label: t(option.label),
            }))}
            placeholder={t('auth:onboarding.fields.documentType.placeholder')}
          />

          <div className='space-y-2'>
            <TextField
              control={control}
              label={t('auth:onboarding.fields.documentValue.label')}
              name='document_value'
              placeholder={t('auth:onboarding.fields.documentValue.placeholder')}
              icon={<LuIdCard className='mr-2 h-4 w-4' />}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] items-start'>
          <SelectField
            control={control}
            name='phone_country_code'
            label={t('auth:onboarding.fields.phoneCode.label')}
            options={COUNTRY_CODE_OPTIONS}
            placeholder={t('auth:onboarding.fields.phoneCode.placeholder')}
          />
          <TextField
            control={control}
            type='tel'
            label={t('auth:onboarding.fields.phoneNumber.label')}
            name='phone_number'
            placeholder={t('auth:onboarding.fields.phoneNumber.placeholder')}
            icon={<LuBuilding className='mr-2 h-4 w-4' />}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-start'>
          <div className='space-y-2'>
            <TextField
              control={control}
              label={t('auth:onboarding.fields.city.label')}
              name='city'
              placeholder={t('auth:onboarding.fields.city.placeholder')}
              icon={<LuBuilding className='mr-2 h-4 w-4' />}
            />
          </div>

          <div className='space-y-2'>
            <TextField
              control={control}
              label={t('auth:onboarding.fields.address.label')}
              name='address'
              placeholder={t('auth:onboarding.fields.address.placeholder')}
              icon={<LuHouse className='mr-2 h-4 w-4' />}
            />
          </div>
        </div>

        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

        <Button type='submit' isLoading={isLoading} color='primary' className='mt-4' fullWidth>
          {isLoading ? t('common:loading') : t('auth:onboarding.continue')}
        </Button>
      </form>
    </div>
  );
}
