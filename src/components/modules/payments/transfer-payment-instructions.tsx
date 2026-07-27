import { useTranslation } from 'react-i18next';

const NEQUI_QR_PLACEHOLDER = '/assets/manifest/icon-512.png';
const BREB_QR_PLACEHOLDER = '/assets/images/logo.png';
const BREB_KEY = '@bolddanshsip';

export function TransferPaymentInstructions() {
  const { t } = useTranslation();

  return (
    <section className='rounded-md border border-primary/20 bg-primary/5 p-4 text-sm text-gray-700'>
      <p className='m-0 font-semibold text-primary'>{t('payments:instructions.transfer.title')}</p>
      <p className='mt-1 mb-4'>{t('payments:instructions.transfer.description')}</p>

      <div className='grid gap-4 sm:grid-cols-3'>
      <article className='grid justify-items-center gap-2 rounded-lg border border-white/60 bg-white/70 p-4 text-center'>
          <p className='m-0 font-semibold text-primary'>{t('payments:instructions.transfer.nequiQrTitle')}</p>
          <img
            src={NEQUI_QR_PLACEHOLDER}
            alt={t('payments:instructions.transfer.nequiQrTitle')}
            className='size-32 object-contain'
          />
        </article>

        <article className='rounded-lg border border-white/60 bg-white/70 p-4'>
          <p className='m-0 mb-2 font-semibold text-primary'>{t('payments:instructions.transfer.brebTitle')}</p>
          <p className='m-0 text-xs text-gray-600'>{t('payments:instructions.transfer.brebKeyLabel')}</p>
          <p className='m-0 mt-1 font-medium text-gray-900'>{BREB_KEY}</p>
        </article>

        <article className='grid justify-items-center gap-2 rounded-lg border border-white/60 bg-white/70 p-4 text-center'>
          <p className='m-0 font-semibold text-primary'>{t('payments:instructions.transfer.brebQrTitle')}</p>
          <img
            src={BREB_QR_PLACEHOLDER}
            alt={t('payments:instructions.transfer.brebQrTitle')}
            className='size-32 object-contain'
          />
        </article>
      </div>
    </section>
  );
}
