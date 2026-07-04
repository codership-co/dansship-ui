import { Outlet } from 'react-router';

import { SecurityGuard } from '@contexts';

const SecurityOutlet = SecurityGuard(Outlet);

export const RouterAuthLayout = () => {
  return (
    <section className='relative min-h-dvh grid grid-rows-[1fr]'>
      <SecurityOutlet />
    </section>
  );
};
