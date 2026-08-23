import { HttpClient } from 'polpo-http-client';

import { AuthAPI } from './auth/auth.api';
import { BenefitsAdminAPI } from './benefits/benefits.admin.api';
import { BillingAdminAPI } from './billing/billing.admin.api';
import { BookingsAdminAPI } from './bookings/bookings.admin.api';
import { BookingsAPI } from './bookings/bookings.api';
import { DansshipAPIError, getResponseError, logger } from './dansship.error';
import { DoorCodeAdminAPI } from './door-code/door-code.admin.api';
import { FiguresAdminAPI } from './figures/figures.admin.api';
import { FiguresAPI } from './figures/figures.api';
import { GiftsAPI } from './gifts/gifts.api';
import { InstructorPaymentsAdminAPI, InstructorPaymentsAPI } from './instructor-payments/instructor-payments.api';
import { InstructorsAdminAPI } from './instructors/instructors.admin.api';
import { InstructorsAPI } from './instructors/instructors.api';
import { InventoryAdminApi } from './inventory/inventory.admin.api';
import { MerchAdminApi } from './merch/merch.admin.api';
import { NotificationsAdminApi } from './notifications/notifications.admin.api';
import { OnboardingAPI } from './onboarding/onboarding.api';
import { PaymentsAdminAPI } from './payments/payments.admin.api';
import { PaymentsAPI } from './payments/payments.api';
import { RbacAdminAPI } from './rbac/rbac.admin.api';
import { ReportsAdminAPI } from './reports/reports.admin.api';
import { SchedulesAdminAPI } from './schedules/schedules.admin.api';
import { SchedulesAPI } from './schedules/schedules.api';
import { StudioRentalAdminAPI } from './studio-rental/studio-rental.admin.api';
import { StudioRentalAPI } from './studio-rental/studio-rental.api';
import { SubscriptionsAdminAPI } from './subscriptions/subscriptions.admin.api';
import { SubscriptionsAPI } from './subscriptions/subscriptions.api';
import { UsersAdminAPI } from './users/users.admin.api';
import { WalletsAdminAPI, WalletsAPI } from './wallets/wallets.api';

import { AUTH_SESSION_KEY } from '@core/constants';

const AUTH_REFRESH_SKIP_PATHS = new Set(['/auth/refresh-token', '/auth/signin', '/auth/signup', '/auth/signout']);

export class DansshipAPI {
  static readonly httpClient = new HttpClient<DansshipAPIError>({
    apiName: 'DANSSHIP',
    baseURL: `${import.meta.env.VITE_DANSSHIP_API_URL}`,
    mode: 'cors',
    cache: 'no-cache',
    logger,
    getResponseError,
    credentials: 'include',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  });

  static auth = new AuthAPI(this.httpClient);
  static benefitsAdmin = new BenefitsAdminAPI(this.httpClient);
  static billingAdmin = new BillingAdminAPI(this.httpClient);
  static bookings = new BookingsAPI(this.httpClient);
  static bookingsAdmin = new BookingsAdminAPI(this.httpClient);
  static figures = new FiguresAPI(this.httpClient);
  static figuresAdmin = new FiguresAdminAPI(this.httpClient);
  static gifts = new GiftsAPI(this.httpClient);
  static instructorPayments = new InstructorPaymentsAPI(this.httpClient);
  static instructorPaymentsAdmin = new InstructorPaymentsAdminAPI(this.httpClient);
  static instructors = new InstructorsAPI(this.httpClient);
  static instructorsAdmin = new InstructorsAdminAPI(this.httpClient);
  static inventoryAdmin = new InventoryAdminApi(this.httpClient);
  static merchAdmin = new MerchAdminApi(this.httpClient);
  static notificationsAdmin = new NotificationsAdminApi(this.httpClient);
  static onboarding = new OnboardingAPI(this.httpClient);
  static payments = new PaymentsAPI(this.httpClient);
  static paymentsAdmin = new PaymentsAdminAPI(this.httpClient);
  static reportsAdmin = new ReportsAdminAPI(this.httpClient);
  static schedules = new SchedulesAPI(this.httpClient);
  static schedulesAdmin = new SchedulesAdminAPI(this.httpClient);
  static studioRental = new StudioRentalAPI(this.httpClient);
  static studioRentalAdmin = new StudioRentalAdminAPI(this.httpClient);
  static subscriptions = new SubscriptionsAPI(this.httpClient);
  static subscriptionsAdmin = new SubscriptionsAdminAPI(this.httpClient);
  static usersAdmin = new UsersAdminAPI(this.httpClient);
  static rbacAdmin = new RbacAdminAPI(this.httpClient);
  static wallets = new WalletsAPI(this.httpClient);
  static walletsAdmin = new WalletsAdminAPI(this.httpClient);
  static doorCodeAdmin = new DoorCodeAdminAPI(this.httpClient);

  static {
    this.httpClient.setOnErrorInterceptor(async (request, response) => {
      if (
        response.status === 401 &&
        !request.isReFetch &&
        localStorage.getItem(AUTH_SESSION_KEY) === '1' &&
        !AUTH_REFRESH_SKIP_PATHS.has(request.urlParams.path ?? '')
      ) {
        try {
          await this.auth.refreshToken();

          return request.reFetch();
        } catch {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
      }
    });
  }
}
