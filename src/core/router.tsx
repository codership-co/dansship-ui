import { wrapCreateBrowserRouterV7 } from '@sentry/react';
import { createBrowserRouter, redirect, type RouteObject, RouterProvider } from 'react-router';

import { loggingMiddleware } from './middleware';

import { RouterAuthLayout } from '@components/layouts/router-auth-layout';
import { RouterPageLayout } from '@components/layouts/router-page-layout';
import { RouterRootLayout } from '@components/layouts/router-root-layout';
import { PageURLS } from '@core/constants';
import {
  Error404Page,
  HomePage,
  PaymentsResultsLoader,
  SecureAdminAgendaConflictsPage,
  SecureAdminAgendaPage,
  SecureAdminBookingsPage,
  SecureAdminCampaignsPage,
  SecureAdminClassRosterPage,
  SecureAdminDoorCodePage,
  SecureAdminFiguresPage,
  SecureAdminInventoryPage,
  SecureAdminMerchPage,
  SecureAdminMerchPosPage,
  SecureAdminPage,
  SecureAdminPaymentsPage,
  SecureAdminReportsPage,
  SecureAdminScheduleBuilderPage,
  SecureAdminStudioRentalPage,
  SecureAdminUserDetailsPage,
  SecureAdminUserListPage,
  SecureBookingsPage,
  SecureClassesPage,
  SecureFigureCompletedPage,
  SecureFigureSavedPage,
  SecureFiguresDetailsPage,
  SecureFiguresPage,
  SecureForgotPasswordPage,
  SecureGiftClaimPage,
  SecureGiftsPage,
  SecureInstructorHomePage,
  SecureInstructorOnboardingPage,
  SecureInstructorStudentProfilePage,
  SecureLegalPage,
  SecureLoginPage,
  SecureOnboardingPage,
  SecurePaymentDocumentsPage,
  SecurePaymentsResultPage,
  SecurePlansPage,
  SecureProfilePage,
  SecureResetPasswordPage,
  SecureSignupPage,
  SecureStudioRentalBrowsePage,
  SecureStudioRentalRequestsPage,
  SecureStudioRentalResultPage,
  SecureSubscriptionPage,
  SecureVerifyEmailPage,
  SecureWalletPage,
  StudioRentalResultLoader,
  UiPage,
} from '@pages';
import { RouteErrorPage } from '@pages/error/route-error.page';

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
          { path: 'forgot-password', Component: SecureForgotPasswordPage },
          { path: 'reset-password', Component: SecureResetPasswordPage },
          { path: 'verify-instructor', Component: SecureInstructorOnboardingPage },
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
          { path: 'plans', Component: SecurePlansPage },
          { path: 'classes', Component: SecureClassesPage },
          { path: 'legal', Component: SecureLegalPage },
          { path: 'ui', Component: UiPage },

          { path: 'auth/onboarding', Component: SecureOnboardingPage },

          { path: 'figures', Component: SecureFiguresPage },
          { path: 'figures/:id', Component: SecureFiguresDetailsPage },
          {
            path: 'instructor',
            children: [
              { index: true, Component: SecureInstructorHomePage },
              {
                path: 'classes/:classId/roster/:userId',
                Component: SecureInstructorStudentProfilePage,
              },
            ],
          },

          {
            path: 'profile',
            children: [
              { index: true, Component: SecureProfilePage },
              { path: 'subscription', Component: SecureSubscriptionPage },
              { path: 'bookings', Component: SecureBookingsPage },
              { path: 'wallet', Component: SecureWalletPage },
              { path: 'payment-documents', Component: SecurePaymentDocumentsPage },
              { path: 'gifts', Component: SecureGiftsPage },
            ],
          },

          {
            path: 'figure',
            children: [
              { path: 'completed', Component: SecureFigureCompletedPage },
              { path: 'saved', Component: SecureFigureSavedPage },
            ],
          },

          {
            path: 'payments/result',
            Component: SecurePaymentsResultPage,
            loader: PaymentsResultsLoader,
          },

          { path: 'gifts/claim', Component: SecureGiftClaimPage },

          {
            path: 'studio-rental',
            children: [
              { path: 'browse', Component: SecureStudioRentalBrowsePage },
              { path: 'requests', Component: SecureStudioRentalRequestsPage },
              {
                path: 'result',
                Component: SecureStudioRentalResultPage,
                loader: StudioRentalResultLoader,
              },
            ],
          },

          {
            path: 'admin',
            children: [
              { index: true, Component: SecureAdminPage },
              { path: 'agenda', Component: SecureAdminAgendaPage },
              { path: 'agenda/conflicts', Component: SecureAdminAgendaConflictsPage },
              { path: 'inventory', Component: SecureAdminInventoryPage },
              { path: 'schedule-builder', Component: SecureAdminScheduleBuilderPage },
              { path: 'reports', Component: SecureAdminReportsPage },
              { path: 'bookings', Component: SecureAdminBookingsPage },
              { path: 'payments', Component: SecureAdminPaymentsPage },
              { path: 'merch', Component: SecureAdminMerchPage },
              { path: 'merch/pos', Component: SecureAdminMerchPosPage },
              { path: 'figures', Component: SecureAdminFiguresPage },
              { path: 'users', Component: SecureAdminUserListPage },
              { path: 'users/:userId', Component: SecureAdminUserDetailsPage },
              { path: 'classes/:classId/roster', Component: SecureAdminClassRosterPage },
              { path: 'studio-rental', Component: SecureAdminStudioRentalPage },
              { path: 'door-code', Component: SecureAdminDoorCodePage },
              { path: 'campaigns', Component: SecureAdminCampaignsPage },
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
