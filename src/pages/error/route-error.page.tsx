import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import { RootLoader } from '@components/loaders/root-loader';
import { isDynamicImportError, reloadForStaleChunk } from '@helpers';
import { Error404Page } from '@pages/error/404.page';

export function RouteErrorPage() {
  const error = useRouteError();
  const staleChunk = isDynamicImportError(error);

  useEffect(() => {
    if (staleChunk) {
      reloadForStaleChunk();
    }
  }, [staleChunk]);

  if (staleChunk) {
    return <RootLoader />;
  }

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <Error404Page />;
  }

  return <Error404Page />;
}
