import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuBuilding, LuCalendar, LuHouse, LuIdCard, LuUser } from 'react-icons/lu';
import { z } from 'zod';

import { DateField, SelectField, TextField } from '@components/form-fields';
import { Button } from '@components/ui';
import { COUNTRY_CODE_OPTIONS, DOCUMENT_TYPE_OPTIONS } from '@core/constants';

export const createStudentProfileSchema = (t: TFunction) => {
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  return z.object({
    fullName: z.string().min(1, { message: t('auth:onboarding.validationRequired') }),
    birthDate: z
      .date(t('auth:onboarding.validationRequired'))
      .max(tenYearsAgo, { message: t('auth:onboarding.validationMinAge10') }),
    phoneCountryCode: z.string().min(1, { message: t('auth:onboarding.validationRequired') }),
    phoneNumber: z.string().regex(/^\d{10}$/, { message: t('auth:onboarding.validationPhoneLength') }),
    documentType: z.string().min(1, { message: t('auth:onboarding.validationRequired') }),
    documentValue: z.string().min(1, { message: t('auth:onboarding.validationRequired') }),
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
      fullName: '',
      birthDate: undefined,
      phoneCountryCode: '+57',
      phoneNumber: '',
      documentType: '',
      documentValue: '',
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
              name='fullName'
              placeholder={t('auth:onboarding.fields.fullName.placeholder')}
              icon={<LuUser className='mr-2 h-4 w-4' />}
            />
          </div>

          <div className='space-y-2'>
            <DateField
              control={control}
              name='birthDate'
              label={t('auth:onboarding.fields.birthDate.label')}
              icon={<LuCalendar className='mr-2 h-4 w-4' />}
              placeholder={t('auth:onboarding.fields.birthDate.placeholder')}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-start'>
          <SelectField
            control={control}
            name='documentType'
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
              name='documentValue'
              placeholder={t('auth:onboarding.fields.documentValue.placeholder')}
              icon={<LuIdCard className='mr-2 h-4 w-4' />}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] items-start'>
          <SelectField
            control={control}
            name='phoneCountryCode'
            label={t('auth:onboarding.fields.phoneCode.label')}
            options={COUNTRY_CODE_OPTIONS}
            placeholder={t('auth:onboarding.fields.phoneCode.placeholder')}
          />
          <TextField
            control={control}
            type='tel'
            label={t('auth:onboarding.fields.phoneNumber.label')}
            name='phoneNumber'
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

        <Button type='submit' disabled={isLoading} className='mt-4 w-full'>
          {isLoading ? t('common:loading') : t('auth:onboarding.continue')}
        </Button>
      </form>
    </div>
  );
}
