export const CLASS_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export type ClassLevelValue = (typeof CLASS_LEVELS)[number];

export function isClassLevel(value: string | null | undefined): value is ClassLevelValue {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

export function classLevelLabelKey(level: string | null | undefined) {
  if (!isClassLevel(level)) {
    return null;
  }

  return `auth:onboarding.levelOptions.${level}` as const;
}
