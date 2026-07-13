import { PageURLS } from '@core/constants';

/**
 * Determines the redirect path based on user roles.
 * Priority order: admin > instructor > no role
 */
export function getRedirectPathByRole(roles?: Array<string>): string {
  if (!roles || roles.length === 0) {
    return PageURLS.classes;
  }

  if (roles.includes('admin')) {
    return PageURLS.admin.reports;
  }

  if (roles.includes('instructor')) {
    return PageURLS.profile;
  }

  return PageURLS.classes;
}
