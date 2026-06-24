import { Outlet } from 'react-router';

import { SecurityGuard } from '@contexts';

const SecurityOutlet = SecurityGuard(Outlet);

export const AuthLayout = () => {
  return (
    <section className='relative min-h-dvh grid grid-rows-[1fr]'>
      <SecurityOutlet />
    </section>
  );
};
