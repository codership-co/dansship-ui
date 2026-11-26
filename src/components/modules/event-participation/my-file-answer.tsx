import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { FileOrLinkControl, formatReplaceUntil, isFileAnswer, type FormItem } from '@components/modules/dynamic-form';
import {
  answerText,
  DansshipAPI,
  participationErrorMessage,
  type SignupAnswerView,
  type SignupAnswerValue,
} from '@core/api';

interface MyFileAnswerProps {
  signupId: string;
  participantTypeId: string;
  answer: SignupAnswerView;
}

/**
 * A file answer in "Tu inscripción": the file (listen or open it) and, while its window is open,
 * «Cambiar archivo» even after the signup closed.
 */
export function MyFileAnswer({ signupId, participantTypeId, answer }: MyFileAnswerProps) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(answer);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [field, setField] = useState<FormItem | null>(null);
  const [draft, setDraft] = useState<SignupAnswerValue>(null);
  const [saving, setSaving] = useState(false);
  const file = isFileAnswer(current.value) ? current.value : null;
  const isAudio = Boolean(file?.content_type.startsWith('audio/'));
  const uploader = {
    upload: (item: FormItem, picked: File) =>
      DansshipAPI.participation.uploadAnswerFile(participantTypeId, item.key, picked),
  };

  const open = async () => {
    const response = await DansshipAPI.participation.getMyAnswerFile(signupId, current.key);

    if (!response.ok) {
      toast.error(t('eventos:participation.mine.fileUnavailable'));

      return;
    }

    if (isAudio) setViewUrl(response.data.view_url);
    else window.open(response.data.view_url, '_blank', 'noopener,noreferrer');
  };

  const startReplace = async () => {
    const response = await DansshipAPI.participation.getForm(participantTypeId);
    const item = response.ok ? response.data.fields.find(candidate => candidate.key === current.key) : null;

    if (!item) {
      toast.error(t('eventos:participation.mine.fileUnavailable'));

      return;
    }

    setField(item as FormItem);
    setDraft(current.value);
  };

  const save = async () => {
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return;

    setSaving(true);

    const response = await DansshipAPI.participation.replaceAnswer(signupId, current.key, draft as never);

    setSaving(false);

    if (!response.ok) {
      toast.error(participationErrorMessage(response.error, t, 'eventos:participation.mine.replaceFailed'));

      return;
    }

    setCurrent(response.data);
    setViewUrl(null);
    setField(null);
    toast.success(t('eventos:participation.mine.replaced'));
  };

  return (
    <div className='grid gap-2'>
      <dt className='text-xs font-semibold text-muted-foreground'>{current.label}</dt>
      <dd className='m-0 grid gap-2 text-sm break-words'>
        <span>{answerText(current.value, t)}</span>
        {file && !viewUrl ? (
          <span>
            <Button type='button' variant='text' color='primary' size='small' onClick={() => void open()}>
              {t(isAudio ? 'eventos:participation.mine.listen' : 'eventos:participation.mine.openFile')}
            </Button>
          </span>
        ) : null}
        {viewUrl ? (
          <audio controls src={viewUrl} className='w-full max-w-md'>
            <track kind='captions' />
          </audio>
        ) : null}
        {field ? (
          <div className='grid gap-3 rounded-[10px] border border-border p-3'>
            <FileOrLinkControl
              item={{ ...field, replace_closes_at: current.replace_closes_at ?? null }}
              value={draft as never}
              onChange={next => setDraft(next as SignupAnswerValue)}
              uploader={uploader}
            />
            <div className='flex flex-wrap justify-end gap-2'>
              <Button type='button' variant='outlined' color='primary' size='small' onClick={() => setField(null)}>
                {t('eventos:participation.mine.cancelReplace')}
              </Button>
              <Button
                type='button'
                variant='solid'
                color='primary'
                size='small'
                isLoading={saving}
                onClick={() => void save()}
              >
                {t('eventos:participation.mine.saveReplace')}
              </Button>
            </div>
          </div>
        ) : current.replaceable ? (
          <span className='grid gap-1'>
            <span>
              <Button type='button' variant='outlined' color='primary' size='small' onClick={() => void startReplace()}>
                {t('eventos:participation.mine.replaceFile')}
              </Button>
            </span>
            {current.replace_closes_at ? (
              <small className='text-xs text-muted-foreground'>
                {t('forms:answer.file.replaceUntil', { date: formatReplaceUntil(current.replace_closes_at) })}
              </small>
            ) : null}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
