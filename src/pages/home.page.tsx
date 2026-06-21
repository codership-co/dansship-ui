import { HomeHero, HomeOfferings, HomeAppFeature, HomeAdminDashboard, HomeMemberships } from '@components/modules';
import { DansshipAPI, PublicPlan } from '@core/api';

export interface HomeLoaderData {
  publicPlans: Array<PublicPlan>;
}

export async function getHomeData(): Promise<HomeLoaderData> {
  const publicPlans = await DansshipAPI.subscriptions.getPublicPlans();

  return {
    publicPlans: publicPlans.data ?? [],
  };
}

export async function HomeLoader() {
  return getHomeData();
}

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
