import { wrapCreateBrowserRouterV7 } from '@sentry/react';
import { createBrowserRouter, redirect, RouteObject, RouterProvider } from 'react-router';

import { loggingMiddleware } from './middleware';

import { RouterAuthLayout, RouterPageLayout, RouterRootLayout } from '@components/layouts';
import { RootLoader } from '@components/loaders';
import { PageURLS } from '@core/constants';
import {
  Error404Page,
  HomePage,
  SecurePlansPage,
  SecureAdminUserListPage,
  SecureAdminUserDetailsPage,
  SecureAdminClassRosterPage,
  SecureAdminAgendaConflictsPage,
  SecureAdminAgendaPage,
  SecureAdminBookingsPage,
  SecureAdminFiguresPage,
  SecureAdminInventoryPage,
  SecureAdminMerchPage,
  SecureAdminMerchPosPage,
  SecureAdminPage,
  SecureAdminPaymentsPage,
  SecureAdminReportsPage,
  SecureAdminScheduleBuilderPage,
  SecureAdminStudioRentalPage,
  SecureAdminDoorCodePage,
  SecureAdminCampaignsPage,
  SecureClassesPage,
  SecureFigureCompletedPage,
  SecureFigureSavedPage,
  SecureFiguresDetailsPage,
  SecureFiguresPage,
  SecureForgotPasswordPage,
  SecureInstructorOnboardingPage,
  SecureInstructorHomePage,
  SecureInstructorStudentProfilePage,
  SecureLoginPage,
  SecureOnboardingPage,
  SecurePaymentsResultPage,
  SecureGiftClaimPage,
  SecureResetPasswordPage,
  SecureSignupPage,
  SecureStudioRentalBrowsePage,
  SecureStudioRentalRequestsPage,
  SecureStudioRentalResultPage,
  StudioRentalResultLoader,
  SecureVerifyEmailPage,
  UiPage,
  HomeLoader,
  PaymentsResultsLoader,
  SecureProfilePage,
  SecureSubscriptionPage,
  SecureBookingsPage,
  SecureWalletPage,
  SecurePaymentDocumentsPage,
  SecureGiftsPage,
  SecureLegalPage,
} from '@pages';

const routes: Array<RouteObject> = [
  {
    path: '/',
    Component: RouterRootLayout,
    middleware: [loggingMiddleware],
    hydrateFallbackElement: <RootLoader />,
    children: [
      {
        path: 'auth',
        Component: RouterAuthLayout,
        children: [
          { path: 'login', Component: SecureLoginPage },
          { path: 'signup', Component: SecureSignupPage },
          { path: 'forgot-password', Component: SecureForgotPasswordPage },
          { path: 'verify-email', Component: SecureVerifyEmailPage },
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
          { index: true, Component: HomePage, loader: HomeLoader },
          { path: 'plans', Component: SecurePlansPage },
          { path: 'legal', Component: SecureLegalPage },
          { path: 'ui', Component: UiPage },

          { path: 'auth/onboarding', Component: SecureOnboardingPage },

          { path: 'figures', Component: SecureFiguresPage },
          { path: 'figures/:id', Component: SecureFiguresDetailsPage },
          { path: 'classes', Component: SecureClassesPage },
          {
            path: 'instructor',
            children: [
              { index: true, Component: SecureInstructorHomePage },
              { path: 'classes/:classId/roster/:userId', Component: SecureInstructorStudentProfilePage },
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

          { path: 'payments/result', Component: SecurePaymentsResultPage, loader: PaymentsResultsLoader },

          { path: 'gifts/claim', Component: SecureGiftClaimPage },

          {
            path: 'studio-rental',
            children: [
              { path: 'browse', Component: SecureStudioRentalBrowsePage },
              { path: 'requests', Component: SecureStudioRentalRequestsPage },
              { path: 'result', Component: SecureStudioRentalResultPage, loader: StudioRentalResultLoader },
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

const sentryCreateBrowserRouter = wrapCreateBrowserRouterV7(createBrowserRouter);
const myRouter = sentryCreateBrowserRouter(routes);

export const Router = () => {
  return <RouterProvider router={myRouter} useTransitions />;
};
