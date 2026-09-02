import { HomeAdminDashboard } from '@components/modules/home/home-admin-dashboard';
import { HomeAppFeature } from '@components/modules/home/home-app-feature';
import { HomeHero } from '@components/modules/home/home-hero';
import { HomeMemberships } from '@components/modules/home/home-memberships';
import { HomeOfferings } from '@components/modules/home/home-offerings';

export function HomePage() {
  return (
    <section>
      <HomeHero />
      <HomeOfferings />
      <HomeAppFeature />
      <HomeAdminDashboard />
      <HomeMemberships />
    </section>
  );
}
