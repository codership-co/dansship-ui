import { Button } from 'polpo/components';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuX } from 'react-icons/lu';

import { EditorField, EditorSelect } from '../editor-field';
import { ADMIN_CARD } from '../event-admin-styles';

import { PaymentPlanEditor } from './payment-plan-editor';
import { PRICING_MODEL_COMPONENTS } from './pricing-editors';
import { PRICING_MODEL_EDITORS, PRICING_MODEL_KINDS, REGISTRATION_OPTION_EDITORS } from './registries';
import { type TypeEditorSectionProps } from './section-props';

import { Badge, Card, CardContent, CardHeader, CardTitle, Input } from '@components/ui';
import { chargesMoney, takesDonations, type ParticipantContributionModel } from '@core/api';

const CONTRIBUTION_MODELS: Array<ParticipantContributionModel> = ['free', 'money', 'in_kind', 'money_and_in_kind'];

/** Aporte y precio: contribution, pricing model (registry), condition subject, payment plan and donations. */
export function ContributionSection(props: TypeEditorSectionProps) {
  const { form } = props;
  const { t } = useTranslation();
  const { control } = form;
  const [model, pricingModel, options] = useWatch({
    control,
    name: ['contribution_model', 'pricing_model', 'registration_options'],
  });
  const money = chargesMoney(model);
  const PricingEditor = PRICING_MODEL_COMPONENTS[pricingModel];
  const needsPackages = options.some(option => REGISTRATION_OPTION_EDITORS[option.kind].needsPackages);

  return (
    <Card className={ADMIN_CARD}>
      <CardHeader>
        <CardTitle>{t('eventos:participation.editor.contribution')}</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-5'>
        <div className='grid gap-5 md:grid-cols-2'>
          <EditorSelect
            control={control}
            name='contribution_model'
            label={t('eventos:participation.editor.contributionModel')}
            required
            tooltip={t('eventos:participation.editor.contributionTooltip')}
            options={CONTRIBUTION_MODELS.map(value => ({
              value,
              label: t(`eventos:participation.contributionModels.${value}`),
            }))}
          />
        </div>

        {money ? (
          <>
            <div className='grid gap-5 md:grid-cols-2'>
              <EditorSelect
                control={control}
                name='pricing_model'
                label={t('eventos:participation.editor.pricingModel')}
                required
                tooltip={t('eventos:participation.editor.pricingModelTooltip')}
                disabled={needsPackages}
                options={PRICING_MODEL_KINDS.map(value => ({ value, label: t(PRICING_MODEL_EDITORS[value].labelKey) }))}
              />
              <EditorSelect
                control={control}
                name='condition_subject'
                label={t('eventos:participation.editor.conditionSubject')}
                required
                tooltip={t('eventos:participation.editor.conditionSubjectTooltip')}
                options={(['holder', 'each_person'] as const).map(value => ({
                  value,
                  label: t(`eventos:participation.conditionSubjects.${value}`),
                }))}
              />
            </div>
            <PricingEditor {...props} />
            <PaymentPlanEditor {...props} />
          </>
        ) : null}

        {takesDonations(model) ? <DonationTypesEditor {...props} /> : null}

        {model === 'free' ? (
          <p className='m-0 text-sm text-muted-foreground'>{t('eventos:participation.editor.freeHint')}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DonationTypesEditor({ form }: TypeEditorSectionProps) {
  const { t } = useTranslation();
  const donations = useWatch({ control: form.control, name: 'donation_types' });
  const [draft, setDraft] = useState('');

  const add = () => {
    const label = draft.trim();

    if (!label || donations.some(item => item.label === label)) return;

    form.setValue('donation_types', [...donations, { label }], { shouldDirty: true });
    setDraft('');
  };

  return (
    <EditorField
      label={t('eventos:participation.editor.donationTypes')}
      required
      htmlFor='donation-draft'
      tooltip={t('eventos:participation.editor.donationsHint')}
    >
      <div className='flex flex-wrap gap-2'>
        {donations.length === 0 ? (
          <p className='m-0 text-xs text-muted-foreground'>{t('eventos:participation.editor.noDonations')}</p>
        ) : null}
        {donations.map(item => (
          <Badge key={item.id ?? item.label} variant='outline' className='gap-1'>
            {item.label}
            <button
              type='button'
              className='grid size-5 place-items-center rounded-full text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary'
              aria-label={t('eventos:participation.editor.removeDonation', { label: item.label })}
              onClick={() =>
                form.setValue(
                  'donation_types',
                  donations.filter(donation => donation !== item),
                  { shouldDirty: true },
                )
              }
            >
              <LuX className='size-3' aria-hidden />
            </button>
          </Badge>
        ))}
      </div>
      <div className='flex gap-2'>
        <Input
          id='donation-draft'
          value={draft}
          maxLength={80}
          placeholder={t('eventos:participation.editor.donationPlaceholder')}
          onChange={change => setDraft(change.target.value)}
          onKeyDown={keyEvent => {
            if (keyEvent.key === 'Enter') {
              keyEvent.preventDefault();
              add();
            }
          }}
        />
        <Button type='button' variant='outlined' color='primary' onClick={add}>
          {t('eventos:participation.editor.addDonation')}
        </Button>
      </div>
    </EditorField>
  );
}
