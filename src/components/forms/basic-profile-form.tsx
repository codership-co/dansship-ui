import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Button, Checkbox } from 'polpo/components';
import { ChangeEvent, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { LuBuilding, LuCalendar, LuHouse, LuIdCard, LuPhone, LuUser } from 'react-icons/lu';
import { toast } from 'sonner';
import { z } from 'zod';

import { DateField, PhoneField, SelectField, TextField } from '@components/form-fields';
import { DansshipAPI, PaymentProofContentType, PaymentProofContentTypesList } from '@core/api';
import { DOCUMENT_TYPE_OPTIONS } from '@core/constants';

export const createBasicProfileSchema = (t: TFunction, requireTermsAcceptance = false) => {
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  const baseSchema = z.object({
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
    terms_accepted: z.boolean().optional(),
  });

  if (!requireTermsAcceptance) {
    return baseSchema;
  }

  return baseSchema.extend({
    terms_accepted: z.literal(true, {
      message: t('auth:onboarding.termsRequired'),
    }),
  });
};

type BasicProfileFormValues = z.infer<ReturnType<typeof createBasicProfileSchema>>;

interface OnboardingBasicProfileFormProps {
  isLoading: boolean;
  error: string | null;
  onSubmit: (values: BasicProfileFormValues) => void;
  defaultValues?: BasicProfileFormValues;
  requireTermsAcceptance?: boolean;
}

export function BasicProfileForm({
  isLoading,
  error,
  onSubmit,
  defaultValues,
  requireTermsAcceptance = false,
}: OnboardingBasicProfileFormProps) {
  const { t } = useTranslation();
  const schema = createBasicProfileSchema(t, requireTermsAcceptance);
  const [profilePhoto, setProfilePhoto] = useState<File>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { handleSubmit, control } = useForm<BasicProfileFormValues>({
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
      terms_accepted: false,
      ...defaultValues,
    },
  });

  const handleInputFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    const isValidType = Object.values(PaymentProofContentType).includes(file.type as PaymentProofContentType);

    if (!isValidType) {
      toast.error(t('payments:proofInvalidTypeTitle'));
      event.currentTarget.value = '';

      return;
    }

    setImageUrl(URL.createObjectURL(file));
    setProfilePhoto(file);
    event.currentTarget.value = '';
  };

  const internalSubmit = async (values: BasicProfileFormValues) => {
    if (profilePhoto) {
      try {
        await DansshipAPI.auth.uploadProfilePhoto(profilePhoto);
      } catch {
        toast.error(t('auth:profilePhotoUpdateFailed'));

        return;
      }
    }

    if (requireTermsAcceptance) {
      onSubmit({ ...values, terms_accepted: true });

      return;
    }

    const { terms_accepted: _termsAccepted, ...profileValues } = values;
    onSubmit(profileValues);
  };

  return (
    <div className='space-y-6' data-sentry-mask>
      <form className='space-y-4' onSubmit={handleSubmit(internalSubmit)}>
        <section className='grid lg:grid-cols-[auto_1fr] gap-4'>
          <div
            className='relative grid justify-items-center gap-8 rounded-md border border-dashed border-gray-300 py-4 px-8'
            data-sentry-block
          >
            <section>
              <section className='w-50 aspect-square bg-gray-300/50 border border-dashed border-gray-300 rounded-full grid place-content-center overflow-hidden'>
                {imageUrl ? (
                  <img src={imageUrl} alt='proof preview' className='w-full aspect-square inline-block object-cover' />
                ) : (
                  <label className='p-8 text-center'>{t('auth:onboarding.fields.profilePhoto.button')}</label>
                )}
              </section>
            </section>
            <section className='grid justify-items-center'>
              <Button color='secondary' variant='flat'>
                {profilePhoto
                  ? t('auth:onboarding.fields.profilePhoto.buttonReplace')
                  : t('auth:onboarding.fields.profilePhoto.button')}
              </Button>
            </section>
            <input
              type='file'
              className='absolute w-full h-full top-0 left-0 cursor-pointer opacity-0'
              accept={PaymentProofContentTypesList.join(',')}
              onChange={handleInputFileUpload}
            />
          </div>

          <section className='space-y-4'>
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

            <PhoneField
              control={control}
              codeName='phone_country_code'
              codePlaceholder={t('auth:onboarding.fields.phoneCode.placeholder')}
              name='phone_number'
              icon={<LuPhone className='mr-2 h-4 w-4' />}
              type='tel'
              label={t('auth:onboarding.fields.phoneNumber.label')}
              placeholder={t('auth:onboarding.fields.phoneNumber.placeholder')}
            />
          </section>
        </section>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-end'>
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

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-end'>
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

        {requireTermsAcceptance ? (
          <Controller
            name='terms_accepted'
            control={control}
            render={({ field, fieldState }) => (
              <div className='space-y-1'>
                <Checkbox
                  label={
                    <Trans
                      className='text-small'
                      i18nKey='auth:onboarding.terms'
                      components={{
                        LinkTerms: (
                          <a
                            target='_blank'
                            href='/assets/legal/terminos-y-condiciones.pdf'
                            className='text-info underline'
                            rel='noreferrer'
                          />
                        ),
                        LinkPrivacy: (
                          <a
                            target='_blank'
                            href='/assets/legal/politica-privacidad.pdf'
                            className='text-info underline'
                            rel='noreferrer'
                          />
                        ),
                      }}
                    />
                  }
                  name='terms_accepted'
                  value={field.value === true}
                  setValue={() => field.onChange(!(field.value === true))}
                />
                {fieldState.error?.message ? (
                  <p className='text-sm text-alert-600'>{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />
        ) : null}

        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

        <Button type='submit' isLoading={isLoading} color='primary' className='mt-12' fullWidth>
          {isLoading ? t('common:loading') : t('auth:onboarding.continue')}
        </Button>
      </form>
    </div>
  );
}
