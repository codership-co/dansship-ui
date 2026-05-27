import { createBrowserRouter, RouterProvider } from 'react-router';

import { loggingMiddleware } from './middleware';

import { RootLayout } from '@components/layouts';
import { RootLoader } from '@components/loaders';
import { HomePage, UserLoader, UserPage } from '@pages';

const myRouter = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    middleware: [loggingMiddleware],
    hydrateFallbackElement: <RootLoader />,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: '/user/:id',
        Component: UserPage,
        loader: UserLoader,
      },
    ],
  },
]);

export const Router = () => {
  return <RouterProvider router={myRouter} useTransitions />;
};
