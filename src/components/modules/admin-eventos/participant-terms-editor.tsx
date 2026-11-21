import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { OptionalFileUpload } from '@components/forms/optional-file-upload';
import { WindowTermsHistoryDialog } from '@components/modules/admin-benefit-windows/window-terms-history-dialog';
import { Badge } from '@components/ui';
import { DansshipAPI, participationErrorMessage, type ParticipantTermsVersion } from '@core/api';
import { formatDateTime } from '@helpers';

const ACCEPTED_TYPES = ['application/pdf'];

interface ParticipantTermsEditorProps {
  eventId: string;
  typeId: string;
  typeName: string;
  current: ParticipantTermsVersion | null;
  onSaved: (version: ParticipantTermsVersion) => void;
}

/**
 * Terms PDF of one participant type. Same pattern as the Black Friday promotion terms:
 * every save creates a new version, earlier versions stay readable, the server audits it.
 */
export function ParticipantTermsEditor({ eventId, typeId, typeName, current, onSaved }: ParticipantTermsEditorProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(false);

  const save = async (nextFile: File | null) => {
    setSaving(true);
    try {
      const fileKey = nextFile ? await DansshipAPI.participationAdmin.uploadTermsPdf(eventId, typeId, nextFile) : null;

      if (nextFile && !fileKey) {
        toast.error(t('eventos:participation.terms.uploadFailed'));

        return;
      }

      const { ok, data, error } = await DansshipAPI.participationAdmin.saveTerms(eventId, typeId, {
        title: t('eventos:participation.terms.documentTitle', { name: typeName }),
        file_key: fileKey,
      });

      if (!ok || !data) {
        toast.error(participationErrorMessage(error, t, 'eventos:participation.terms.saveFailed'));

        return;
      }

      setFile(null);
      onSaved(data);
      toast.success(t('eventos:participation.terms.saved', { version: data.version }));
    } finally {
      setSaving(false);
    }
  };

  const loadVersions = async () => {
    const { data } = await DansshipAPI.participationAdmin.listTerms(eventId, typeId);

    return (data ?? []).map(version => ({ ...version, created_by_name: version.created_by_name ?? null }));
  };

  return (
    <div className='grid gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='m-0 text-sm text-muted-foreground'>{t('eventos:participation.terms.hint')}</p>
        <Badge variant='outlineNeutral' size='small'>
          {current?.file_url
            ? t('eventos:participation.terms.version', { version: current.version })
            : t('eventos:participation.terms.none')}
        </Badge>
      </div>
      {current?.file_url ? (
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
        label={t('eventos:participation.terms.chooseFile')}
        helperText={t('eventos:participation.terms.fileHint')}
        invalidTypeMessage={t('eventos:participation.terms.invalidType')}
        onChange={nextFile => setFile(nextFile)}
      />
      {current ? (
        <small className='text-xs text-muted-foreground'>
          {t('eventos:participation.terms.savedHint', {
            version: current.version,
            next: current.version + 1,
            date: formatDateTime(current.created_at, 'es'),
          })}
        </small>
      ) : null}
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='flat'
            color='secondary'
            disabled={!current}
            onClick={() => setHistoryOpen(true)}
          >
            {t('eventos:participation.terms.history')}
          </Button>
          {current?.file_url ? (
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
        promotionName={typeName}
        loadVersions={loadVersions}
      />
    </div>
  );
}
