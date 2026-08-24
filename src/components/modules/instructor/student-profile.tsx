import { useTranslation } from 'react-i18next';

import { type InstructorStudentProfile } from '@core/api';
import { DISCIPLINES_OPTIONS, GOALS_OPTIONS, LEVEL_OPTIONS } from '@core/constants';

interface StudentProfileProps {
  profile: InstructorStudentProfile;
}

function translateStoredValue(
  t: (key: string) => string,
  options: Array<{ value: string; label: string }>,
  value: string,
) {
  const match = options.find(option => option.value === value);

  return match ? t(match.label) : value;
}

function ProfileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='grid gap-1'>
      <dt className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>{label}</dt>
      <dd className='m-0 text-base text-foreground'>{children}</dd>
    </div>
  );
}

export function StudentProfile({ profile }: StudentProfileProps) {
  const { t } = useTranslation();
  const empty = t('instructor:studentProfile.noData');

  const goals = profile.goals.map(value => translateStoredValue(t, GOALS_OPTIONS, value));
  const disciplines = profile.disciplines.map(value => translateStoredValue(t, DISCIPLINES_OPTIONS, value));
  const level = profile.current_level ? translateStoredValue(t, LEVEL_OPTIONS, profile.current_level) : empty;

  return (
    <dl className='grid gap-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6'>
      <ProfileField label={t('instructor:studentProfile.fullName')}>{profile.full_name || empty}</ProfileField>
      <ProfileField label={t('instructor:studentProfile.goals')}>
        {goals.length > 0 ? goals.join(', ') : empty}
      </ProfileField>
      <ProfileField label={t('instructor:studentProfile.disciplines')}>
        {disciplines.length > 0 ? disciplines.join(', ') : empty}
      </ProfileField>
      <ProfileField label={t('instructor:studentProfile.currentLevel')}>{level}</ProfileField>
    </dl>
  );
}
