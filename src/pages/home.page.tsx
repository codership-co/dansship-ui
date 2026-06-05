import { HomeHero, HomeOfferings, HomeAppFeature, HomeAdminDashboard, HomeMemberships } from '@components/modules';

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
