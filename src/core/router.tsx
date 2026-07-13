import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router';

import { loggingMiddleware } from './middleware';

import { RouterAuthLayout, RouterPageLayout, RouterRootLayout } from '@components/layouts';
import { RootLoader } from '@components/loaders';
import {
  Error404Page,
  HomePage,
  SecureAdminUserListPage,
  SecureAdminUserDetailsPage,
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
  SecureClassesPage,
  SecureFigureCompletedPage,
  SecureFigureSavedPage,
  SecureFiguresDetailsPage,
  SecureFiguresPage,
  SecureForgotPasswordPage,
  SecureInstructorDashboardPage,
  SecureLoginPage,
  SecureMyAccountBookingsPage,
  SecureMyAccountSubscriptionPage,
  SecureOnboardingPage,
  SecureProfileEditPage,
  SecureProfilePage,
  SecurePaymentsResultPage,
  SecureResetPasswordPage,
  SecureSignupPage,
  SecureStudioRentalBrowsePage,
  SecureStudioRentalRequestsPage,
  SecureVerifyEmailPage,
  UiPage,
  HomeLoader,
  PaymentsResultsLoader,
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
          { path: 'onboarding', Component: SecureOnboardingPage },
        ],
      },
      {
        Component: RouterPageLayout,
        children: [
          { path: 'ui', Component: UiPage },
          { index: true, Component: HomePage, loader: HomeLoader },

          { path: 'figures', Component: SecureFiguresPage },
          { path: 'figures/:id', Component: SecureFiguresDetailsPage },
          { path: 'classes', Component: SecureClassesPage },
          { path: 'instructor/dashboard', Component: SecureInstructorDashboardPage },

          {
            path: 'profile',
            children: [
              { index: true, Component: SecureProfilePage },
              { path: 'edit', Component: SecureProfileEditPage },
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
            path: 'my-account',
            children: [
              { path: 'subscription', Component: SecureMyAccountSubscriptionPage },
              { path: 'bookings', Component: SecureMyAccountBookingsPage },
            ],
          },

          { path: 'payments/result', Component: SecurePaymentsResultPage, loader: PaymentsResultsLoader },

          {
            path: 'studio-rental',
            children: [
              { path: 'browse', Component: SecureStudioRentalBrowsePage },
              { path: 'requests', Component: SecureStudioRentalRequestsPage },
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
              { path: 'studio-rental', Component: SecureAdminStudioRentalPage },
            ],
          },

          { path: '*', Component: Error404Page },
        ],
      },
    ],
  },
];

const myRouter = createBrowserRouter(routes);

export const Router = () => {
  return <RouterProvider router={myRouter} useTransitions />;
};
