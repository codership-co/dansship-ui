import { Button } from 'polpo/components';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { formatDateTime } from '@helpers';

import type { WindowTermsVersion } from '@core/api';

interface WindowTermsHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotionName: string;
  loadVersions: () => Promise<Array<WindowTermsVersion>>;
}

/** Every saved version of a promotion's terms, newest first. Past versions stay readable. */
export function WindowTermsHistoryDialog({
  open,
  onOpenChange,
  promotionName,
  loadVersions,
}: WindowTermsHistoryDialogProps) {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<Array<WindowTermsVersion> | null>(null);
  // The loader is a fresh closure on every render; only opening the dialog may reload.
  const loadRef = useRef(loadVersions);

  useEffect(() => {
    loadRef.current = loadVersions;
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    setVersions(null);
    void loadRef.current().then(rows => {
      if (!cancelled) {
        setVersions(rows);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{t('admin:inventory.promotionsPanel.terms.historyTitle')}</DialogTitle>
          <DialogDescription>{promotionName}</DialogDescription>
        </DialogHeader>
        <div className='grid max-h-96 gap-4 overflow-y-auto'>
          {versions === null ? <SpinnerLoader /> : null}
          {versions !== null && versions.length === 0 ? (
            <p className='m-0 text-sm text-gray-500'>{t('admin:inventory.promotionsPanel.terms.historyEmpty')}</p>
          ) : null}
          {(versions ?? []).map(version => (
            <section key={version.id} className='grid gap-1 rounded-lg border border-gray-200 p-3'>
              <p className='m-0 text-sm font-semibold text-gray-900'>
                {t('admin:inventory.promotionsPanel.terms.historyEntry', {
                  version: version.version,
                  date: formatDateTime(version.created_at, 'es'),
                })}
              </p>
              {version.created_by_name ? (
                <p className='m-0 text-xs text-gray-500'>
                  {t('admin:inventory.promotionsPanel.terms.historyAuthor', {
                    author: version.created_by_name,
                  })}
                </p>
              ) : null}
              {version.file_url ? (
                <a
                  href={version.file_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-fit text-sm text-info underline'
                >
                  {t('admin:inventory.promotionsPanel.terms.viewVersion')}
                </a>
              ) : (
                <p className='m-0 text-sm text-gray-500'>{t('admin:inventory.promotionsPanel.terms.noFileVersion')}</p>
              )}
            </section>
          ))}
        </div>
        <DialogFooter>
          <Button type='button' color='primary' variant='solid' onClick={() => onOpenChange(false)}>
            {t('admin:inventory.promotionsPanel.terms.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
