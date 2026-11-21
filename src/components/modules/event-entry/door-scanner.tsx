import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DoorScannerProps {
  onCode: (code: string) => void;
  onUnavailable: () => void;
}

type ScannerInstance = { start: () => Promise<void>; destroy: () => void };

/** Rear camera viewer. `qr-scanner` is loaded on demand; it uses BarcodeDetector when present. */
export function DoorScanner({ onCode, onUnavailable }: DoorScannerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  const onUnavailableRef = useRef(onUnavailable);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    onCodeRef.current = onCode;
    onUnavailableRef.current = onUnavailable;
  }, [onCode, onUnavailable]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return undefined;
    }

    if (!window.isSecureContext || !navigator.mediaDevices) {
      onUnavailableRef.current();

      return undefined;
    }

    let cancelled = false;
    let scanner: ScannerInstance | null = null;

    import('qr-scanner')
      .then(({ default: QrScanner }) => {
        if (cancelled) return undefined;

        scanner = new QrScanner(video, result => onCodeRef.current(result.data), {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          maxScansPerSecond: 5,
          returnDetailedScanResult: true,
        });

        return scanner.start();
      })
      .then(() => {
        if (!cancelled) setStarting(false);
      })
      .catch(() => {
        if (!cancelled) onUnavailableRef.current();
      });

    return () => {
      cancelled = true;
      scanner?.destroy();
    };
  }, []);

  return (
    <div className='relative overflow-hidden rounded-2xl bg-foreground'>
      <video
        ref={videoRef}
        className='aspect-square w-full object-cover'
        muted
        playsInline
        aria-label={t('eventos:door.camera')}
      />
      {starting ? (
        <p className='absolute inset-0 m-0 grid place-items-center text-sm text-white'>
          {t('eventos:door.cameraStarting')}
        </p>
      ) : null}
    </div>
  );
}
