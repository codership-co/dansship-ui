import { wrapCreateBrowserRouterV7 } from '@sentry/react';
import { createBrowserRouter, redirect, type RouteObject, RouterProvider } from 'react-router';

import { loggingMiddleware } from './middleware';

import { RouterAuthLayout } from '@components/layouts/router-auth-layout';
import { RouterPageLayout } from '@components/layouts/router-page-layout';
import { RouterRootLayout } from '@components/layouts/router-root-layout';
import { PageURLS } from '@core/constants';
import { importWithStaleChunkRecovery } from '@helpers';
import { SecureLoginPage } from '@pages/auth/login.page';
import { SecureSignupPage } from '@pages/auth/signup.page';
import { SecureVerifyEmailPage } from '@pages/auth/verify-email.page';
import { SecureClassesPage } from '@pages/classes.page';
import { Error404Page } from '@pages/error/404.page';
import { RouteErrorPage } from '@pages/error/route-error.page';
import { HomePage } from '@pages/home.page';

function lazyNamed(
  importer: () => Promise<Record<string, unknown>>,
  exportName: string,
  loaderName?: string,
): NonNullable<RouteObject['lazy']> {
  return async () => {
    const mod = await importWithStaleChunkRecovery(importer);

    return {
      Component: mod[exportName] as NonNullable<RouteObject['Component']>,
      ...(loaderName ? { loader: mod[loaderName] as NonNullable<RouteObject['loader']> } : {}),
    };
  };
}

const routes: Array<RouteObject> = [
  {
    path: '/',
    Component: RouterRootLayout,
    middleware: [loggingMiddleware],
    hydrateFallbackElement: <ChromeFallback />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: 'auth',
        Component: RouterAuthLayout,
        children: [
          { path: 'login', Component: SecureLoginPage },
          { path: 'signup', Component: SecureSignupPage },
          { path: 'verify-email', Component: SecureVerifyEmailPage },
          {
            path: 'forgot-password',
            lazy: lazyNamed(() => import('@pages/auth/forgot-password.page'), 'SecureForgotPasswordPage'),
          },
          {
            path: 'reset-password',
            lazy: lazyNamed(() => import('@pages/auth/reset-password.page'), 'SecureResetPasswordPage'),
          },
          {
            path: 'verify-instructor',
            lazy: lazyNamed(() => import('@pages/auth/verify-instructor.page'), 'SecureInstructorOnboardingPage'),
          },
        ],
      },
      {
        Component: RouterAuthLayout,
        children: [
          {
            path: 'instructor-onboarding',
            loader: async ({ request }) => {
              const url = new URL(request.url);
              const searchParams = url.search;

              throw redirect(`${PageURLS.auth.verifyInstructor}${searchParams}`, {
                status: 302,
              });
            },
          },
        ],
      },
      {
        Component: RouterPageLayout,
        children: [
          { index: true, Component: HomePage },
          { path: 'plans', lazy: lazyNamed(() => import('@pages/plans.page'), 'SecurePlansPage') },
          { path: 'classes', Component: SecureClassesPage },
          { path: 'legal', lazy: lazyNamed(() => import('@pages/legal.page'), 'SecureLegalPage') },
          { path: 'ui', lazy: lazyNamed(() => import('@pages/ui.page'), 'UiPage') },

          {
            path: 'auth/onboarding',
            lazy: lazyNamed(() => import('@pages/auth/onboarding.page'), 'SecureOnboardingPage'),
          },

          { path: 'figures', lazy: lazyNamed(() => import('@pages/figures.page'), 'SecureFiguresPage') },
          {
            path: 'figures/:id',
            lazy: lazyNamed(() => import('@pages/figures-details.page'), 'SecureFiguresDetailsPage'),
          },
          {
            path: 'instructor',
            children: [
              {
                index: true,
                lazy: lazyNamed(() => import('@pages/instructor.page'), 'SecureInstructorHomePage'),
              },
              {
                path: 'classes/:classId/roster/:userId',
                lazy: lazyNamed(
                  () => import('@pages/instructor-student-profile.page'),
                  'SecureInstructorStudentProfilePage',
                ),
              },
            ],
          },

          {
            path: 'profile',
            children: [
              {
                index: true,
                lazy: lazyNamed(() => import('@pages/profile/profile.page'), 'SecureProfilePage'),
              },
              {
                path: 'subscription',
                lazy: lazyNamed(() => import('@pages/profile/subscription.page'), 'SecureSubscriptionPage'),
              },
              {
                path: 'bookings',
                lazy: lazyNamed(() => import('@pages/profile/bookings.page'), 'SecureBookingsPage'),
              },
              {
                path: 'wallet',
                lazy: lazyNamed(() => import('@pages/profile/wallet.page'), 'SecureWalletPage'),
              },
              {
                path: 'payment-documents',
                lazy: lazyNamed(() => import('@pages/profile/payment-documents.page'), 'SecurePaymentDocumentsPage'),
              },
              {
                path: 'gifts',
                lazy: lazyNamed(() => import('@pages/profile/gifts.page'), 'SecureGiftsPage'),
              },
            ],
          },

          {
            path: 'figure',
            children: [
              {
                path: 'completed',
                lazy: lazyNamed(() => import('@pages/figure-completed.page'), 'SecureFigureCompletedPage'),
              },
              {
                path: 'saved',
                lazy: lazyNamed(() => import('@pages/figure-saved.page'), 'SecureFigureSavedPage'),
              },
            ],
          },

          {
            path: 'payments/result',
            lazy: lazyNamed(
              () => import('@pages/payments-result.page'),
              'SecurePaymentsResultPage',
              'PaymentsResultsLoader',
            ),
          },

          { path: 'gifts/claim', lazy: lazyNamed(() => import('@pages/gifts-claim.page'), 'SecureGiftClaimPage') },

          {
            path: 'studio-rental',
            children: [
              {
                path: 'browse',
                lazy: lazyNamed(() => import('@pages/studio-rental-browse.page'), 'SecureStudioRentalBrowsePage'),
              },
              {
                path: 'requests',
                lazy: lazyNamed(() => import('@pages/studio-rental-requests.page'), 'SecureStudioRentalRequestsPage'),
              },
              {
                path: 'result',
                lazy: lazyNamed(
                  () => import('@pages/studio-rental-result.page'),
                  'SecureStudioRentalResultPage',
                  'StudioRentalResultLoader',
                ),
              },
            ],
          },

          {
            path: 'admin',
            children: [
              { index: true, lazy: lazyNamed(() => import('@pages/admin/admin.page'), 'SecureAdminPage') },
              { path: 'agenda', lazy: lazyNamed(() => import('@pages/admin/agenda.page'), 'SecureAdminAgendaPage') },
              {
                path: 'agenda/conflicts',
                lazy: lazyNamed(() => import('@pages/admin/agenda-conflicts.page'), 'SecureAdminAgendaConflictsPage'),
              },
              {
                path: 'inventory',
                lazy: lazyNamed(() => import('@pages/admin/inventory.page'), 'SecureAdminInventoryPage'),
              },
              {
                path: 'schedule-builder',
                lazy: lazyNamed(() => import('@pages/admin/schedule-builder.page'), 'SecureAdminScheduleBuilderPage'),
              },
              { path: 'reports', lazy: lazyNamed(() => import('@pages/admin/reports.page'), 'SecureAdminReportsPage') },
              {
                path: 'bookings',
                lazy: lazyNamed(() => import('@pages/admin/bookings.page'), 'SecureAdminBookingsPage'),
              },
              {
                path: 'payments',
                lazy: lazyNamed(() => import('@pages/admin/payments.page'), 'SecureAdminPaymentsPage'),
              },
              { path: 'merch', lazy: lazyNamed(() => import('@pages/admin/merch.page'), 'SecureAdminMerchPage') },
              {
                path: 'merch/pos',
                lazy: lazyNamed(() => import('@pages/admin/merch-pos.page'), 'SecureAdminMerchPosPage'),
              },
              { path: 'figures', lazy: lazyNamed(() => import('@pages/admin/figures.page'), 'SecureAdminFiguresPage') },
              {
                path: 'users',
                lazy: lazyNamed(() => import('@pages/admin/user-list.page'), 'SecureAdminUserListPage'),
              },
              {
                path: 'users/:userId',
                lazy: lazyNamed(() => import('@pages/admin/user-details.page'), 'SecureAdminUserDetailsPage'),
              },
              {
                path: 'classes/:classId/roster',
                lazy: lazyNamed(() => import('@pages/admin/class-roster.page'), 'SecureAdminClassRosterPage'),
              },
              {
                path: 'studio-rental',
                lazy: lazyNamed(() => import('@pages/admin/studio-rental.page'), 'SecureAdminStudioRentalPage'),
              },
              {
                path: 'door-code',
                lazy: lazyNamed(() => import('@pages/admin/door-code.page'), 'SecureAdminDoorCodePage'),
              },
              {
                path: 'campaigns',
                lazy: lazyNamed(() => import('@pages/admin/campaigns.page'), 'SecureAdminCampaignsPage'),
              },
            ],
          },

          { path: '*', Component: Error404Page },
        ],
      },
    ],
  },
];

function ChromeFallback() {
  return <div className='min-h-dvh bg-background' />;
}

const sentryCreateBrowserRouter = wrapCreateBrowserRouterV7(createBrowserRouter);
const myRouter = sentryCreateBrowserRouter(routes);

export const Router = () => {
  return <RouterProvider router={myRouter} useTransitions />;
};
