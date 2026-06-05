/**
 * Determines the redirect path based on user roles.
 * Priority order: admin > instructor > no role
 */
export function getRedirectPathByRole(roles?: Array<string>): string {
  if (!roles || roles.length === 0) {
    // No role -> Book a Class page
    return '/classes';
  }

  // Check for admin role first (highest priority)
  if (roles.includes('admin')) {
    return '/admin/reports';
  }

  // Check for instructor role second
  if (roles.includes('instructor')) {
    return '/instructor/dashboard';
  }

  // Default to Book a Class if no matching role
  return '/classes';
}
