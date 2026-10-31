import { Button, ClickToCopy } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { LuCopy } from 'react-icons/lu';

/*
 * const NEQUI_QR_PLACEHOLDER = '/assets/images/payments/nequi-qr.png';
 * TODO: change to breb-qr.png
 */
const BREB_QR_PLACEHOLDER = '/assets/images/payments/breb-qr.png';
const BREB_KEY = '@boldds3507';
// const BANK_ACCOUNT_NUMBER = '1700-1510-7618';

interface TransferPaymentInstructionsProps {
  qrUrl?: string | null;
  variant?: 'default' | 'event';
}

export function TransferPaymentInstructions({ qrUrl, variant = 'default' }: TransferPaymentInstructionsProps) {
  const { t } = useTranslation();
  const imageSrc = qrUrl || BREB_QR_PLACEHOLDER;

  if (variant === 'event') {
    return (
      <section className='grid min-w-0 justify-items-center gap-3 rounded-2xl bg-primary/5 p-5 text-center'>
        <p className='m-0 text-[15px] font-semibold'>{t('eventos:checkout.payWithBreb')}</p>
        <div className='max-w-full rounded-xl border border-primary/20 bg-white p-2'>
          <img
            src={imageSrc}
            alt={t('payments:instructions.transfer.brebQrTitle')}
            className='aspect-square w-60 max-w-full object-contain sm:w-72'
          />
        </div>
        <p className='m-0 text-sm text-muted-foreground'>{t('eventos:checkout.scanHelp')}</p>
        {!qrUrl ? (
          <div className='grid justify-items-center gap-1.5'>
            <span className='font-title text-[22px] leading-none font-bold text-primary'>{BREB_KEY}</span>
            <ClickToCopy
              value={BREB_KEY}
              tooltipText={t('eventos:checkout.copyKey')}
              tooltipCopiedText={t('eventos:checkout.keyCopied')}
            >
              <Button
                type='button'
                color='primary'
                variant='outlined'
                size='small'
                className='flex items-center gap-1.5'
              >
                <LuCopy aria-hidden />
                {t('eventos:checkout.copyKey')}
              </Button>
            </ClickToCopy>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className='rounded-md border border-primary/20 bg-primary/5 p-4 text-sm text-gray-700'>
      <p className='m-0 font-semibold text-primary'>{t('payments:instructions.transfer.title')}</p>
      <p className='mt-1 mb-4'>{t('payments:instructions.transfer.description')}</p>

      <div className='grid gap-4'>
        {/* <article className='grid justify-items-center gap-2 rounded-lg border border-white/60 bg-white/70 p-4 text-center'>
          <p className='m-0 font-semibold text-primary'>{t('payments:instructions.transfer.nequiQrTitle')}</p>
          <img
            src={NEQUI_QR_PLACEHOLDER}
            alt={t('payments:instructions.transfer.nequiQrTitle')}
            className='size-32 object-contain'
          />
          </article> */}
        <article className='grid min-w-0 max-w-full justify-items-center gap-2 rounded-lg border border-white/60 bg-white/70 p-4 text-center'>
          {/* <p className='m-0 font-semibold text-primary'>{t('payments:instructions.transfer.brebQrTitle')}</p> */}

          <img
            src={imageSrc}
            alt={t('payments:instructions.transfer.brebQrTitle')}
            className='aspect-square h-auto w-full max-w-72 object-contain sm:max-w-80'
          />

          {!qrUrl ? (
            <p className='m-0 mt-4 font-semibold text-primary'>
              {t('payments:instructions.transfer.brebKeyLabel')}{' '}
              <span className='m-0 mt-1 font-large text-gray-900 text-xl'>{BREB_KEY}</span>
            </p>
          ) : null}
        </article>

        {/* }
        <article className='rounded-lg border border-white/60 bg-white/70 p-4'>
          <div>
            <p className='m-0 mb-2 font-semibold text-primary'>{t('payments:instructions.transfer.brebTitle')}</p>
            <p className='m-0 text-xs text-gray-600'>{t('payments:instructions.transfer.brebKeyLabel')}</p>
            <p className='m-0 mt-1 font-large text-gray-900 text-xl'>{BREB_KEY}</p>
          </div>

          <div className='mt-8'>
            <p className='m-0 mb-2 font-semibold text-primary'>{t('payments:instructions.transfer.bankTransfer')}</p>
            <p className='m-0 text-xs text-gray-600'>{t('payments:instructions.transfer.accountNumber')}</p>
            <p className='m-0 mt-1 font-large text-gray-900 text-xl'>{BANK_ACCOUNT_NUMBER}</p>
          </div>
        </article>
        */}
      </div>
    </section>
  );
}
