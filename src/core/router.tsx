import { createBrowserRouter, RouterProvider } from 'react-router';

import { loggingMiddleware } from './middleware';

import { RootLayout } from '@components/layouts';
import { RootLoader } from '@components/loaders';
import {
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  ResetPasswordPage,
  SignupPage,
  UserLoader,
  UserPage,
  VerifyEmailPage,
} from '@pages';

const myRouter = createBrowserRouter([
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
        ],
      },

      { path: 'user/:id', Component: UserPage, loader: UserLoader },
      { path: 'figures', Component: HomePage },
      { path: 'figures/:id', Component: HomePage },
      { path: 'browse', Component: HomePage },
      { path: 'figure/:id', Component: HomePage },
      { path: 'onboarding', Component: HomePage },
      { path: 'classes', Component: HomePage },
      { path: 'instructor/dashboard', Component: HomePage },

      {
        path: 'profile',
        children: [
          { index: true, Component: HomePage },
          { path: 'edit', Component: HomePage },
        ],
      },

      {
        path: 'figure',
        children: [
          { path: 'completed', Component: HomePage },
          { path: 'saved', Component: HomePage },
        ],
      },

      {
        path: 'my-account',
        children: [
          { path: 'subscription', Component: HomePage },
          { path: 'bookings', Component: HomePage },
        ],
      },

      {
        path: 'studio-rental',
        children: [
          { path: 'browse', Component: HomePage },
          { path: 'requests', Component: HomePage },
        ],
      },
      {
        path: 'admin',
        children: [
          { index: true, Component: HomePage },
          { path: 'agenda', Component: HomePage },
          { path: 'agenda/conflicts', Component: HomePage },
          { path: 'inventory', Component: HomePage },
          { path: 'schedule-builder', Component: HomePage },
          { path: 'reports', Component: HomePage },
          { path: 'bookings', Component: HomePage },
          { path: 'payments', Component: HomePage },
          { path: 'merch', Component: HomePage },
          { path: 'merch/pos', Component: HomePage },
          { path: 'figures', Component: HomePage },
          { path: 'access', Component: HomePage },
          { path: 'studio-rental', Component: HomePage },
        ],
      },
    ],
  },
]);

export const Router = () => {
  return <RouterProvider router={myRouter} useTransitions />;
};
