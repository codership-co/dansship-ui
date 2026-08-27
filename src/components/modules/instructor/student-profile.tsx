import { useTranslation } from 'react-i18next';

import { type InstructorStudentProfile } from '@core/api';
import { DISCIPLINES_OPTIONS, GOALS_OPTIONS, LEVEL_OPTIONS } from '@core/constants';
import { classLevelLabelKey } from '@helpers';

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

function formatClassLevel(t: (key: string) => string, level: string | null | undefined, empty: string) {
  if (!level) {
    return empty;
  }

  const key = classLevelLabelKey(level);

  return key ? t(key) : translateStoredValue(t, LEVEL_OPTIONS, level);
}

export function StudentProfile({ profile }: StudentProfileProps) {
  const { t } = useTranslation();
  const empty = t('instructor:studentProfile.noData');

  const goals = profile.goals.map(value => translateStoredValue(t, GOALS_OPTIONS, value));
  const disciplines = profile.disciplines.map(value => translateStoredValue(t, DISCIPLINES_OPTIONS, value));
  const classLevels = (profile.class_levels ?? []).filter(item => item.level);
  const generalLevel = formatClassLevel(t, profile.current_level, empty);

  return (
    <dl className='grid gap-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6'>
      <ProfileField label={t('instructor:studentProfile.fullName')}>{profile.full_name || empty}</ProfileField>
      <ProfileField label={t('instructor:studentProfile.goals')}>
        {goals.length > 0 ? goals.join(', ') : empty}
      </ProfileField>
      <ProfileField label={t('instructor:studentProfile.disciplines')}>
        {disciplines.length > 0 ? disciplines.join(', ') : empty}
      </ProfileField>
      {classLevels.length > 0 ? (
        <ProfileField label={t('instructor:studentProfile.classLevels')}>
          <ul className='m-0 grid list-none gap-2 p-0'>
            {classLevels.map(item => (
              <li key={item.class_definition_id} className='flex flex-wrap justify-between gap-2'>
                <span>{item.class_type_name}</span>
                <span>{formatClassLevel(t, item.level, empty)}</span>
              </li>
            ))}
          </ul>
        </ProfileField>
      ) : (
        <ProfileField label={t('instructor:studentProfile.currentLevel')}>{generalLevel}</ProfileField>
      )}
    </dl>
  );
}
