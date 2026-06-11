import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router';

import { loggingMiddleware } from './middleware';

import { RootLayout } from '@components/layouts';
import { RootLoader } from '@components/loaders';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import {
  Error404Page,
  FiguresPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  OnboardingPage,
  ResetPasswordPage,
  SignupPage,
  UserLoader,
  UserPage,
  VerifyEmailPage,
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
          { path: 'login', Component: LoginPage },
          { path: 'signup', Component: SignupPage },
          { path: 'forgot-password', Component: ForgotPasswordPage },
          { path: 'verify-email', Component: VerifyEmailPage },
          { path: 'reset-password', Component: ResetPasswordPage },
          {
            path: 'onboarding',
            Component: SecurityGuard(OnboardingPage, {
              redirect: PageURLS.auth.login,
              requiresAuth: true,
              featureFlags: [FEATURE_FLAG.isFiguresPageEnabled],
            }),
          },
        ],
      },

      { path: 'user/:id', Component: UserPage, loader: UserLoader },
      { path: 'figures', Component: FiguresPage },
      { path: 'figures/:id', Component: HomePage }, // WIP
      { path: 'browse', Component: HomePage }, // WIP
      { path: 'classes', Component: HomePage }, // WIP
      { path: 'instructor/dashboard', Component: HomePage }, // WIP

      {
        path: 'profile',
        children: [
          { index: true, Component: HomePage }, // WIP
          { path: 'edit', Component: HomePage }, // WIP
        ],
      },

      {
        path: 'figure',
        children: [
          { path: ':id', Component: HomePage }, // WIP
          { path: 'completed', Component: HomePage }, // WIP
          { path: 'saved', Component: HomePage }, // WIP
        ],
      },

      {
        path: 'my-account',
        children: [
          { path: 'subscription', Component: HomePage }, // WIP
          { path: 'bookings', Component: HomePage }, // WIP
        ],
      },

      {
        path: 'studio-rental',
        children: [
          { path: 'browse', Component: HomePage }, // WIP
          { path: 'requests', Component: HomePage }, // WIP
        ],
      },
      {
        path: 'admin',
        children: [
          { index: true, Component: HomePage }, // WIP
          { path: 'agenda', Component: HomePage }, // WIP
          { path: 'agenda/conflicts', Component: HomePage }, // WIP
          { path: 'inventory', Component: HomePage }, // WIP
          { path: 'schedule-builder', Component: HomePage }, // WIP
          { path: 'reports', Component: HomePage }, // WIP
          { path: 'bookings', Component: HomePage }, // WIP
          { path: 'payments', Component: HomePage }, // WIP
          { path: 'merch', Component: HomePage }, // WIP
          { path: 'merch/pos', Component: HomePage }, // WIP
          { path: 'figures', Component: HomePage }, // WIP
          { path: 'access', Component: HomePage }, // WIP
          { path: 'studio-rental', Component: HomePage }, // WIP
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
