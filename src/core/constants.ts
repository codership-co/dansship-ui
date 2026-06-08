export const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export const languageCodes = languages.map(l => l.code);
export type LanguageCode = (typeof languageCodes)[number];

export const PageURLS = {
  home: '/',
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    forgotPassword: '/auth/forgot-password',
    verifyEmail: '/auth/verify-email',
    resetPassword: '/auth/reset-password',
  },
  userId: (id: string) => `/user/${id}`,
  figures: '/figures',
  figuresById: (id: string) => `/figures/${id}`,
  browse: '/browse',
  onboarding: '/onboarding',
  classes: '/classes',
  instructorDashboard: '/instructor/dashboard',
  profile: '/profile',
  profileEdit: '/profile/edit',
  figureById: (id: string) => `/figure/${id}`,
  figureCompleted: '/figure/completed',
  figureSaved: '/figure/saved',
  myAccountSubscription: '/my-account/subscription',
  myAccountBookings: '/my-account/bookings',
  studioRentalBrowse: '/studio-rental/browse',
  studioRentalRequests: '/studio-rental/requests',
  admin: {
    root: '/admin',
    agenda: '/admin/agenda',
    agendaConflicts: '/admin/agenda/conflicts',
    inventory: '/admin/inventory',
    scheduleBuilder: '/admin/schedule-builder',
    reports: '/admin/reports',
    bookings: '/admin/bookings',
    payments: '/admin/payments',
    merch: '/admin/merch',
    merchPos: '/admin/merch/pos',
    figures: '/admin/figures',
    access: '/admin/access',
    studioRental: '/admin/studio-rental',
  },
} as const;
