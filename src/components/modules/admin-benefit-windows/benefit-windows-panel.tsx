import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import {
  Button,
  Input,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { useBenefitWindows } from '@hooks';

interface DateDraft {
  starts_on: string;
  ends_on: string;
}

export function BenefitWindowsPanel() {
  const { t } = useTranslation();
  const { windows, isLoading, isSaving, updateWindow } = useBenefitWindows();
  const [drafts, setDrafts] = useState<Record<string, DateDraft>>({});

  useEffect(() => {
    setDrafts(previous => {
      const next = { ...previous };

      for (const window of windows) {
        if (!next[window.id]) {
          next[window.id] = {
            starts_on: window.starts_on ?? '',
            ends_on: window.ends_on ?? '',
          };
        }
      }

      return next;
    });
  }, [windows]);

  const saveDates = async (id: string) => {
    const draft = drafts[id] ?? { starts_on: '', ends_on: '' };

    if (draft.starts_on && draft.ends_on && draft.starts_on > draft.ends_on) {
      toast.error(t('admin:inventory.promotionsPanel.invalidRange'));

      return;
    }

    const ok = await updateWindow(id, {
      starts_on: draft.starts_on || null,
      ends_on: draft.ends_on || null,
    });

    if (ok) {
      setDrafts(previous => ({
        ...previous,
        [id]: draft,
      }));
    }
  };

  if (isLoading && windows.length === 0) {
    return <SpinnerLoader />;
  }

  if (windows.length === 0) {
    return <p className='text-sm text-gray-500'>{t('admin:inventory.promotionsPanel.empty')}</p>;
  }

  return (
    <div className='space-y-3'>
      <p className='text-sm text-gray-500'>{t('admin:inventory.promotionsPanel.optionalHint')}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:inventory.promotionsPanel.name')}</TableHead>
            <TableHead>{t('admin:inventory.promotionsPanel.active')}</TableHead>
            <TableHead>{t('admin:inventory.promotionsPanel.from')}</TableHead>
            <TableHead>{t('admin:inventory.promotionsPanel.until')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {windows.map(window => {
            const draft = drafts[window.id] ?? {
              starts_on: window.starts_on ?? '',
              ends_on: window.ends_on ?? '',
            };

            return (
              <TableRow key={window.id}>
                <TableCell>
                  <div className='font-medium text-gray-900'>{window.name}</div>
                  <div className='text-xs text-gray-500'>{window.code}</div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={window.is_active}
                      disabled={isSaving}
                      aria-label={window.name}
                      onCheckedChange={checked => {
                        void updateWindow(window.id, { is_active: checked });
                      }}
                    />
                    <Label className='text-sm text-gray-600'>
                      {window.is_active ? t('common:active') : t('common:inactive')}
                    </Label>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type='date'
                    value={draft.starts_on}
                    aria-label={t('admin:inventory.promotionsPanel.from')}
                    onChange={event =>
                      setDrafts(previous => ({
                        ...previous,
                        [window.id]: { ...draft, starts_on: event.target.value },
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type='date'
                    value={draft.ends_on}
                    aria-label={t('admin:inventory.promotionsPanel.until')}
                    onChange={event =>
                      setDrafts(previous => ({
                        ...previous,
                        [window.id]: { ...draft, ends_on: event.target.value },
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button type='button' disabled={isSaving} onClick={() => void saveDates(window.id)}>
                    {t('admin:inventory.promotionsPanel.save')}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
