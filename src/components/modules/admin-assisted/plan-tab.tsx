import { PersonGate } from './person-gate';

import { AdminPlanPurchase } from '@components/modules/admin-users/admin-plan-purchase';

export function PlanTab() {
  return <PersonGate>{person => <AdminPlanPurchase key={person.id} userId={person.id} />}</PersonGate>;
}
