import { format } from 'date-fns';
import { ActionModal, Button, Checkbox } from 'polpo/components';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { LuBell, LuCalendar, LuGift, LuHeart, LuIdCard, LuShield, LuTicket, LuUser } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { DateField, PhoneField, SelectField, TextareaField, TextField } from '@components/form-fields';
import { FormStepperLayout } from '@components/layouts/form-stepper-layout';
import { Badge, Input, Label } from '@components/ui';
import { useAuth } from '@contexts';
import {
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  type MinorHealthPayload,
  type MinorSummary,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { buildStudioWhatsAppLink, cn, toColombiaDateKey } from '@helpers';

const RELATIONSHIPS = ['mother', 'father', 'guardian', 'grandparent', 'aunt_uncle', 'sibling', 'other'] as const;
const DOCUMENT_TYPES = ['RC', 'TI', 'CE', 'PA'] as const;

enum FamilyStep {
  IDENTITY = 'IDENTITY',
  HEALTH = 'HEALTH',
  AUTHORIZATION = 'AUTHORIZATION',
}

interface IdentityValues {
  given_name: string;
  family_name: string;
  birth_date?: Date;
  document_type: string;
  document_value: string;
  relationship: string;
}

interface HealthValues {
  existing_medical_conditions: string;
  eps: string;
  emergency_contact_name: string;
  emergency_contact_phone_country_code: string;
  emergency_contact_phone_number: string;
}

interface FamilyRegistrationModalProps {
  minor: MinorSummary | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);

  return new Date(year, month - 1, day);
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

function tenDigitPhone(value: string | undefined) {
  const digits = (value ?? '').replace(/\D/g, '');

  return digits.length === 10 ? digits : '';
}

function toHealthPayload(values: HealthValues): MinorHealthPayload {
  const conditions = values.existing_medical_conditions.trim();

  return {
    emergency_contact_name: values.emergency_contact_name.trim(),
    emergency_contact_phone_country_code: values.emergency_contact_phone_country_code || '+57',
    emergency_contact_phone_number: values.emergency_contact_phone_number.trim(),
    eps: values.eps.trim() || null,
    existing_medical_conditions: conditions || null,
    no_medical_conditions: !conditions,
  };
}

function StepFooter({
  backLabel,
  nextLabel,
  nextDisabled,
  loading,
  onBack,
  onNext,
}: {
  backLabel: string;
  nextLabel: string;
  nextDisabled?: boolean;
  loading?: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className='flex flex-wrap justify-end gap-2 pt-4'>
      <Button color='primary' variant='outlined' type='button' onClick={onBack}>
        {backLabel}
      </Button>
      <Button
        color='primary'
        variant='solid'
        type='button'
        disabled={nextDisabled}
        isLoading={loading}
        onClick={onNext}
      >
        {nextLabel}
      </Button>
    </div>
  );
}

export function FamilyRegistrationModal({ minor, onClose, onSaved }: FamilyRegistrationModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const editing = minor !== null;
  const guardian = user
    ? {
        name: user.fullName || user.name,
        phoneCountryCode: user.phoneCountryCode,
        phoneNumber: user.phoneNumber,
      }
    : null;
  const [step, setStep] = useState(FamilyStep.IDENTITY);
  const [useGuardianContact, setUseGuardianContact] = useState(!editing);
  const [permission, setPermission] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<MinorSummary | null>(null);
  const identity = useForm<IdentityValues>({
    defaultValues: {
      given_name: minor?.given_name ?? '',
      family_name: minor?.family_name ?? '',
      birth_date: minor?.birth_date ? parseDateOnly(minor.birth_date) : undefined,
      document_type: minor?.document_type ?? '',
      document_value: '',
      relationship: '',
    },
  });
  const savedHealth = minor?.health;
  const health = useForm<HealthValues>({
    defaultValues: {
      existing_medical_conditions: savedHealth?.existing_medical_conditions ?? '',
      eps: savedHealth?.eps ?? '',
      emergency_contact_name: savedHealth?.emergency_contact_name ?? '',
      emergency_contact_phone_country_code:
        savedHealth?.emergency_contact_phone_country_code || guardian?.phoneCountryCode || '+57',
      emergency_contact_phone_number: savedHealth?.emergency_contact_phone_number ?? '',
    },
  });
  const givenName = identity.watch('given_name');
  const familyName = identity.watch('family_name');
  const birthDate = identity.watch('birth_date');
  const documentType = identity.watch('document_type');
  const documentValue = identity.watch('document_value');
  const relationship = identity.watch('relationship');
  const healthValues = health.watch();
  const fullName = `${givenName.trim()} ${familyName.trim()}`.trim();
  const age = birthDate instanceof Date && !Number.isNaN(birthDate.getTime()) ? ageFromDate(birthDate) : null;
  const ageInRange = age !== null && age >= 3 && age <= 17;
  const identityReady = editing
    ? Boolean(givenName.trim() && familyName.trim())
    : Boolean(
        givenName.trim() && familyName.trim() && ageInRange && documentType && documentValue.trim() && relationship,
      );
  const contact = useGuardianContact
    ? {
        name: guardian?.name.trim() ?? '',
        phone: tenDigitPhone(guardian?.phoneNumber),
        code: guardian?.phoneCountryCode || '+57',
      }
    : {
        name: healthValues.emergency_contact_name.trim(),
        phone: tenDigitPhone(healthValues.emergency_contact_phone_number),
        code: healthValues.emergency_contact_phone_country_code || '+57',
      };
  const healthReady = Boolean(contact.name && contact.phone);

  const applyContact = () => {
    health.setValue('emergency_contact_name', contact.name);
    health.setValue('emergency_contact_phone_number', contact.phone);
    health.setValue('emergency_contact_phone_country_code', contact.code);
  };

  const saveEdit = async () => {
    if (!minor) {
      return;
    }

    applyContact();
    setSaving(true);
    setError(null);
    const names = identity.getValues();
    const result = await DansshipAPI.family.updateMinor(minor.user_id, {
      given_name: names.given_name,
      family_name: names.family_name,
      health: toHealthPayload(health.getValues()),
    });

    setSaving(false);

    if (!result.ok) {
      setError(t('family:saveError'));

      return;
    }

    await onSaved();
  };

  const submitCreate = async () => {
    const values = identity.getValues();

    if (!(values.birth_date instanceof Date) || !permission || !policyAccepted) {
      return;
    }

    const ageYears = ageFromDate(values.birth_date);

    if (ageYears < 3 || ageYears > 17) {
      setError(t('family:ageRange'));

      return;
    }

    applyContact();
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
      health: toHealthPayload(health.getValues()),
    });

    setSaving(false);

    if (!result.ok) {
      const code = result.error instanceof DansshipAPIError ? result.error.body.error_code : undefined;
      const message =
        code === DANSSHIP_ERROR_CODE.DOCUMENT_NOT_AVAILABLE
          ? t('family:documentUnavailable')
          : code === DANSSHIP_ERROR_CODE.MANAGED_AGE_RANGE
            ? t('family:ageRange')
            : t('family:saveError');

      setError(message);

      return;
    }

    if (result.data?.status === 'created' && result.data.minor) {
      setCreated(result.data.minor);

      return;
    }

    await onSaved();
  };

  const identityForm = (
    <div className='grid content-start gap-4'>
      <div className='grid gap-4 md:grid-cols-2'>
        <TextField
          control={identity.control}
          name='given_name'
          label={t('family:fields.givenName')}
          placeholder={t('family:wizard.givenPlaceholder')}
          icon={<LuUser className='mr-2 h-4 w-4' />}
        />
        <TextField
          control={identity.control}
          name='family_name'
          label={t('family:fields.familyName')}
          placeholder={t('family:wizard.familyPlaceholder')}
          icon={<LuUser className='mr-2 h-4 w-4' />}
        />
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        <DateField
          control={identity.control}
          name='birth_date'
          label={t('family:fields.birthDate')}
          placeholder={t('family:wizard.birthPlaceholder')}
          icon={<LuCalendar className='mr-2 h-4 w-4' />}
          disabled={editing}
        />
        {editing ? null : (
          <div className='grid gap-2'>
            <Label>{t('family:fields.relationship')}</Label>
            <div className='relative'>
              <LuUser className='pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <SelectField
                control={identity.control}
                name='relationship'
                label={t('family:fields.relationship')}
                hideLabel
                className='pl-9'
                placeholder={t('family:wizard.relationshipPlaceholder')}
                options={RELATIONSHIPS.map(value => ({ value, label: t(`family:relationships.${value}`) }))}
              />
            </div>
          </div>
        )}
      </div>
      {age !== null && !ageInRange ? <p className='text-sm text-warning-600'>{t('family:ageRange')}</p> : null}
      {age !== null && age >= 10 ? <p className='text-sm text-muted-foreground'>{t('family:ageHint')}</p> : null}
      <div className='grid gap-2'>
        <p className='m-0 font-medium'>{t('family:wizard.documentSection')}</p>
        <div className='grid gap-4 md:grid-cols-[8rem_1fr]'>
          <SelectField
            control={identity.control}
            name='document_type'
            label={t('family:fields.documentType')}
            hideLabel
            disabled={editing}
            placeholder={t('family:wizard.documentTypePlaceholder')}
            options={DOCUMENT_TYPES.map(value => ({ value, label: value }))}
          />
          {editing ? (
            <div className='grid gap-2'>
              <Input disabled value={minor.document_value_masked ?? ''} />
            </div>
          ) : (
            <TextField
              control={identity.control}
              name='document_value'
              label={t('family:fields.documentValue')}
              hideLabel
              placeholder={t('family:fields.documentValue')}
              icon={<LuIdCard className='mr-2 h-4 w-4' />}
            />
          )}
        </div>
        <p className='m-0 text-sm text-muted-foreground'>{t('family:wizard.documentLegend')}</p>
        {editing ? <p className='m-0 text-sm text-muted-foreground'>{t('family:readOnlyIdentity')}</p> : null}
      </div>
      <StepFooter
        backLabel={t('common:cancel')}
        nextLabel={t('family:continue')}
        nextDisabled={!identityReady}
        onBack={onClose}
        onNext={() => setStep(FamilyStep.HEALTH)}
      />
    </div>
  );

  const healthForm = (
    <div className='grid content-start gap-6'>
      <section className='grid gap-3'>
        <h5 className='m-0 text-primary'>{t('family:wizard.medicalTitle')}</h5>
        <TextareaField
          control={health.control}
          name='existing_medical_conditions'
          label={t('family:wizard.conditionsLabel')}
          placeholder={t('family:wizard.conditionsPlaceholder')}
          rows={4}
        />
        <p className='m-0 text-sm text-muted-foreground'>{t('family:wizard.conditionsEmpty')}</p>
        <TextField
          control={health.control}
          name='eps'
          label={t('family:wizard.epsOptional')}
          placeholder={t('family:wizard.epsPlaceholder')}
          icon={<LuHeart className='mr-2 h-4 w-4' />}
        />
      </section>
      <section className='grid gap-3'>
        <h5 className='m-0 text-primary'>{t('family:wizard.emergencyTitle')}</h5>
        <Checkbox
          label={t('family:useMyContact')}
          name='use-guardian-contact'
          value={useGuardianContact}
          setValue={() => setUseGuardianContact(current => !current)}
        />
        {useGuardianContact ? null : (
          <div className='grid gap-4 md:grid-cols-2'>
            <TextField
              control={health.control}
              name='emergency_contact_name'
              label={t('family:wizard.contactName')}
              placeholder={t('family:wizard.contactNamePlaceholder')}
              icon={<LuUser className='mr-2 h-4 w-4' />}
            />
            <PhoneField
              control={health.control}
              codeName='emergency_contact_phone_country_code'
              codePlaceholder='+57'
              name='emergency_contact_phone_number'
              label={t('family:wizard.contactPhone')}
              placeholder={t('family:wizard.contactPhonePlaceholder')}
            />
          </div>
        )}
      </section>
      {error && editing ? <p className='text-sm text-alert-600'>{error}</p> : null}
      <StepFooter
        backLabel={t('family:back')}
        nextLabel={editing ? t('family:save') : t('family:continue')}
        nextDisabled={!healthReady}
        loading={saving}
        onBack={() => setStep(FamilyStep.IDENTITY)}
        onNext={() => {
          if (editing) {
            void saveEdit();

            return;
          }

          applyContact();
          setStep(FamilyStep.AUTHORIZATION);
        }}
      />
    </div>
  );

  const authorizationForm = (
    <div className='grid content-start gap-6'>
      <section className='grid gap-4 rounded-xl bg-muted/40 p-4'>
        <div className='flex items-center gap-3'>
          <div className='grid size-12 place-items-center rounded-full bg-primary font-medium text-white'>
            {`${givenName.trim().charAt(0)}${familyName.trim().charAt(0)}`.toUpperCase()}
          </div>
          <div>
            <p className='m-0 font-semibold'>{fullName}</p>
            <p className='m-0 text-sm text-muted-foreground'>{t('family:wizard.managedAccount')}</p>
          </div>
        </div>
        <dl className='grid grid-cols-2 gap-3 text-sm md:grid-cols-3' data-sentry-mask>
          <div>
            <dt className='text-muted-foreground'>{t('family:fields.givenName')}</dt>
            <dd className='m-0 font-medium'>{fullName}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>{t('family:wizard.ageLabel')}</dt>
            <dd className='m-0 font-medium'>{age === null ? '' : t('family:wizard.ageYears', { count: age })}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>{t('family:wizard.documentLabel')}</dt>
            <dd className='m-0 font-medium'>
              {documentType} {documentValue}
            </dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>{t('family:fields.relationship')}</dt>
            <dd className='m-0 font-medium'>{relationship ? t(`family:relationships.${relationship}`) : ''}</dd>
          </div>
        </dl>
      </section>
      <section className='grid gap-3'>
        <h5 className='m-0 text-primary'>{t('family:wizard.afterTitle')}</h5>
        <ul className='grid gap-2'>
          {[
            { icon: LuGift, text: t('family:wizard.afterTrial', { name: givenName.trim() }) },
            { icon: LuTicket, text: t('family:wizard.afterPlans') },
            { icon: LuBell, text: t('family:wizard.afterNotices', { name: givenName.trim() }) },
          ].map(item => (
            <li key={item.text} className='flex items-center gap-3 text-sm'>
              <item.icon className='size-4 shrink-0 text-muted-foreground' />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className='grid gap-3'>
        <h5 className='m-0 text-primary'>{t('family:wizard.authorization.title')}</h5>
        <div className={cn('rounded-xl border p-4', permission && 'border-primary')}>
          <Checkbox
            label={<Trans i18nKey='family:permission' values={{ name: fullName }} components={{ Name: <strong /> }} />}
            name='permission'
            value={permission}
            setValue={() => setPermission(current => !current)}
          />
        </div>
        <div className={cn('rounded-xl border p-4', policyAccepted && 'border-primary')}>
          <Checkbox
            label={
              <Trans
                i18nKey='family:policy'
                components={{
                  LinkPolicy: (
                    <a href={PageURLS.legal} target='_blank' rel='noreferrer' className='text-primary underline' />
                  ),
                }}
              />
            }
            name='policy'
            value={policyAccepted}
            setValue={() => setPolicyAccepted(current => !current)}
          />
        </div>
      </section>
      {error ? (
        <div className='grid gap-2'>
          <p className='text-sm text-alert-600'>{error}</p>
          {error === t('family:documentUnavailable') ? (
            <a href={buildStudioWhatsAppLink()}>{t('family:contact')}</a>
          ) : null}
        </div>
      ) : null}
      <StepFooter
        backLabel={t('family:back')}
        nextLabel={t('family:wizard.createAccount', { name: givenName.trim() })}
        nextDisabled={!permission || !policyAccepted}
        loading={saving}
        onBack={() => setStep(FamilyStep.HEALTH)}
        onNext={() => void submitCreate()}
      />
    </div>
  );

  const steps = [
    {
      title: t('family:wizard.identity.title'),
      subtitle: t('family:wizard.identity.subtitle'),
      step: FamilyStep.IDENTITY,
      Icon: LuUser,
      form: identityForm,
    },
    {
      title: t('family:wizard.health.title'),
      subtitle: t('family:wizard.health.subtitle'),
      step: FamilyStep.HEALTH,
      Icon: LuHeart,
      form: healthForm,
    },
    ...(editing
      ? []
      : [
          {
            title: t('family:wizard.authorization.title'),
            subtitle: t('family:wizard.authorization.subtitle'),
            step: FamilyStep.AUTHORIZATION,
            Icon: LuShield,
            form: authorizationForm,
          },
        ]),
  ];

  if (created) {
    const name = created.given_name?.trim() || givenName.trim();

    return (
      <ActionModal closeOnClickOutside={false} lineOnTop isOpen onClose={() => void onSaved()} className='max-w-xl'>
        <div className='grid justify-items-center gap-6 px-2 py-4 text-center'>
          <Badge variant='outlineActive'>{t('family:wizard.createdBadge')}</Badge>
          <div className='grid gap-3'>
            <h2 className='m-0 text-3xl font-bold'>{t('family:wizard.createdTitle', { name })}</h2>
            <p className='m-0 text-muted-foreground'>{t('family:wizard.createdBody')}</p>
          </div>
          <div className='flex w-full flex-wrap justify-center gap-3'>
            <Button
              color='primary'
              variant='solid'
              type='button'
              onClick={() => {
                const attendeeId = created.user_id;

                void onSaved().then(() => {
                  navigate(`${PageURLS.classes}?for=${attendeeId}`);
                });
              }}
            >
              {t('family:wizard.bookClass', { name })}
            </Button>
            <Button color='primary' variant='outlined' type='button' onClick={() => void onSaved()}>
              {t('common:close')}
            </Button>
          </div>
        </div>
      </ActionModal>
    );
  }

  return (
    <ActionModal
      closeOnClickOutside={false}
      backCard
      lineOnTop
      icon={LuUser}
      isOpen
      onClose={onClose}
      className='w-dvw max-w-[100dvw] overflow-x-clip rounded-none p-0 sm:w-[96dvw] sm:max-w-[96dvw] sm:rounded-xl xl:max-w-7xl'
    >
      <section className='m-auto h-auto w-dvw max-w-[100dvw] overflow-x-clip border-0 bg-transparent p-0 shadow-none sm:w-[96dvw] sm:max-w-[96dvw] xl:max-w-7xl'>
        <FormStepperLayout
          className={cn(
            'm-auto min-w-0 overflow-x-clip overflow-y-auto rounded-none sm:rounded-xl',
            'h-dvh max-h-dvh w-full max-w-full md:h-[80dvh] sm:max-h-[96dvh]',
          )}
          steps={steps}
          currentStep={step}
        />
      </section>
    </ActionModal>
  );
}
