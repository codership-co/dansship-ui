import { wrapCreateBrowserRouterV7 } from '@sentry/react';
import { createBrowserRouter, redirect, type RouteObject, RouterProvider } from 'react-router';

import { loggingMiddleware } from './middleware';

import { RouterAuthLayout } from '@components/layouts/router-auth-layout';
import { RouterPageLayout } from '@components/layouts/router-page-layout';
import { RouterRootLayout } from '@components/layouts/router-root-layout';
import { PageURLS } from '@core/constants';
import {
  Error404Page,
  HalloweenPage,
  HomePage,
  LocationPage,
  PaymentsResultsLoader,
  SecureAdminAgendaConflictsPage,
  SecureAdminAgendaPage,
  SecureAdminBookingsPage,
  SecureAdminCampaignsPage,
  SecureAdminClassRosterPage,
  SecureAdminFiguresPage,
  SecureAdminInventoryPage,
  SecureAdminMerchPage,
  SecureAdminMerchPosPage,
  SecureAdminPaymentAssignmentsPage,
  SecureAdminPaymentsPage,
  SecureAdminReportsPage,
  SecureAdminScheduleBuilderPage,
  SecureAdminStudioRentalPage,
  SecureAdminEventosPage,
  SecureAdminEventoComboEditPage,
  SecureAdminEventoEditPage,
  SecureAdminUserDetailsPage,
  SecureAdminUserEditPage,
  SecureAdminUserListPage,
  SecureAdminUserPlanPurchasePage,
  SecureAdminUserRegisterPage,
  SecureBookingsPage,
  SecureClassesPage,
  SecureFigureCompletedPage,
  SecureFigureSavedPage,
  SecureFiguresDetailsPage,
  SecureFiguresPage,
  SecureChangePasswordPage,
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
  SecureEventosPage,
  SecureEventoLandingPage,
  SecureManagedEventsPage,
  SecureManagedEventDetailPage,
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
      { path: 'halloween', Component: HalloweenPage },
      {
        Component: RouterPageLayout,
        children: [
          { index: true, Component: HomePage },
          { path: 'plans', Component: SecurePlansPage },
          { path: 'eventos', Component: SecureEventosPage },
          { path: 'eventos/managed', Component: SecureManagedEventsPage },
          { path: 'eventos/managed/:eventId', Component: SecureManagedEventDetailPage },
          { path: 'eventos/:slug', Component: SecureEventoLandingPage },
          {
            path: 'talleres',
            loader: ({ request }) => redirect(`${PageURLS.eventos}${new URL(request.url).search}`),
          },
          {
            path: 'talleres/managed',
            loader: ({ request }) => redirect(`${PageURLS.managedEvents}${new URL(request.url).search}`),
          },
          {
            path: 'talleres/managed/:eventId',
            loader: ({ params, request }) =>
              redirect(`${PageURLS.managedEvent(params.eventId ?? '')}${new URL(request.url).search}`),
          },
          {
            path: 'talleres/:slug',
            loader: ({ params, request }) =>
              redirect(`${PageURLS.eventoLanding(params.slug ?? '')}${new URL(request.url).search}`),
          },
          {
            path: 'workshops',
            loader: ({ request }) => redirect(`${PageURLS.eventos}${new URL(request.url).search}`),
          },
          {
            path: 'workshops/managed',
            loader: ({ request }) => redirect(`${PageURLS.managedEvents}${new URL(request.url).search}`),
          },
          {
            path: 'workshops/managed/:eventId',
            loader: ({ params, request }) =>
              redirect(`${PageURLS.managedEvent(params.eventId ?? '')}${new URL(request.url).search}`),
          },
          {
            path: 'workshops/:slug',
            loader: ({ params, request }) =>
              redirect(`${PageURLS.eventoLanding(params.slug ?? '')}${new URL(request.url).search}`),
          },
          { path: 'classes', Component: SecureClassesPage },
          { path: 'legal', Component: SecureLegalPage },
          { path: 'location', Component: LocationPage },
          { path: 'ui', Component: UiPage },

          { path: 'auth/onboarding', Component: SecureOnboardingPage },
          { path: 'auth/change-password', Component: SecureChangePasswordPage },

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
              { index: true, loader: () => redirect(PageURLS.admin.reports) },
              { path: 'agenda', Component: SecureAdminAgendaPage },
              { path: 'agenda/conflicts', Component: SecureAdminAgendaConflictsPage },
              { path: 'inventory', Component: SecureAdminInventoryPage },
              { path: 'payment-assignments', Component: SecureAdminPaymentAssignmentsPage },
              { path: 'schedule-builder', Component: SecureAdminScheduleBuilderPage },
              { path: 'reports', Component: SecureAdminReportsPage },
              { path: 'bookings', Component: SecureAdminBookingsPage },
              { path: 'payments', Component: SecureAdminPaymentsPage },
              { path: 'merch', Component: SecureAdminMerchPage },
              { path: 'merch/pos', Component: SecureAdminMerchPosPage },
              { path: 'figures', Component: SecureAdminFiguresPage },
              { path: 'users', Component: SecureAdminUserListPage },
              { path: 'users/new', Component: SecureAdminUserRegisterPage },
              { path: 'users/:userId/edit', Component: SecureAdminUserEditPage },
              { path: 'users/:userId/plan-purchase', Component: SecureAdminUserPlanPurchasePage },
              { path: 'users/:userId', Component: SecureAdminUserDetailsPage },
              { path: 'classes/:classId/roster', Component: SecureAdminClassRosterPage },
              { path: 'studio-rental', Component: SecureAdminStudioRentalPage },
              {
                path: 'door-code',
                loader: () => redirect(`${PageURLS.admin.inventory}?tab=doorCode`),
              },
              { path: 'campaigns', Component: SecureAdminCampaignsPage },
              { path: 'eventos', Component: SecureAdminEventosPage },
              { path: 'eventos/new', Component: SecureAdminEventoEditPage },
              { path: 'eventos/combos/new', Component: SecureAdminEventoComboEditPage },
              { path: 'eventos/combos/:comboId', Component: SecureAdminEventoComboEditPage },
              { path: 'eventos/:eventId', Component: SecureAdminEventoEditPage },
              {
                path: 'workshops',
                loader: ({ request }) => redirect(`${PageURLS.admin.eventos}${new URL(request.url).search}`),
              },
              {
                path: 'workshops/new',
                loader: ({ request }) => redirect(`${PageURLS.admin.eventoNew}${new URL(request.url).search}`),
              },
              {
                path: 'workshops/combos/new',
                loader: ({ request }) => redirect(`${PageURLS.admin.eventoComboNew}${new URL(request.url).search}`),
              },
              {
                path: 'workshops/combos/:comboId',
                loader: ({ params, request }) =>
                  redirect(`${PageURLS.admin.eventoComboEdit(params.comboId ?? '')}${new URL(request.url).search}`),
              },
              {
                path: 'workshops/:eventId',
                loader: ({ params, request }) =>
                  redirect(`${PageURLS.admin.eventoEdit(params.eventId ?? '')}${new URL(request.url).search}`),
              },
              {
                path: 'talleres',
                loader: ({ request }) => redirect(`${PageURLS.admin.eventos}${new URL(request.url).search}`),
              },
              {
                path: 'talleres/new',
                loader: ({ request }) => redirect(`${PageURLS.admin.eventoNew}${new URL(request.url).search}`),
              },
              {
                path: 'talleres/combos/new',
                loader: ({ request }) => redirect(`${PageURLS.admin.eventoComboNew}${new URL(request.url).search}`),
              },
              {
                path: 'talleres/combos/:comboId',
                loader: ({ params, request }) =>
                  redirect(`${PageURLS.admin.eventoComboEdit(params.comboId ?? '')}${new URL(request.url).search}`),
              },
              {
                path: 'talleres/:eventId',
                loader: ({ params, request }) =>
                  redirect(`${PageURLS.admin.eventoEdit(params.eventId ?? '')}${new URL(request.url).search}`),
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
