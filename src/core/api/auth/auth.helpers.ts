import type { AuthUser, User } from './auth.models';

const extractUsername = (email?: string): string => email?.split('@')[0] || 'user';

export const mapAuthUserToUser = (authUser: AuthUser): User => {
  const username = extractUsername(authUser.email);
  const roles = authUser.roles || [];
  const permissions = authUser.permissions || [];
  const hasInstructorRole = roles.some(role => ['instructor', 'coach'].includes(role.toLowerCase()));
  const fullName = authUser.full_name || username;
  const displayName = authUser.display_name || fullName;

  return {
    id: authUser.id,
    username,
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
    isCoach: hasInstructorRole,
    roles: roles,
    permissions: permissions,
    isActive: authUser.is_active,
    isEmailVerified: authUser.is_email_verified,
    requiresOnboarding: authUser.requires_onboarding,
    onboardingRequired: authUser.onboarding_required,
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
