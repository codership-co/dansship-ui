import { Outlet, useLocation } from 'react-router';

import { CampaignOverlayHost } from '@components/modules/campaigns/campaign-overlay-host';
import { Footer, Navbar, WhatsAppBubble } from '@components/navigation';
import { SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';

const SecurityOutlet = SecurityGuard(Outlet);

function shouldShowWhatsAppBubble(pathname: string) {
  return !pathname.startsWith(PageURLS.admin.root) && !pathname.startsWith(PageURLS.instructor.root);
}

export const RouterPageLayout = () => {
  const { pathname } = useLocation();

  return (
    <section className='relative min-h-dvh grid grid-rows-[1fr_auto]'>
      {pathname !== PageURLS.home && (
        <img
          src='/assets/images/bg-girl.png'
          alt=''
          width={160}
          height={240}
          decoding='async'
          className='pointer-events-none select-none fixed bottom-0 right-0 m-8 w-[15vw] min-w-40 max-w-70 hidden lg:block -z-100'
        />
      )}
      <Navbar />
      <CampaignOverlayHost />
      <section className='relative z-10 min-h-[60dvh]'>
        <SecurityOutlet />
      </section>
      <Footer />
      {shouldShowWhatsAppBubble(pathname) && <WhatsAppBubble />}
    </section>
  );
};
