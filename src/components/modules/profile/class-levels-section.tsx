import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { DansshipAPI, type ClassLevel, type StudentClassLevelItem } from '@core/api';
import { CLASS_LEVELS, classLevelLabelKey } from '@helpers';
import { useCallablePromise, usePromise } from '@hooks';

export function ClassLevelsSection() {
  const { t } = useTranslation();
  const { response, isLoading, error, reFetch } = usePromise(() => DansshipAPI.classLevels.listMine(), true, []);
  const { call: upsertPromise, isLoading: isSaving } = useCallablePromise(
    (classDefinitionId: string, level: ClassLevel) => DansshipAPI.classLevels.upsertMine(classDefinitionId, { level }),
  );
  const [pending, setPending] = useState<Record<string, ClassLevel | ''>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const items = response?.data?.items ?? [];
  const hasError = Boolean(error) || Boolean(response && !response.ok);

  const selectedLevel = (item: StudentClassLevelItem): ClassLevel | '' => {
    if (item.class_definition_id in pending) {
      return pending[item.class_definition_id];
    }

    return item.level ?? '';
  };

  const handleSave = async (item: StudentClassLevelItem) => {
    const level = selectedLevel(item);

    if (!level) {
      toast.error(t('profile:classLevels.selectRequired'));

      return;
    }

    setSavingId(item.class_definition_id);
    const result = await upsertPromise(item.class_definition_id, level);
    setSavingId(null);

    if (!result.ok) {
      toast.error(t('profile:classLevels.saveFailed'));

      return;
    }

    toast.success(t('profile:classLevels.saveSuccess'));
    setPending(current => {
      const next = { ...current };
      delete next[item.class_definition_id];

      return next;
    });
    await reFetch();
  };

  if (isLoading) {
    return <SpinnerLoader message={t('common:loading')} />;
  }

  if (hasError) {
    return <p className='m-0 text-sm text-gray-600'>{t('profile:classLevels.loadFailed')}</p>;
  }

  if (items.length === 0) {
    return <p className='m-0 text-sm text-gray-600'>{t('profile:classLevels.empty')}</p>;
  }

  return (
    <div className='grid gap-6'>
      <p className='m-0 text-sm text-gray-600'>{t('profile:classLevels.description')}</p>
      {items.map(item => {
        const value = selectedLevel(item);
        const isDirty = value !== '' && value !== (item.level ?? '');
        const isRowSaving = isSaving && savingId === item.class_definition_id;

        return (
          <div key={item.class_definition_id} className='grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end'>
            <div className='grid gap-2'>
              <Label>{item.class_type_name}</Label>
              <Select
                value={value || undefined}
                onValueChange={next => {
                  setPending(current => ({
                    ...current,
                    [item.class_definition_id]: next as ClassLevel,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('profile:classLevels.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>
                      {t(classLevelLabelKey(level) ?? level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type='button'
              disabled={isRowSaving || (!isDirty && Boolean(item.level))}
              onClick={() => {
                void handleSave(item);
              }}
            >
              {isRowSaving ? t('common:saving') : t('common:save')}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
