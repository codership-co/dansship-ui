import { Button, SmartTable } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft, LuChevronRight, LuSearch } from 'react-icons/lu';
import { Link } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { Checkbox, Input, Label } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { useCallablePromise } from '@hooks';

const PAGE_SIZE = 20;

type UserSearchForm = {
  search: string;
};

export function UserList() {
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isInstructorOnly, setIsInstructorOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const { t } = useTranslation();
  const { register, watch } = useForm<UserSearchForm>({
    defaultValues: { search: '' },
  });
  const searchInput = watch('search');

  const {
    response: usersResponse,
    isLoading,
    call: fetchUsers,
  } = useCallablePromise((params: { search?: string; is_instructor?: boolean; limit: number; offset: number }) =>
    DansshipAPI.usersAdmin.search(params),
  );

  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch, isInstructorOnly]);

  useEffect(() => {
    const shouldSearch = debouncedSearch.length > 2;
    void fetchUsers({
      search: shouldSearch ? debouncedSearch : undefined,
      is_instructor: isInstructorOnly ? true : undefined,
      limit: PAGE_SIZE,
      offset,
    });
  }, [debouncedSearch, fetchUsers, isInstructorOnly, offset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const page = usersResponse?.data;
  const users = page?.items ?? [];
  const total = page?.total ?? 0;
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  return (
    <section className='grid gap-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='grid gap-3 sm:grid-cols-[minmax(16rem,24rem)_auto] sm:items-end'>
          <div className='grid gap-2'>
            <Label htmlFor='user-search'>{t('admin:users.searchLabel')}</Label>
            <div className='relative'>
              <LuSearch className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                id='user-search'
                className='pl-9'
                placeholder={t('admin:users.searchPlaceholder')}
                {...register('search')}
              />
            </div>
          </div>

          <label className='flex items-center gap-2 pb-2 text-sm'>
            <Checkbox checked={isInstructorOnly} onCheckedChange={checked => setIsInstructorOnly(checked === true)} />
            {t('admin:users.instructorFilter')}
          </label>
        </div>

        <p className='text-sm text-muted-foreground'>{t('admin:users.total', { count: total })}</p>
      </div>

      {isLoading ? (
        <div className='grid place-content-center rounded-3xl bg-white/50 px-8 py-16 text-center'>
          <SpinnerLoader message={t('admin:users.loading')} />
        </div>
      ) : !users.length ? (
        <section className='grid place-content-center rounded-3xl bg-white/50 px-8 py-16 text-center'>
          <p>{t(debouncedSearch.length ? 'admin:users.noUsersFound' : 'admin:users.empty')}</p>
        </section>
      ) : (
        <section className='grid gap-4'>
          <SmartTable
            rowId='id'
            data={users}
            className='rounded-3xl'
            tableClassName='bg-white/50'
            columns={[
              {
                header: t('admin:users.columns.fullName'),
                render: row => <label>{row.full_name}</label>,
                sortBy: 'full_name',
              },
              {
                header: t('common:email'),
                render: row => <label>{row.email}</label>,
                sortBy: 'email',
              },
              {
                header: t('admin:users.columns.profileCompleted'),
                render: row => (
                  <label>
                    {row.onboarding_completed
                      ? t('common:yes', { defaultValue: 'Sí' })
                      : t('common:no', { defaultValue: 'No' })}
                  </label>
                ),
              },
              {
                header: '',
                render: row => (
                  <Link to={PageURLS.admin.userDetails(row.id)} viewTransition>
                    <Button color='primary' size='small' variant='flat' className='whitespace-nowrap'>
                      {t('admin:users.viewUser')}
                    </Button>
                  </Link>
                ),
              },
            ]}
          />

          <div className='flex items-center justify-end gap-2'>
            <Button
              color='primary'
              size='small'
              variant='flat'
              disabled={!canGoPrev || isLoading}
              onClick={() => setOffset(current => Math.max(0, current - PAGE_SIZE))}
            >
              <LuChevronLeft className='h-4 w-4' />
              {t('admin:users.pagination.prev')}
            </Button>
            <Button
              color='primary'
              size='small'
              variant='flat'
              disabled={!canGoNext || isLoading}
              onClick={() => setOffset(current => current + PAGE_SIZE)}
            >
              {t('admin:users.pagination.next')}
              <LuChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </section>
      )}
    </section>
  );
}
