import { useTranslation } from 'react-i18next';
import { LuEye } from 'react-icons/lu';

/** Shown on every page of the admin's "Previsualizar": nothing is saved and no payment is taken. */
export function PreviewBanner() {
  const { t } = useTranslation();

  return (
    <p className='m-0 flex items-start gap-2 rounded-xl bg-secondary px-3.5 py-3 text-sm font-medium' role='status'>
      <LuEye className='mt-0.5 size-4 flex-none' aria-hidden />
      {t('eventos:previewMode.banner')}
    </p>
  );
}
