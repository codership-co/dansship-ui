import { Zip, ZipPassThrough } from 'fflate';
import { Button } from 'polpo/components';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuDownload } from 'react-icons/lu';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui';
import { DansshipAPI, type ParticipantTypeAdmin } from '@core/api';
import { saveBlobAs } from '@core/api/common/download-csv';
import { usePromise } from '@hooks';

const BY_PERSON = '__person';

interface FieldOption {
  key: string;
  label: string;
}

/** The file fields (and short-text fields to name the files by) across the event's types. */
export function answerFileFields(types: Array<ParticipantTypeAdmin>) {
  const files = new Map<string, FieldOption>();
  const names = new Map<string, FieldOption>();

  types.forEach(type =>
    type.fields.forEach(field => {
      if (field.kind === 'file' && !files.has(field.key)) files.set(field.key, { key: field.key, label: field.label });

      if (field.kind === 'short_text' && !names.has(field.key))
        names.set(field.key, { key: field.key, label: field.label });
    }),
  );

  return { files: [...files.values()], names: [...names.values()] };
}

/**
 * Zips the files as they arrive (stored, no compression: audio and images are already compressed), keeping
 * only the zip's chunks in memory instead of every file plus a full copy.
 */
async function zipFiles(
  items: Array<{ download_name: string; view_url: string }>,
  onProgress: (done: number) => void,
): Promise<Blob> {
  const parts: Array<Uint8Array<ArrayBuffer>> = [];
  let finished: () => void = () => undefined;
  let failed: (error: unknown) => void = () => undefined;
  const done = new Promise<void>((resolve, reject) => {
    finished = resolve;
    failed = reject;
  });
  const zip = new Zip((error, chunk, final) => {
    if (error) {
      failed(error);

      return;
    }

    parts.push(chunk as Uint8Array<ArrayBuffer>);

    if (final) finished();
  });

  for (const [index, item] of items.entries()) {
    const fetched = await fetch(item.view_url);

    if (!fetched.ok) throw new Error(`download ${fetched.status}`);

    const entry = new ZipPassThrough(item.download_name);

    zip.add(entry);
    entry.push(new Uint8Array(await fetched.arrayBuffer()), true);
    onProgress(index + 1);
  }

  zip.end();
  await done;

  return new Blob(parts, { type: 'application/zip' });
}

/**
 * «Descargar archivos» in Inscritos: every uploaded file of one question in a .zip, named
 * "01 - <act name>.mp3". The zip is built here, in the browser, from short-lived links.
 */
export function DownloadAnswerFiles({ eventId, eventSlug }: { eventId: string; eventSlug: string }) {
  const { t } = useTranslation();
  const { response } = usePromise(() => DansshipAPI.participationAdmin.listTypes(eventId), true, [eventId]);
  const { files, names } = useMemo(() => answerFileFields(response?.ok ? response.data : []), [response]);
  const [open, setOpen] = useState(false);
  const [fieldKey, setFieldKey] = useState('');
  const [nameKey, setNameKey] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  if (files.length === 0) return null;

  const chosen = fieldKey || files[0].key;
  // Named by presentation by default: the first short answer (e.g. the act name), else the person.
  const naming = nameKey || names[0]?.key || BY_PERSON;

  const download = async () => {
    const listed = await DansshipAPI.participationAdmin.listAnswerFiles(
      eventId,
      chosen,
      naming === BY_PERSON ? null : naming,
    );

    if (!listed.ok) {
      toast.error(t('eventos:participation.files.failed'));

      return;
    }

    const items = listed.data.items;

    if (items.length === 0) {
      toast.info(t('eventos:participation.files.empty'));

      return;
    }

    setProgress({ done: 0, total: items.length });

    try {
      const zipped = await zipFiles(items, done => setProgress({ done, total: items.length }));

      saveBlobAs(zipped, `${chosen}-${eventSlug}.zip`);
      setOpen(false);
    } catch {
      toast.error(t('eventos:participation.files.failed'));
    } finally {
      setProgress(null);
    }
  };

  return (
    <>
      <Button type='button' variant='outlined' color='primary' onClick={() => setOpen(true)}>
        <LuDownload className='size-4' aria-hidden />
        {t('eventos:participation.files.button')}
      </Button>
      <Dialog open={open} onOpenChange={next => !progress && setOpen(next)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('eventos:participation.files.title')}</DialogTitle>
            <DialogDescription>{t('eventos:participation.files.hint')}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4'>
            {files.length > 1 ? (
              <div className='grid gap-2'>
                <Label htmlFor='download-files-field'>{t('eventos:participation.files.field')}</Label>
                <Select value={chosen} onValueChange={setFieldKey}>
                  <SelectTrigger id='download-files-field' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {files.map(option => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className='grid gap-2'>
              <Label htmlFor='download-files-name'>{t('eventos:participation.files.nameBy')}</Label>
              <Select value={naming} onValueChange={setNameKey}>
                <SelectTrigger id='download-files-name' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BY_PERSON}>{t('eventos:participation.files.byPerson')}</SelectItem>
                  {names.map(option => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {progress ? (
              <p className='m-0 text-sm text-muted-foreground' role='status'>
                {t('eventos:participation.files.progress', { done: progress.done, total: progress.total })}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outlined'
              color='primary'
              disabled={Boolean(progress)}
              onClick={() => setOpen(false)}
            >
              {t('eventos:participation.files.cancel')}
            </Button>
            <Button
              type='button'
              variant='solid'
              color='primary'
              isLoading={Boolean(progress)}
              onClick={() => void download()}
            >
              {t('eventos:participation.files.download')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
