import { Button } from 'polpo/components';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { type AdminUserDetailsResponse, type AdminUserHealthProfile, type AdminUserPreferences } from '@core/api';
import { PageURLS } from '@core/constants';
import { buildRegisteredPhoneWhatsAppLink, formatDate } from '@helpers';

interface UserDetailsHeaderProps {
  userId: string;
  email?: string | null;
  isLoading?: boolean;
}

export function UserDetailsHeader({ userId, email, isLoading = false }: UserDetailsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <div>
        {isLoading && !email ? (
          <div className='h-7 w-56 animate-pulse rounded-md bg-muted' aria-hidden />
        ) : email ? (
          <h4 className='text-primary'>{email}</h4>
        ) : null}
        <p className='mt-1 font-mono text-sm text-muted-foreground'>{userId}</p>
      </div>

      <Link to={PageURLS.admin.users} viewTransition>
        <Button color='primary' size='small' variant='flat'>
          {t('admin:users.details.backToList')}
        </Button>
      </Link>
    </div>
  );
}

interface UserDetailsProps {
  user?: AdminUserDetailsResponse | null;
  isLoading: boolean;
  hasError: boolean;
}

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function displayList(values: Array<string> | null | undefined): string {
  if (!values?.length) {
    return '-';
  }

  return values.join(', ');
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>{label}</dt>
      <dd className='mt-1 text-sm text-foreground'>{value}</dd>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='grid gap-4'>
      <h5 className='text-sm font-semibold text-foreground'>{title}</h5>
      <dl className='grid gap-6 rounded-[calc(var(--radius)+4px)] bg-background-paper p-5 sm:grid-cols-2'>
        {children}
      </dl>
    </section>
  );
}

function HealthFields({
  health,
  t,
}: {
  health: AdminUserHealthProfile | null | undefined;
  t: (key: string) => string;
}) {
  const phone =
    health?.emergency_contact_phone_country_code || health?.emergency_contact_phone_number
      ? `${health?.emergency_contact_phone_country_code ?? ''} ${health?.emergency_contact_phone_number ?? ''}`.trim()
      : '-';

  return (
    <>
      <DetailField
        label={t('admin:users.details.health.emergencyContactName')}
        value={displayValue(health?.emergency_contact_name)}
      />
      <DetailField
        label={t('admin:users.details.health.emergencyContactRelative')}
        value={displayValue(health?.emergency_contact_relative)}
      />
      <DetailField label={t('admin:users.details.health.emergencyContactPhone')} value={phone} />
      <DetailField label={t('admin:users.details.health.eps')} value={displayValue(health?.eps)} />
      <div className='sm:col-span-2'>
        <DetailField
          label={t('admin:users.details.health.medicalConditions')}
          value={displayValue(health?.existing_medical_conditions)}
        />
      </div>
    </>
  );
}

function PreferenceFields({
  preferences,
  t,
}: {
  preferences: AdminUserPreferences | null | undefined;
  t: (key: string) => string;
}) {
  return (
    <>
      <DetailField
        label={t('admin:users.details.preferences.heardAboutUs')}
        value={displayValue(preferences?.heard_about_us)}
      />
      <DetailField
        label={t('admin:users.details.preferences.currentLevel')}
        value={displayValue(preferences?.current_level)}
      />
      <DetailField label={t('admin:users.details.preferences.goals')} value={displayList(preferences?.goals)} />
      <DetailField
        label={t('admin:users.details.preferences.disciplines')}
        value={displayList(preferences?.disciplines)}
      />
      <div className='sm:col-span-2'>
        <DetailField
          label={t('admin:users.details.preferences.preferredSchedules')}
          value={displayList(preferences?.preferred_schedules)}
        />
      </div>
    </>
  );
}

export function UserDetails({ user, isLoading, hasError }: UserDetailsProps) {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return (
      <div className='grid place-content-center rounded-3xl bg-white/50 px-8 py-16 text-center'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  if (hasError || !user) {
    return (
      <section className='grid gap-4 place-content-center rounded-3xl bg-white/50 px-8 py-16 text-center'>
        <p>{t('admin:users.details.notFound')}</p>
        <Link to={PageURLS.admin.users} viewTransition>
          <Button color='primary' size='small' variant='flat'>
            {t('admin:users.details.backToList')}
          </Button>
        </Link>
      </section>
    );
  }

  const phoneLabel =
    user.phone_country_code || user.phone_number
      ? `${user.phone_country_code ?? ''} ${user.phone_number ?? ''}`.trim()
      : '-';
  const phoneHref = buildRegisteredPhoneWhatsAppLink(user.phone_country_code, user.phone_number);
  const document =
    user.document_type || user.document_value ? `${user.document_type ?? ''} ${user.document_value ?? ''}`.trim() : '-';
  const instructor = user.instructor_profile;
  const availability = instructor?.availability ?? [];
  const disciplines = instructor?.disciplines ?? [];
  const certifications = instructor?.certifications ?? [];

  return (
    <div className='grid gap-8'>
      <DetailSection title={t('admin:users.details.sections.profile')}>
        <DetailField label={t('admin:users.columns.fullName')} value={displayValue(user.full_name)} />
        <DetailField label={t('admin:users.details.alias')} value={displayValue(user.display_name)} />
        <DetailField
          label={t('admin:users.details.birthDate')}
          value={user.birth_date ? formatDate(user.birth_date, i18n.language) : '-'}
        />
        <DetailField
          label={t('admin:users.details.phoneNumber')}
          value={
            phoneHref ? (
              <a
                href={phoneHref}
                target='_blank'
                rel='noreferrer'
                className='text-primary underline underline-offset-2'
              >
                {phoneLabel}
              </a>
            ) : (
              phoneLabel
            )
          }
        />
        <DetailField label={t('admin:users.details.documentNumber')} value={document} />
        <DetailField label={t('admin:users.details.city')} value={displayValue(user.city)} />
        <DetailField label={t('admin:users.details.address')} value={displayValue(user.address)} />
        <DetailField label={t('admin:users.details.preferredLanguage')} value={displayValue(user.preferred_language)} />
        <DetailField
          label={t('admin:users.details.isActive')}
          value={user.is_active ? t('common:yes', { defaultValue: 'Sí' }) : t('common:no', { defaultValue: 'No' })}
        />
        <DetailField
          label={t('admin:users.details.isEmailVerified')}
          value={
            user.is_email_verified ? t('common:yes', { defaultValue: 'Sí' }) : t('common:no', { defaultValue: 'No' })
          }
        />
        <DetailField
          label={t('admin:users.details.onboardingCompleted')}
          value={
            user.onboarding_completed ? t('common:yes', { defaultValue: 'Sí' }) : t('common:no', { defaultValue: 'No' })
          }
        />
        <div className='sm:col-span-2'>
          <DetailField
            label={t('admin:users.details.pendingSteps')}
            value={displayList(user.onboarding_pending_steps)}
          />
        </div>
        <div className='sm:col-span-2'>
          <dt className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
            {t('admin:users.columns.roles')}
          </dt>
          <dd className='mt-2 flex flex-wrap gap-2'>
            {user.roles.length > 0 ? (
              user.roles.map(role => (
                <span
                  key={role}
                  className='rounded-(--radius) bg-[hsl(var(--surface-container-highest))] px-2 py-1 text-sm text-foreground'
                >
                  {role}
                </span>
              ))
            ) : (
              <span className='text-sm text-muted-foreground'>{t('admin:users.noRoles')}</span>
            )}
          </dd>
        </div>
      </DetailSection>

      <DetailSection title={t('admin:users.details.sections.health')}>
        <HealthFields health={user.health_profile} t={t} />
      </DetailSection>

      <DetailSection title={t('admin:users.details.sections.preferences')}>
        <PreferenceFields preferences={user.preferences} t={t} />
      </DetailSection>

      {user.has_instructor_profile ? (
        <section className='grid gap-4'>
          <h5 className='text-sm font-semibold text-foreground'>
            {t('admin:users.details.sections.instructorOnboarding')}
          </h5>
          <dl className='grid gap-6 rounded-[calc(var(--radius)+4px)] bg-background-paper p-5 sm:grid-cols-2'>
            <DetailField
              label={t('admin:users.details.instructor.onboardingCompleted')}
              value={
                user.instructor_onboarding_completed
                  ? t('common:yes', { defaultValue: 'Sí' })
                  : t('common:no', { defaultValue: 'No' })
              }
            />
            <DetailField
              label={t('admin:users.details.instructor.businessStatus')}
              value={displayValue(user.instructor_business_status ?? instructor?.business_status)}
            />
            <DetailField
              label={t('admin:users.details.instructor.instagram')}
              value={displayValue(instructor?.instagram)}
            />
            <DetailField label={t('admin:users.details.instructor.bio')} value={displayValue(instructor?.bio)} />
          </dl>

          <div className='grid gap-2'>
            <h6 className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
              {t('admin:users.details.instructor.availability')}
            </h6>
            {availability.length === 0 ? (
              <p className='text-sm text-muted-foreground'>{t('admin:users.details.instructor.emptyAvailability')}</p>
            ) : (
              <div className='rounded-md border bg-white/50'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin:users.details.instructor.columns.day')}</TableHead>
                      <TableHead>{t('admin:users.details.instructor.columns.start')}</TableHead>
                      <TableHead>{t('admin:users.details.instructor.columns.end')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availability.map(slot => (
                      <TableRow key={`${slot.day_of_week}-${slot.start_time}-${slot.end_time}`}>
                        <TableCell>
                          {t(`common:days.${slot.day_of_week}`, { defaultValue: slot.day_of_week })}
                        </TableCell>
                        <TableCell>{slot.start_time}</TableCell>
                        <TableCell>{slot.end_time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className='grid gap-2'>
            <h6 className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
              {t('admin:users.details.instructor.disciplines')}
            </h6>
            {disciplines.length === 0 ? (
              <p className='text-sm text-muted-foreground'>{t('admin:users.details.instructor.emptyDisciplines')}</p>
            ) : (
              <div className='rounded-md border bg-white/50'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin:users.details.instructor.columns.discipline')}</TableHead>
                      <TableHead>{t('admin:users.details.instructor.columns.years')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disciplines.map(item => (
                      <TableRow key={item.discipline_name}>
                        <TableCell>{item.discipline_name}</TableCell>
                        <TableCell>{item.years_experience}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className='grid gap-2'>
            <h6 className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
              {t('admin:users.details.instructor.certifications')}
            </h6>
            {certifications.length === 0 ? (
              <p className='text-sm text-muted-foreground'>{t('admin:users.details.instructor.emptyCertifications')}</p>
            ) : (
              <div className='rounded-md border bg-white/50'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin:users.details.instructor.columns.title')}</TableHead>
                      <TableHead>{t('admin:users.details.instructor.columns.issuer')}</TableHead>
                      <TableHead>{t('admin:users.details.instructor.columns.issueDate')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certifications.map(cert => (
                      <TableRow key={cert.id}>
                        <TableCell>{cert.title}</TableCell>
                        <TableCell>{cert.issuer}</TableCell>
                        <TableCell>{cert.issue_date ? formatDate(cert.issue_date, i18n.language) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
