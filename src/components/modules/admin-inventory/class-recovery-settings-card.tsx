import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@components/ui';
import { classRecoveryErrorKey, DansshipAPI } from '@core/api';
import { useCallablePromise, useClassRecoverySettings } from '@hooks';

const positiveDays = z.coerce.number().int().min(1).max(365);

const settingsSchema = z.object({
  recovery_window_days: positiveDays,
  recovery_grace_days: positiveDays,
  recovery_extension_days: positiveDays,
});

type SettingsFormInput = z.input<typeof settingsSchema>;
type SettingsFormValues = z.output<typeof settingsSchema>;

const FIELDS = [
  { name: 'recovery_window_days', label: 'windowDays', hint: 'windowHint' },
  { name: 'recovery_grace_days', label: 'graceDays', hint: 'graceHint' },
  { name: 'recovery_extension_days', label: 'extensionDays', hint: 'extensionHint' },
] as const;

/** The three global class recovery values (ADR-056), above the plans table. */
export function ClassRecoverySettingsCard() {
  const { t } = useTranslation();
  const { settings, reload } = useClassRecoverySettings();
  const { call: save, isLoading: isSaving } = useCallablePromise((values: SettingsFormValues) =>
    DansshipAPI.classRecoveryAdmin.updateSettings(values),
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (settings) {
      reset({
        recovery_window_days: settings.recovery_window_days,
        recovery_grace_days: settings.recovery_grace_days,
        recovery_extension_days: settings.recovery_extension_days,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (values: SettingsFormValues) => {
    const { ok, error } = await save(values);

    if (!ok) {
      toast.error(t(classRecoveryErrorKey(error)));

      return;
    }

    toast.success(t('recovery:admin.settings.saved'));
    void reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recovery:admin.settings.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className='grid gap-4' onSubmit={handleSubmit(onSubmit)}>
          <div className='grid gap-4 md:grid-cols-3'>
            {FIELDS.map(field => (
              <div key={field.name} className='space-y-2'>
                <Label htmlFor={field.name}>{t(`recovery:admin.settings.${field.label}`)}</Label>
                <Input id={field.name} type='number' min={1} step={1} {...register(field.name)} />
                <p className={errors[field.name] ? 'text-sm text-alert-500' : 'text-xs text-gray-500'}>
                  {errors[field.name]
                    ? t('errors:codes.CLASS_RECOVERY_SETTINGS_INVALID')
                    : t(`recovery:admin.settings.${field.hint}`)}
                </p>
              </div>
            ))}
          </div>
          <div className='flex justify-end'>
            <Button
              color='primary'
              variant='solid'
              size='small'
              type='submit'
              disabled={!settings || !isValid || isSaving}
            >
              {t('recovery:admin.settings.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
