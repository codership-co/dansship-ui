import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { OptionalFileUpload } from '@components/forms/optional-file-upload';
import { WindowTermsHistoryDialog } from '@components/modules/admin-benefit-windows/window-terms-history-dialog';
import { Badge } from '@components/ui';
import { participationErrorMessage } from '@core/api';
import { formatDateTime } from '@helpers';
import { useEventTerms } from '@hooks';

const ACCEPTED_TYPES = ['application/pdf'];

interface EventTermsEditorProps {
  eventId: string;
  eventName: string;
}

/**
 * Terms PDF of the event: one document for every participant type. Every save is a new version
 * (earlier ones stay readable); with no PDF, the signup asks no checkbox.
 */
export function EventTermsEditor({ eventId, eventName }: EventTermsEditorProps) {
  const { t } = useTranslation();
  const { versions, current, hasTerms, isSaving, saveTerms } = useEventTerms(eventId);
  const [file, setFile] = useState<File | null>(null);
  const [isHistoryOpen, setHistoryOpen] = useState(false);

  const save = async (nextFile: File | null) => {
    const result = await saveTerms(t('eventos:participation.terms.documentTitle', { name: eventName }), nextFile);

    if (!result.ok) {
      toast.error(participationErrorMessage(result.error, t, 'eventos:participation.terms.saveFailed'));

      return;
    }

    setFile(null);
    toast.success(t('eventos:participation.terms.savedGeneric'));
  };

  return (
    <div className='grid gap-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='outlineNeutral' size='small'>
          {hasTerms && current
            ? t('eventos:participation.terms.version', { version: current.version })
            : t('eventos:participation.terms.none')}
        </Badge>
        {hasTerms && current ? (
          <small className='text-xs text-muted-foreground'>
            {t('eventos:participation.terms.uploadedOn', { date: formatDateTime(current.created_at, 'es') })}
          </small>
        ) : null}
      </div>
      {hasTerms && current?.file_url ? (
        <a
          href={current.file_url}
          target='_blank'
          rel='noopener noreferrer'
          className='w-fit text-sm text-info underline'
        >
          {t('eventos:participation.terms.viewCurrent')}
        </a>
      ) : null}
      <OptionalFileUpload
        value={file}
        acceptedTypes={ACCEPTED_TYPES}
        showPreview={false}
        isUploading={isSaving}
        label={
          hasTerms ? t('eventos:participation.terms.chooseNewVersion') : t('eventos:participation.terms.chooseFile')
        }
        helperText={t('eventos:participation.terms.fileHint')}
        invalidTypeMessage={t('eventos:participation.terms.invalidType')}
        onChange={nextFile => setFile(nextFile)}
      />
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='flat'
            color='secondary'
            disabled={versions.length === 0}
            onClick={() => setHistoryOpen(true)}
          >
            {t('eventos:participation.terms.history')}
          </Button>
          {hasTerms ? (
            <Button type='button' variant='flat' color='secondary' disabled={isSaving} onClick={() => void save(null)}>
              {t('eventos:participation.terms.remove')}
            </Button>
          ) : null}
        </div>
        <Button
          type='button'
          variant='outlined'
          color='primary'
          disabled={isSaving || file === null}
          onClick={() => void save(file)}
        >
          {t('eventos:participation.terms.save')}
        </Button>
      </div>
      <WindowTermsHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setHistoryOpen}
        promotionName={eventName}
        loadVersions={async () =>
          versions.map(version => ({ ...version, created_by_name: version.created_by_name ?? null }))
        }
      />
    </div>
  );
}
