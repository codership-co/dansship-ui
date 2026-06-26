import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import {
  Card,
  Switch,
  Label,
  Input,
  Button,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@components/ui';
import { DansshipAPI, type UpdateNotificationConfigPayload } from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

export function NotificationSettings() {
  const { t } = useTranslation();

  const { response: configs, isLoading } = usePromise(() => DansshipAPI.notificationsAdmin.getConfigs());

  const { call: updateConfigPromise } = useCallablePromise((type: string, payload: UpdateNotificationConfigPayload) =>
    DansshipAPI.notificationsAdmin.updateConfig(type, payload),
  );

  const updateConfig = useCallback(
    async (type: string, payload: UpdateNotificationConfigPayload) => {
      const { ok } = await updateConfigPromise(type, payload);

      if (ok) {
        toast.success(t('notifications:configUpdated'));
      } else {
        toast.error(t('notifications.configUpdateFailed'));
      }
    },
    [t, updateConfigPromise],
  );

  // Track local edits before saving
  const [editingType, setEditingType] = useState<string | null>(null);
  const [leadTime, setLeadTime] = useState<number>(0);

  const handleToggle = async (type: string, nextStatus: boolean) => {
    await updateConfig(type, { is_enabled: nextStatus, enabled: nextStatus });
  };

  const startEditing = (type: string, currentLead: number | undefined) => {
    setEditingType(type);
    setLeadTime(currentLead || 0);
  };

  const saveLeadTime = async () => {
    if (!editingType) return;

    await updateConfig(editingType, { lead_time_minutes: leadTime });
    setEditingType(null);
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <Card className='border-gray-200 shadow-sm'>
      <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
        <CardTitle className='text-lg text-gray-800'>{t('notifications:settingsTitle')}</CardTitle>

        <CardDescription>{t('notifications:settingsDesc')}</CardDescription>
      </CardHeader>

      <CardContent className='pt-6'>
        <div className='space-y-6'>
          {configs?.data?.map(config =>
            (() => {
              const isEnabled = config.is_enabled ?? config.enabled ?? false;

              return (
                <div
                  key={config.type}
                  className='flex flex-col justify-between gap-4 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center'
                >
                  <div className='flex-1'>
                    <Label className='text-base font-semibold capitalize text-gray-900'>
                      {config.type.replace(/_/g, ' ')}
                    </Label>

                    <p className='mt-1 text-sm text-gray-500'>{config.description}</p>

                    {config.lead_time_minutes !== undefined && (
                      <div className='mt-3 flex items-center gap-2'>
                        <span className='text-sm text-gray-600'>{t('notifications:leadTime')}</span>

                        {editingType === config.type ? (
                          <div className='flex items-center gap-2'>
                            <Input
                              type='number'
                              className='h-8 w-24'
                              value={leadTime}
                              onChange={e => setLeadTime(Number(e.target.value))}
                            />

                            <span className='text-sm text-gray-500'>{t('common:minutes')}</span>

                            <Button size='sm' variant='secondary' onClick={saveLeadTime} className='h-8'>
                              {t('common:save')}
                            </Button>

                            <Button size='sm' variant='ghost' onClick={() => setEditingType(null)} className='h-8'>
                              {t('common:cancel')}
                            </Button>
                          </div>
                        ) : (
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-gray-900'>
                              {config.lead_time_minutes} {t('common:minutes')}
                            </span>

                            <Button
                              size='sm'
                              variant='link'
                              onClick={() => startEditing(config.type, config.lead_time_minutes)}
                              className='h-6 px-2 text-purple-600'
                            >
                              {t('common:edit')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className='shrink-0 flex items-center space-x-2'>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={checked => handleToggle(config.type, checked)}
                      id={`switch-${config.type}`}
                    />

                    <Label htmlFor={`switch-${config.type}`} className='cursor-pointer'>
                      {isEnabled ? t('common:enabled') : t('common:disabled')}
                    </Label>
                  </div>
                </div>
              );
            })(),
          )}

          {!configs?.data ||
            (configs?.data?.length === 0 && (
              <div className='py-8 text-center text-gray-500'>{t('notifications:noConfigsFound')}</div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
