import { HttpClient, type OnErrorCallback } from 'polpo-http-client';

import { AuthAPI } from './auth/auth.api';
import { BillingAPI } from './billing/billing.api';
import { BookingsAPI } from './bookings/bookings.api';
import { getResponseError } from './dansship.get-error';
import { FiguresAPI } from './figures/figures.api';
import { InstructorsAPI } from './instructors/instructors.api';
import { InventoryAPI } from './inventory/inventory.api';
import { MerchAPI } from './merch/merch.api';
import { NotificationsAPI } from './notifications/notifications.api';
import { OnboardingAPI } from './onboarding/onboarding.api';
import { PaymentsAPI } from './payments/payments.api';
import { RBACAPI } from './rbac/rbac.api';
import { ReportsAPI } from './reports/reports.api';
import { SchedulesAPI } from './schedules/schedules.api';
import { StudioRentalAPI } from './studio-rental/studio-rental.api';
import { SubscriptionsAPI } from './subscriptions/subscriptions.api';
import { UsersAPI } from './users/users.api';

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
  static billing = new BillingAPI(this.httpClient);
  static bookings = new BookingsAPI(this.httpClient);
  static figures = new FiguresAPI(this.httpClient);
  static instructors = new InstructorsAPI(this.httpClient);
  static inventory = new InventoryAPI(this.httpClient);
  static merch = new MerchAPI(this.httpClient);
  static notifications = new NotificationsAPI(this.httpClient);
  static onboarding = new OnboardingAPI(this.httpClient);
  static payments = new PaymentsAPI(this.httpClient);
  static rbac = new RBACAPI(this.httpClient);
  static reports = new ReportsAPI(this.httpClient);
  static schedules = new SchedulesAPI(this.httpClient);
  static studioRental = new StudioRentalAPI(this.httpClient);
  static subscriptions = new SubscriptionsAPI(this.httpClient);
  static users = new UsersAPI(this.httpClient);
}
