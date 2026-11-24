import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EditorField, InfoTooltip, SwitchRow } from '../editor-field';
import { ADMIN_CARD } from '../event-admin-styles';

import { EMAIL_NOTICE_LABELS } from './registries';
import { EXTRA_MESSAGE_LIMIT } from './schema';
import { type TypeEditorSectionProps } from './section-props';

import { Card, CardContent, CardHeader, CardTitle, Switch, Textarea } from '@components/ui';

/** Correos: one switch per notice the API says this configuration can send, plus an extra message. */
export function EmailsSection({ form, type }: TypeEditorSectionProps) {
  const { t } = useTranslation();
  const enabled = useWatch({ control: form.control, name: 'email_enabled' });
  const notices = type.available_notices ?? [];

  return (
    <Card className={ADMIN_CARD}>
      <CardHeader className='flex flex-row items-center gap-1'>
        <CardTitle>{t('eventos:participation.editor.emails')}</CardTitle>
        <InfoTooltip content={t('eventos:participation.editor.emailsTooltip')} />
      </CardHeader>
      <CardContent className='grid gap-4'>
        {notices.length === 0 ? (
          <p className='m-0 text-sm text-muted-foreground'>{t('eventos:participation.editor.noNotices')}</p>
        ) : null}
        {notices.map(kind => {
          const label = EMAIL_NOTICE_LABELS[kind];

          if (!label) return null;

          return (
            <SwitchRow key={kind} label={t(label.labelKey)} tooltip={t(label.tooltipKey)}>
              <Switch
                aria-label={t(label.labelKey)}
                checked={enabled.includes(kind)}
                onCheckedChange={value =>
                  form.setValue('email_enabled', value ? [...enabled, kind] : enabled.filter(item => item !== kind), {
                    shouldDirty: true,
                  })
                }
              />
            </SwitchRow>
          );
        })}
        <EditorField
          label={t('eventos:participation.editor.extraMessage')}
          optional
          htmlFor='email-extra'
          tooltip={t('eventos:participation.editor.extraMessageTooltip')}
          error={form.formState.errors.email_extra_message?.message}
        >
          <Textarea
            id='email-extra'
            rows={3}
            maxLength={EXTRA_MESSAGE_LIMIT}
            placeholder={t('eventos:participation.editor.extraMessagePlaceholder')}
            {...form.register('email_extra_message')}
          />
        </EditorField>
      </CardContent>
    </Card>
  );
}
