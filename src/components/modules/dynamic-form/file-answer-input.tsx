import { createContext, useContext, useState } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { FieldError, FieldHint, type AnswerInputProps } from './answer-parts';
import { acceptedFileTypes, isFileAnswer, type FileFormAnswer, type FormItem } from './form-items';

import { OptionalFileUpload } from '@components/forms';
import { Input, Label, Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { participationErrorMessage } from '@core/api';

/**
 * How a file question uploads its file. The page that hosts the form provides it: the person's signup uses
 * their upload route, "+ Inscribir persona" the admin's. Without a provider (the admin preview) the file
 * picker is off.
 */
export interface AnswerFileUploader {
  /** Uploads the file for this question and resolves with the answer to send. */
  upload: (item: FormItem, file: File) => Promise<FileFormAnswer>;
}

const AnswerFileUploaderContext = createContext<AnswerFileUploader | null>(null);

export const AnswerFileUploaderProvider = AnswerFileUploaderContext.Provider;

export function useAnswerFileUploader(): AnswerFileUploader | null {
  return useContext(AnswerFileUploaderContext);
}

/** "Puedes cambiarlo hasta el jueves 11 de diciembre, 11:59 p. m." in Bogotá time. */
export function formatReplaceUntil(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date(iso));
}

type FileOrLinkValue = FileFormAnswer | { url?: string; note?: string | null } | null | undefined;

interface FileOrLinkControlProps {
  item: FormItem;
  value: FileOrLinkValue;
  onChange: (value: FileOrLinkValue) => void;
  error?: string;
  /** Overrides the context uploader (the replace dialog uploads with its own route). */
  uploader?: AnswerFileUploader | null;
}

/** «Archivo o enlace»: the file picker, and a link tab when the question allows it. */
export function FileOrLinkControl({ item, value, onChange, error, uploader }: FileOrLinkControlProps) {
  const { t } = useTranslation();
  const contextUploader = useAnswerFileUploader();
  const active = uploader === undefined ? contextUploader : uploader;
  const allowLink = Boolean(item.options.allow_link);
  const hasLink = !isFileAnswer(value) && Boolean((value as { url?: string } | null)?.url);
  const [tab, setTab] = useState<'file' | 'link'>(allowLink && hasLink ? 'link' : 'file');
  const [uploading, setUploading] = useState(false);
  const note = (value as { note?: string | null } | null)?.note ?? '';
  const file = isFileAnswer(value) ? value : null;
  const types = acceptedFileTypes(item);

  const pick = async (picked: File | null) => {
    if (!picked) {
      onChange({ url: '', note });

      return;
    }

    if (!active) return;

    setUploading(true);

    try {
      const uploaded = await active.upload(item, picked);

      onChange({ ...uploaded, note: note || null });
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error && uploadError.message === 'too_large'
          ? t('forms:answer.file.tooLarge')
          : participationErrorMessage(uploadError, t, 'forms:answer.file.uploadFailed'),
      );
    } finally {
      setUploading(false);
    }
  };

  const setNote = (next: string) => {
    onChange(file ? { ...file, note: next } : { url: (value as { url?: string } | null)?.url ?? '', note: next });
  };

  const filePanel = (
    <div className='grid gap-2'>
      <OptionalFileUpload
        acceptedTypes={types}
        isUploading={uploading}
        disabled={!active}
        showPreview={false}
        label={t('forms:answer.file.upload')}
        helperText={
          active ? t('forms:answer.file.accepts', { types: acceptedLabel(item, t) }) : t('forms:answer.file.previewOff')
        }
        invalidTypeMessage={t('forms:answer.file.invalidType', { types: acceptedLabel(item, t) })}
        onChange={picked => void pick(picked)}
      />
      {file ? (
        <p className='m-0 text-sm'>
          {t('forms:answer.file.current')} <strong className='break-all'>{file.file_name}</strong>
        </p>
      ) : null}
    </div>
  );

  return (
    <div className='grid gap-2'>
      <Label htmlFor={`answer-${item.key}`}>{item.label}</Label>
      <FieldHint>{item.help_text}</FieldHint>
      {allowLink ? (
        <Tabs value={tab} onValueChange={next => setTab(next as 'file' | 'link')}>
          <TabsList>
            <TabsTrigger value='file'>{t('forms:answer.file.tabFile')}</TabsTrigger>
            <TabsTrigger value='link'>{t('forms:answer.file.tabLink')}</TabsTrigger>
          </TabsList>
          <TabsContent value='file'>{filePanel}</TabsContent>
          <TabsContent value='link'>
            <Input
              id={`answer-${item.key}`}
              type='url'
              placeholder='https://'
              maxLength={500}
              value={file ? '' : ((value as { url?: string } | null)?.url ?? '')}
              onChange={change => onChange({ url: change.target.value, note })}
            />
          </TabsContent>
        </Tabs>
      ) : (
        filePanel
      )}
      {item.options.with_note ? (
        <div className='grid gap-1'>
          <Label htmlFor={`answer-${item.key}-note`}>{t('forms:answer.linkNote')}</Label>
          <Input
            id={`answer-${item.key}-note`}
            maxLength={300}
            value={note}
            onChange={change => setNote(change.target.value)}
          />
        </div>
      ) : null}
      {item.replace_closes_at ? (
        <FieldHint>
          {t('forms:answer.file.replaceUntil', { date: formatReplaceUntil(item.replace_closes_at) })}
        </FieldHint>
      ) : null}
      <FieldError message={error} />
    </div>
  );
}

function acceptedLabel(item: FormItem, t: (key: string) => string): string {
  return (item.options.accepts ?? []).map(category => t(`forms:answer.file.category.${category}`)).join(', ');
}

export function FileOrLinkInput<T extends FieldValues>({ control, name, item }: AnswerInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: input, fieldState }) => (
        <FileOrLinkControl
          item={item}
          value={input.value}
          onChange={input.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
