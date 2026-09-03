import { useTranslation } from 'react-i18next';
import { RiWhatsappLine } from 'react-icons/ri';

import { buildStudioWhatsAppLink } from '@helpers';

export function WhatsAppBubble() {
  const { t } = useTranslation();
  const label = t('home:whatsappBubble.label');

  return (
    <a
      href={buildStudioWhatsAppLink()}
      target='_blank'
      rel='noopener noreferrer'
      aria-label={label}
      title={label}
      className='fixed z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))]'
    >
      <RiWhatsappLine className='size-7' aria-hidden />
    </a>
  );
}
