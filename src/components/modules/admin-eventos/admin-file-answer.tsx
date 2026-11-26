import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { isFileAnswer } from '@components/modules/dynamic-form';
import { DansshipAPI, type SignupAnswerValue } from '@core/api';

/** Listen to (audio) or open/download (image, PDF) a person's uploaded file, through a short-lived link. */
export function AdminFileAnswer({
  signupId,
  fieldKey,
  value,
}: {
  signupId: string;
  fieldKey: string;
  value: SignupAnswerValue;
}) {
  const { t } = useTranslation();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isFileAnswer(value)) return null;

  const isAudio = value.content_type.startsWith('audio/');

  const fetchUrl = async (download = false) => {
    setLoading(true);

    const response = await DansshipAPI.participationAdmin.getAnswerFile(signupId, fieldKey, download);

    setLoading(false);

    if (!response.ok) {
      toast.error(t('eventos:participation.detail.fileUnavailable'));

      return null;
    }

    return response.data.view_url;
  };

  const listen = async () => {
    const url = await fetchUrl();

    if (url) setAudioUrl(url);
  };

  const download = async () => {
    // Audio downloads with its name; images and PDFs open in a new tab.
    const url = await fetchUrl(isAudio);

    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className='grid gap-2'>
      <div className='flex flex-wrap gap-2'>
        {isAudio && !audioUrl ? (
          <Button
            type='button'
            variant='text'
            color='primary'
            size='small'
            isLoading={loading}
            onClick={() => void listen()}
          >
            {t('eventos:participation.detail.listen')}
          </Button>
        ) : null}
        <Button
          type='button'
          variant='text'
          color='primary'
          size='small'
          isLoading={loading}
          onClick={() => void download()}
        >
          {t(isAudio ? 'eventos:participation.detail.download' : 'eventos:participation.detail.openFile')}
        </Button>
      </div>
      {audioUrl ? (
        <audio controls autoPlay src={audioUrl} className='w-full'>
          <track kind='captions' />
        </audio>
      ) : null}
    </div>
  );
}
