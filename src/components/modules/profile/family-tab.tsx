import { format, parseISO } from 'date-fns';
import { Button, Checkbox } from 'polpo/components';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { SectionHeading } from '@components/containers';
import { DateField, SelectField, TextField } from '@components/form-fields';
import { HealthProfileForm, type HealthDataFormValues } from '@components/forms/health-profile-form';
import { Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui';
import { useAuth } from '@contexts';
import { DANSSHIP_ERROR_CODE, DansshipAPI, DansshipAPIError, type MinorSummary } from '@core/api';
import { buildStudioWhatsAppLink, toColombiaDateKey } from '@helpers';
import { usePromise } from '@hooks';

const RELATIONSHIPS = ['mother', 'father', 'guardian', 'grandparent', 'aunt_uncle', 'sibling', 'other'] as const;
const DOCUMENT_TYPES = ['RC', 'TI', 'CE', 'PA'] as const;

interface IdentityValues {
  given_name: string;
  family_name: string;
  birth_date?: Date;
  document_type: string;
  document_value: string;
  relationship: string;
}

function ageFromDate(value: Date) {
  const today = toColombiaDateKey(new Date()).split('-').map(Number);
  let years = today[0] - value.getFullYear();
  const before = today[1] < value.getMonth() + 1 || (today[1] === value.getMonth() + 1 && today[2] < value.getDate());

  if (before) {
    years -= 1;
  }

  return years;
}

export function FamilyTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { response, reFetch } = usePromise(() => DansshipAPI.family.listMine());
  const { response: policyResponse } = usePromise(() => DansshipAPI.family.getPolicy());
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editing, setEditing] = useState<MinorSummary | null>(null);
  const [health, setHealth] = useState<HealthDataFormValues | null>(null);
  const [permission, setPermission] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const identity = useForm<IdentityValues>({
    defaultValues: {
      given_name: '',
      family_name: '',
      document_type: 'RC',
      document_value: '',
      relationship: 'mother',
    },
  });
  const minors = response?.data?.minors ?? [];
  const pending = response?.data?.pending_requests ?? [];
  const birthDate = identity.watch('birth_date');
  const showAgeHint = birthDate instanceof Date && ageFromDate(birthDate) >= 10;

  const reset = () => {
    setStep(1);
    setEditing(null);
    setHealth(null);
    setPermission(false);
    setPolicyAccepted(false);
    setError(null);
    identity.reset();
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (minor: MinorSummary) => {
    reset();
    setEditing(minor);
    identity.reset({
      given_name: minor.given_name ?? '',
      family_name: minor.family_name ?? '',
      document_type: minor.document_type ?? '',
      document_value: '',
      relationship: 'other',
      birth_date: minor.birth_date ? parseISO(minor.birth_date) : undefined,
    });
    setOpen(true);
  };

  const saveEdit = async (values: HealthDataFormValues) => {
    if (!editing) {
      return;
    }

    setSaving(true);
    setError(null);
    const names = identity.getValues();
    const result = await DansshipAPI.family.updateMinor(editing.user_id, {
      given_name: names.given_name,
      family_name: names.family_name,
      health: {
        emergency_contact_name: values.emergency_contact_name ?? '',
        emergency_contact_relative: values.emergency_contact_relative,
        emergency_contact_phone_country_code: values.emergency_contact_phone_country_code,
        emergency_contact_phone_number: values.emergency_contact_phone_number ?? '',
        eps: values.eps,
        existing_medical_conditions: values.no_medical_conditions ? null : values.existing_medical_conditions,
        no_medical_conditions: Boolean(values.no_medical_conditions),
      },
    });

    setSaving(false);

    if (!result.ok) {
      setError(t('family:saveError'));

      return;
    }

    setOpen(false);
    await reFetch();
  };

  const submitCreate = async () => {
    const values = identity.getValues();

    if (!health || !(values.birth_date instanceof Date) || !permission || !policyAccepted) {
      return;
    }

    setSaving(true);
    setError(null);
    const result = await DansshipAPI.family.createMinor({
      given_name: values.given_name,
      family_name: values.family_name,
      birth_date: format(values.birth_date, 'yyyy-MM-dd'),
      document_type: values.document_type,
      document_value: values.document_value,
      relationship: values.relationship,
      permission_declared: permission,
      policy_accepted: policyAccepted,
      health: {
        emergency_contact_name: health.emergency_contact_name ?? '',
        emergency_contact_relative: health.emergency_contact_relative,
        emergency_contact_phone_country_code: health.emergency_contact_phone_country_code,
        emergency_contact_phone_number: health.emergency_contact_phone_number ?? '',
        eps: health.eps,
        existing_medical_conditions: health.no_medical_conditions ? null : health.existing_medical_conditions,
        no_medical_conditions: Boolean(health.no_medical_conditions),
      },
    });

    setSaving(false);

    if (!result.ok) {
      const code = result.error instanceof DansshipAPIError ? result.error.body.error_code : undefined;

      setError(
        code === DANSSHIP_ERROR_CODE.DOCUMENT_NOT_AVAILABLE ? t('family:documentUnavailable') : t('family:saveError'),
      );

      return;
    }

    setOpen(false);
    await reFetch();
  };

  return (
    <section className='grid gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <SectionHeading title={t('family:title')} />
        <Button color='primary' onClick={openCreate}>
          {t('family:add')}
        </Button>
      </div>

      {pending.map(request => (
        <p key={request.id} className='text-sm text-muted-foreground'>
          {request.given_name} {request.family_name}: {t('family:pending')}
        </p>
      ))}

      {minors.length === 0 && pending.length === 0 ? <p>{t('family:empty')}</p> : null}

      <ul className='grid gap-3'>
        {minors.map(minor => (
          <li key={minor.user_id} className='flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4'>
            <div>
              <p className='font-medium'>
                {minor.full_name}
                {minor.age !== null ? ` · ${minor.age}` : ''}
              </p>
              <p className='text-sm text-muted-foreground'>
                {minor.document_type} {minor.document_value_masked}
              </p>
              {minor.trial_available ? <Badge>{t('family:trialAvailable')}</Badge> : null}
              {minor.trial_used ? <Badge>{t('family:trialUsed')}</Badge> : null}
            </div>
            <Button variant='outlined' color='secondary' onClick={() => openEdit(minor)}>
              {t('family:edit')}
            </Button>
          </li>
        ))}
      </ul>

      <Dialog
        open={open}
        onOpenChange={next => {
          setOpen(next);

          if (!next) {
            reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('family:edit') : t('family:add')}</DialogTitle>
          </DialogHeader>

          {step === 1 ? (
            <form
              className='grid gap-4'
              onSubmit={identity.handleSubmit(() => {
                if (editing) {
                  setStep(2);

                  return;
                }

                setStep(2);
              })}
            >
              <TextField control={identity.control} name='given_name' label={t('family:fields.givenName')} />
              <TextField control={identity.control} name='family_name' label={t('family:fields.familyName')} />
              <DateField
                control={identity.control}
                name='birth_date'
                label={t('family:fields.birthDate')}
                disabled={Boolean(editing)}
              />
              {showAgeHint ? <p className='text-sm text-muted-foreground'>{t('family:ageHint')}</p> : null}
              <SelectField
                control={identity.control}
                name='document_type'
                label={t('family:fields.documentType')}
                disabled={Boolean(editing)}
                options={DOCUMENT_TYPES.map(value => ({ value, label: t(`family:documents.${value}`) }))}
              />
              {editing ? (
                <p className='text-sm text-muted-foreground'>{t('family:readOnlyIdentity')}</p>
              ) : (
                <TextField control={identity.control} name='document_value' label={t('family:fields.documentValue')} />
              )}
              {editing ? null : (
                <SelectField
                  control={identity.control}
                  name='relationship'
                  label={t('family:fields.relationship')}
                  options={RELATIONSHIPS.map(value => ({ value, label: t(`family:relationships.${value}`) }))}
                />
              )}
              <Button type='submit' color='primary'>
                {t('family:continue')}
              </Button>
            </form>
          ) : null}

          {step === 2 ? (
            <HealthProfileForm
              isLoading={saving}
              error={error}
              requireHealth
              showSkip={false}
              submitLabel={editing ? t('family:save') : t('family:continue')}
              guardianContact={
                user
                  ? {
                      name: user.fullName || user.name,
                      phoneCountryCode: user.phoneCountryCode,
                      phoneNumber: user.phoneNumber,
                    }
                  : undefined
              }
              onContinue={values => {
                if (editing) {
                  void saveEdit(values);

                  return;
                }

                setHealth(values);
                setStep(3);
              }}
            />
          ) : null}

          {step === 3 && !editing ? (
            <div className='grid gap-4'>
              <Checkbox
                label={t('family:permission')}
                name='permission'
                value={permission}
                setValue={() => setPermission(current => !current)}
              />
              <Checkbox
                label={
                  <a
                    href={policyResponse?.data?.asset_path || '/assets/legal/politica-cuentas-administradas.pdf'}
                    target='_blank'
                    rel='noreferrer'
                  >
                    {t('family:policy')}
                  </a>
                }
                name='policy'
                value={policyAccepted}
                setValue={() => setPolicyAccepted(current => !current)}
              />
              {error ? (
                <div className='grid gap-2'>
                  <p className='text-sm text-alert-600'>{error}</p>
                  {error === t('family:documentUnavailable') ? (
                    <a href={buildStudioWhatsAppLink()}>{t('family:contact')}</a>
                  ) : null}
                </div>
              ) : null}
              <div className='flex gap-2'>
                <Button type='button' variant='outlined' color='secondary' onClick={() => setStep(2)}>
                  {t('family:back')}
                </Button>
                <Button
                  type='button'
                  color='primary'
                  isLoading={saving}
                  disabled={!permission || !policyAccepted}
                  onClick={() => void submitCreate()}
                >
                  {t('family:save')}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
