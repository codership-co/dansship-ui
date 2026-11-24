import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@helpers';

interface EntryQrCanvasProps {
  code: string | null;
  dimmed?: boolean;
  className?: string;
}

/** The QR, drawn with `qrcode` loaded on demand (only the QR screens pay for it). */
export function EntryQrCanvas({ code, dimmed = false, className }: EntryQrCanvasProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !code) {
      return undefined;
    }

    let cancelled = false;

    import('qrcode')
      .then(({ default: QRCode }) => {
        if (cancelled) return undefined;

        return QRCode.toCanvas(canvas, code, { errorCorrectionLevel: 'M', margin: 2, width: 288 });
      })
      .then(() => {
        if (!cancelled) setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div
      className={cn(
        'relative mx-auto grid aspect-square w-full max-w-[18rem] place-items-center rounded-2xl bg-white p-2',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        role='img'
        aria-label={t('eventos:entry.qrLabel')}
        className={cn(
          'size-full transition-opacity duration-300 [image-rendering:pixelated]',
          (!code || dimmed) && 'opacity-15',
        )}
      />
      {failed ? <p className='absolute text-sm text-alert-600'>{t('eventos:entry.qrFailed')}</p> : null}
    </div>
  );
}
