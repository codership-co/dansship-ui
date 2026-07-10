import { PageURLS } from '@core/constants';
import { ROLE } from '@core/permissions';

import type { AuthUser, User } from './auth.models';

const extractUsername = (email?: string): string => email?.split('@')[0] || 'user';

const getUserRoles = (authUser: AuthUser) => {
  const userRoles = authUser.roles ?? [ROLE.USER];

  return userRoles.map((r: string) => r.toLowerCase() as ROLE);
};

export const mapAuthUserToUser = (authUser: AuthUser): User => {
  const username = extractUsername(authUser.email);
  const roles = getUserRoles(authUser);
  const permissions = authUser.permissions || [];
  const fullName = authUser.full_name || username;
  const displayName = authUser.display_name || fullName;
  let baseProfileRedirect: string = PageURLS.classes;

  if (roles.includes(ROLE.ADMIN)) {
    baseProfileRedirect = PageURLS.admin.reports;
  } else if (roles.includes(ROLE.INSTRUCTOR)) {
    baseProfileRedirect = PageURLS.instructorDashboard;
  }

  return {
    id: authUser.id,
    username,
    baseProfileRedirect,
    email: authUser.email || '',
    birthDate: authUser.birth_date ?? undefined,
    preferredLanguage: authUser.preferred_language,
    name: displayName,
    fullName,
    displayName,
    phoneCountryCode: authUser.phone_country_code ?? undefined,
    phoneNumber: authUser.phone_number ?? undefined,
    documentType: authUser.document_type ?? undefined,
    documentValue: authUser.document_value ?? undefined,
    city: authUser.city ?? undefined,
    address: authUser.address ?? undefined,
    isAdmin: roles.includes(ROLE.ADMIN),
    isInstructor: roles.includes(ROLE.INSTRUCTOR),
    isCoach: roles.includes(ROLE.COACH),
    roles: roles,
    permissions: permissions,
    isActive: authUser.is_active,
    isEmailVerified: authUser.is_email_verified,
    requiresOnboarding: authUser.requires_onboarding,
    onboardingCompleted: authUser.onboarding_completed,
    onboardingPendingSteps: authUser.onboarding_pending_steps || [],
    updatedAt: authUser.updated_at,
    hasInstructorProfile: authUser.has_instructor_profile,
    profileCompletionPercent: authUser.profile_completion_percent,
    instructorProfile: authUser.instructor_profile
      ? {
          id: authUser.instructor_profile.id,
          bio: authUser.instructor_profile.bio,
          photoUrl: authUser.instructor_profile.photo_url,
          contactInfo: authUser.instructor_profile.contact_info,
          createdAt: authUser.instructor_profile.created_at,
          updatedAt: authUser.instructor_profile.updated_at,
          completionPercent: authUser.instructor_profile.completion_percent,
        }
      : null,
    joinDate: authUser.created_at || new Date().toISOString(),
    level: 'Beginner',
  };
};
