import { Button } from 'polpo/components';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuSearch } from 'react-icons/lu';
import { Link } from 'react-router';

import { Input, Label } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { DansshipAPI, type PersonSearchResult } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { usePromise } from '@hooks';

type SearchPeople = (query: string) => ReturnType<typeof DansshipAPI.assistedAdmin.searchPeople>;

interface PersonPickerProps {
  person: PersonSearchResult | null;
  onSelect: (person: PersonSearchResult | null) => void;
  /** Defaults to the shared people search; Contactos passes its narrower one. */
  search?: SearchPeople;
  label?: string;
}

const MIN_QUERY_LENGTH = 3;

export function PersonPicker({ person, onSelect, search, label }: PersonPickerProps) {
  const { t } = useTranslation('assisted');
  const canOpen360 = useOrPermissions(AdminPermissions.users);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const runSearch = search ?? DansshipAPI.assistedAdmin.searchPeople.bind(DansshipAPI.assistedAdmin);

  const { response, isLoading } = usePromise(() => runSearch(query), query.length >= MIN_QUERY_LENGTH && !person, [
    query,
    person?.id,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 400);

    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', close);

    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (person) {
    return (
      <div className='grid gap-3'>
        <p className='text-label font-medium'>{label ?? t('picker.label')}</p>
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-100 p-4'>
          <div className='min-w-0'>
            <p className='truncate font-semibold'>{person.full_name || t('picker.unknownName')}</p>
            {person.email ? <p className='truncate text-sm text-muted-foreground'>{person.email}</p> : null}
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {canOpen360 ? (
              <Link to={PageURLS.admin.userDetails(person.id)}>
                <Button color='primary' variant='outlined' size='small'>
                  {t('picker.view360')}
                </Button>
              </Link>
            ) : null}
            <Button color='primary' variant='text' size='small' type='button' onClick={() => onSelect(null)}>
              {t('picker.change')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const results = response?.data ?? [];

  return (
    <div ref={containerRef} className='relative grid gap-2'>
      <Label htmlFor='assisted-person-search'>{label ?? t('picker.label')}</Label>
      <div className='flex items-center gap-3 rounded-2xl bg-gray-200/50 px-5 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-primary/50'>
        <LuSearch className='pointer-events-none size-4 shrink-0 text-muted-foreground' aria-hidden />
        <Input
          id='assisted-person-search'
          className='rounded-none bg-transparent px-0 shadow-none focus:bg-transparent focus-visible:ring-0'
          placeholder={t('picker.placeholder')}
          value={input}
          autoComplete='off'
          onFocus={() => setIsOpen(true)}
          onChange={event => {
            setInput(event.target.value);
            setIsOpen(true);
          }}
        />
      </div>
      {isOpen && query.length >= MIN_QUERY_LENGTH ? (
        <ul className='absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-white shadow-md'>
          {isLoading ? <li className='px-3 py-2 text-sm text-muted-foreground'>{t('picker.searching')}</li> : null}
          {!isLoading && results.length === 0 ? (
            <li className='px-3 py-2 text-sm text-muted-foreground'>{t('picker.noResults')}</li>
          ) : null}
          {results.map(result => (
            <li key={result.id}>
              <button
                type='button'
                className='w-full px-3 py-2 text-left text-sm hover:bg-gray-100'
                onClick={() => {
                  onSelect(result);
                  setInput('');
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <span className='block font-medium'>{result.full_name}</span>
                {result.email ? <span className='block text-muted-foreground'>{result.email}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
