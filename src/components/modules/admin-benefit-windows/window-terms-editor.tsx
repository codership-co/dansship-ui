import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { WindowTermsHistoryDialog } from './window-terms-history-dialog';

import { OptionalFileUpload } from '@components/forms/optional-file-upload';
import { Badge } from '@components/ui';
import { formatDateTime } from '@helpers';

import type { PromotionWindowTerms, WindowTermsVersion } from '@core/api';

const PDF_CONTENT_TYPE = 'application/pdf';
const ACCEPTED_TYPES = [PDF_CONTENT_TYPE];

interface WindowTermsEditorProps {
  /** Shown as the terms title: the promotion's own name. */
  promotionName: string;
  entry: PromotionWindowTerms;
  isSaving: boolean;
  /** A null file saves "no terms". */
  onSave: (title: string, file: File | null) => Promise<boolean>;
  loadVersions: () => Promise<Array<WindowTermsVersion>>;
}

/** Terms PDF of one promotion. Every save creates a new version; the server audits it. */
export function WindowTermsEditor({ promotionName, entry, isSaving, onSave, loadVersions }: WindowTermsEditorProps) {
  const { t } = useTranslation();
  const current = entry.current;
  const [file, setFile] = useState<File | null>(null);
  const [isHistoryOpen, setHistoryOpen] = useState(false);

  const save = async (nextFile: File | null) => {
    if (await onSave(promotionName, nextFile)) {
      setFile(null);
    }
  };

  const hint = current
    ? t(
        current.created_by_name
          ? 'admin:inventory.promotionsPanel.terms.hintSaved'
          : 'admin:inventory.promotionsPanel.terms.hintSavedNoAuthor',
        {
          version: current.version,
          next: current.version + 1,
          date: formatDateTime(current.created_at, 'es'),
          author: current.created_by_name,
        },
      )
    : t('admin:inventory.promotionsPanel.terms.hintEmpty');

  return (
    <div className='grid gap-2 rounded-xl border border-secondary-200 bg-secondary-100 p-3.5'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='m-0 text-sm font-semibold text-gray-900'>{t('admin:inventory.promotionsPanel.terms.title')}</p>
        <Badge variant='outlineNeutral' size='small'>
          {current
            ? t('admin:inventory.promotionsPanel.terms.version', {
                version: current.version,
              })
            : t('admin:inventory.promotionsPanel.terms.noVersion')}
        </Badge>
      </div>
      {current?.file_url ? (
        <a
          href={current.file_url}
          target='_blank'
          rel='noopener noreferrer'
          className='w-fit text-sm text-info underline'
        >
          {t('admin:inventory.promotionsPanel.terms.viewCurrent')}
        </a>
      ) : null}
      <OptionalFileUpload
        value={file}
        acceptedTypes={ACCEPTED_TYPES}
        showPreview={false}
        isUploading={isSaving}
        label={t('admin:inventory.promotionsPanel.terms.chooseFile')}
        helperText={t('admin:inventory.promotionsPanel.terms.fileHint')}
        invalidTypeMessage={t('admin:inventory.promotionsPanel.terms.invalidType')}
        onChange={nextFile => setFile(nextFile)}
      />
      <small className='text-xs text-gray-500'>{hint}</small>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            variant='flat'
            color='secondary'
            disabled={!current}
            onClick={() => setHistoryOpen(true)}
          >
            {t('admin:inventory.promotionsPanel.terms.history')}
          </Button>
          {current?.file_url ? (
            <Button type='button' variant='flat' color='secondary' disabled={isSaving} onClick={() => void save(null)}>
              {t('admin:inventory.promotionsPanel.terms.remove')}
            </Button>
          ) : null}
        </div>
        <Button
          type='button'
          color='primary'
          variant='solid'
          disabled={isSaving || file === null}
          onClick={() => void save(file)}
        >
          {t('admin:inventory.promotionsPanel.terms.save')}
        </Button>
      </div>
      <WindowTermsHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setHistoryOpen}
        promotionName={promotionName}
        loadVersions={loadVersions}
      />
    </div>
  );
}
