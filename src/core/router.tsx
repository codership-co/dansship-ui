import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router';

import { loggingMiddleware } from './middleware';

import { RootLayout } from '@components/layouts';
import { RootLoader } from '@components/loaders';
import {
  Error404Page,
  HomePage,
  SecureAdminAccessPage,
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
  SecureResetPasswordPage,
  SecureSignupPage,
  SecureStudioRentalBrowsePage,
  SecureStudioRentalRequestsPage,
  SecureVerifyEmailPage,
  UserLoader,
  UserPage,
} from '@pages';

/* eslint-disable line-comment-position */ // This is temporal meanwhile I can finish the migration of all pages
const routes: Array<RouteObject> = [
  {
    path: '/',
    Component: RootLayout,
    middleware: [loggingMiddleware],
    hydrateFallbackElement: <RootLoader />,
    children: [
      { index: true, Component: HomePage },

      {
        path: 'auth',
        children: [
          { path: 'login', Component: SecureLoginPage },
          { path: 'signup', Component: SecureSignupPage },
          { path: 'forgot-password', Component: SecureForgotPasswordPage },
          { path: 'verify-email', Component: SecureVerifyEmailPage },
          { path: 'reset-password', Component: SecureResetPasswordPage },
          { path: 'onboarding', Component: SecureOnboardingPage },
        ],
      },

      { path: 'user/:id', Component: UserPage, loader: UserLoader },
      { path: 'figures', Component: SecureFiguresPage },
      { path: 'figures/:id', Component: SecureFiguresDetailsPage },
      { path: 'classes', Component: SecureClassesPage },
      { path: 'instructor/dashboard', Component: SecureInstructorDashboardPage }, // WIP

      {
        path: 'profile',
        children: [
          { index: true, Component: SecureProfilePage }, // WIP
          { path: 'edit', Component: SecureProfileEditPage }, // WIP
        ],
      },

      {
        path: 'figure',
        children: [
          { path: 'completed', Component: SecureFigureCompletedPage }, // WIP
          { path: 'saved', Component: SecureFigureSavedPage }, // WIP
        ],
      },

      {
        path: 'my-account',
        children: [
          { path: 'subscription', Component: SecureMyAccountSubscriptionPage }, // WIP
          { path: 'bookings', Component: SecureMyAccountBookingsPage },
        ],
      },

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
          { index: true, Component: SecureAdminPage }, // WIP
          { path: 'agenda', Component: SecureAdminAgendaPage }, // WIP
          { path: 'agenda/conflicts', Component: SecureAdminAgendaConflictsPage }, // WIP
          { path: 'inventory', Component: SecureAdminInventoryPage }, // WIP
          { path: 'schedule-builder', Component: SecureAdminScheduleBuilderPage }, // WIP
          { path: 'reports', Component: SecureAdminReportsPage }, // WIP
          { path: 'bookings', Component: SecureAdminBookingsPage }, // WIP
          { path: 'payments', Component: SecureAdminPaymentsPage }, // WIP
          { path: 'merch', Component: SecureAdminMerchPage }, // WIP
          { path: 'merch/pos', Component: SecureAdminMerchPosPage }, // WIP
          { path: 'figures', Component: SecureAdminFiguresPage }, // WIP
          { path: 'access', Component: SecureAdminAccessPage }, // WIP
          { path: 'studio-rental', Component: SecureAdminStudioRentalPage }, // WIP
        ],
      },
      { path: '*', Component: Error404Page },
    ],
  },
];
/* eslint-enable */

const myRouter = createBrowserRouter(routes);

export const Router = () => {
  return <RouterProvider router={myRouter} useTransitions />;
};
