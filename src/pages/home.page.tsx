import { lazy, Suspense } from 'react';

import { HomeAdminDashboard } from '@components/modules/home/home-admin-dashboard';
import { HomeAppFeature } from '@components/modules/home/home-app-feature';
import { HomeHero } from '@components/modules/home/home-hero';
import { HomeOfferings } from '@components/modules/home/home-offerings';
import { importWithStaleChunkRecovery } from '@helpers';

const HomeMemberships = lazy(() =>
  importWithStaleChunkRecovery(() =>
    import('@components/modules/home/home-memberships').then(mod => ({ default: mod.HomeMemberships })),
  ),
);

export function HomePage() {
  return (
    <section>
      <HomeHero />
      <HomeOfferings />
      <HomeAppFeature />
      <HomeAdminDashboard />
      <Suspense fallback={<div className='min-h-64' aria-hidden />}>
        <HomeMemberships />
      </Suspense>
    </section>
  );
}
