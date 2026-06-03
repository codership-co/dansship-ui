import { HttpClient, type OnErrorCallback } from 'polpo-http-client';

import { AuthAPI } from './auth/auth.api';
import { BillingAdminAPI } from './billing/billing.admin.api';
import { BookingsAdminAPI } from './bookings/bookings.admin.api';
import { BookingsAPI } from './bookings/bookings.api';
import { getResponseError } from './dansship.get-error';
import { FiguresAdminAPI } from './figures/figures.admin.api';
import { FiguresAPI } from './figures/figures.api';
import { InstructorsAdminAPI } from './instructors/instructors.admin.api';
import { InstructorsAPI } from './instructors/instructors.api';
import { InventoryAdminApi } from './inventory/inventory.admin.api';
import { MerchAdminApi } from './merch/merch.admin.api';
import { NotificationsAdminApi } from './notifications/notifications.admin.api';
import { OnboardingAPI } from './onboarding/onboarding.api';
import { PaymentsAdminAPI } from './payments/payments.admin.api';
import { PaymentsAPI } from './payments/payments.api';
import { RbacAdminApi } from './rbac/rbac.admin.api';
import { ReportsAdminAPI } from './reports/reports.admin.api';
import { SchedulesAdminAPI } from './schedules/schedules.admin.api';
import { SchedulesAPI } from './schedules/schedules.api';
import { StudioRentalAdminAPI } from './studio-rental/studio-rental.admin.api';
import { StudioRentalAPI } from './studio-rental/studio-rental.api';
import { SubscriptionsAPI } from './subscriptions/subscriptions.api';
import { UsersAdminAPI } from './users/users.admin.api';

export default class DansshipAPI {
  static async authenticate() {
    return '';
  }

  static getLogger() {
    // eslint-disable-next-line no-console
    return async params => console.log(params);
  }

  private static notifySessionExpired(): void {
    localStorage.removeItem('auth_session');
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
  }

  static readonly httpClient = new HttpClient({
    apiName: 'DANSSHIP',
    baseURL: `${import.meta.env.VITE_DANSSHIP_API_URL}`,
    mode: 'cors',
    getLogger: () => this.getLogger(),
    getResponseError,
    getHeaders: async (): Promise<HeadersInit> => {
      return {
        Authorization: `Bearer ${await this.authenticate()}`,
      };
    },
    credentials: 'include',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  });

  static {
    this.httpClient.setOnErrorInterceptor((async (config, response) => {
      const shouldTryRefresh =
        response.status === 401 &&
        !config.retries &&
        config.path !== '/auth/refresh-token' &&
        localStorage.getItem('auth_session') === '1';

      if (shouldTryRefresh) {
        const refreshed = await this.auth.refreshToken();

        if (refreshed.status !== 200) {
          this.notifySessionExpired();

          return refreshed;
        }

        const response = await this.httpClient.call({ ...config, retries: (config.retries ?? 0) + 1 });

        if (response.status === 401) {
          this.notifySessionExpired();
        }

        return response;
      }
    }) as OnErrorCallback);
  }

  static auth = new AuthAPI(this.httpClient);
  static billingAdmin = new BillingAdminAPI(this.httpClient);
  static bookings = new BookingsAPI(this.httpClient);
  static bookingsAdmin = new BookingsAdminAPI(this.httpClient);
  static figures = new FiguresAPI(this.httpClient);
  static figuresAdmin = new FiguresAdminAPI(this.httpClient);
  static instructors = new InstructorsAPI(this.httpClient);
  static instructorsAdmin = new InstructorsAdminAPI(this.httpClient);
  static inventoryAdmin = new InventoryAdminApi(this.httpClient);
  static merchAdmin = new MerchAdminApi(this.httpClient);
  static notificationsAdmin = new NotificationsAdminApi(this.httpClient);
  static onboarding = new OnboardingAPI(this.httpClient);
  static payments = new PaymentsAPI(this.httpClient);
  static paymentsAdmin = new PaymentsAdminAPI(this.httpClient);
  static rbacAdmin = new RbacAdminApi(this.httpClient);
  static reportsAdmin = new ReportsAdminAPI(this.httpClient);
  static schedules = new SchedulesAPI(this.httpClient);
  static schedulesAdmin = new SchedulesAdminAPI(this.httpClient);
  static studioRental = new StudioRentalAPI(this.httpClient);
  static studioRentalAdmin = new StudioRentalAdminAPI(this.httpClient);
  static subscriptions = new SubscriptionsAPI(this.httpClient);
  static usersAdmin = new UsersAdminAPI(this.httpClient);
}
