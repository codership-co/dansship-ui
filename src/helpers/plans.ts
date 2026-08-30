const SYSTEM_PLAN_I18N_KEYS: Record<string, string> = {
  SYSTEM_TRIAL_CLASS: 'subscriptions:systemPlans.trialClass',
  'Clase de prueba': 'subscriptions:systemPlans.trialClass',
  SYSTEM_REFERRAL_CLASS: 'subscriptions:systemPlans.referralClass',
  'Clase por referido': 'subscriptions:systemPlans.referralClass',
};

/** Maps internal system plan codes to localized display names. */
export function resolvePlanDisplayName(name: string, t: (key: string) => string): string {
  const i18nKey = SYSTEM_PLAN_I18N_KEYS[name];

  return i18nKey ? t(i18nKey) : name;
}
