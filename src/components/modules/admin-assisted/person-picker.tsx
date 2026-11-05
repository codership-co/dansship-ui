import { Button } from 'polpo/components';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuSearch } from 'react-icons/lu';
import { Link } from 'react-router';

import { Card, CardContent, Input, Label } from '@components/ui';
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
      <Card>
        <CardContent className='flex flex-wrap items-center justify-between gap-3 py-4'>
          <div className='min-w-0'>
            <p className='truncate font-medium'>{person.full_name || t('picker.unknownName')}</p>
            {person.email ? <p className='truncate text-sm text-muted-foreground'>{person.email}</p> : null}
          </div>
          <div className='flex flex-wrap gap-2'>
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
        </CardContent>
      </Card>
    );
  }

  const results = response?.data ?? [];

  return (
    <div ref={containerRef} className='relative grid gap-2'>
      <Label htmlFor='assisted-person-search'>{label ?? t('picker.label')}</Label>
      <div className='relative'>
        <LuSearch className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          id='assisted-person-search'
          className='pl-9'
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
        <ul className='absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border bg-background shadow-md'>
          {isLoading ? <li className='px-3 py-2 text-sm text-muted-foreground'>{t('picker.searching')}</li> : null}
          {!isLoading && results.length === 0 ? (
            <li className='px-3 py-2 text-sm text-muted-foreground'>{t('picker.noResults')}</li>
          ) : null}
          {results.map(result => (
            <li key={result.id}>
              <button
                type='button'
                className='w-full px-3 py-2 text-left text-sm hover:bg-muted'
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
