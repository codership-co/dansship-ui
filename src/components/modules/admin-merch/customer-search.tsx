import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuSearch } from 'react-icons/lu';

import { SpinnerLoader } from '@components/loaders';
import { Input } from '@components/ui';
import { type CustomerSearchUser, DansshipAPI } from '@core/api';
import { usePromise } from '@hooks';

interface CustomerSearchProps {
  selectedCustomer: CustomerSearchUser | null;
  onSelect: (customer: CustomerSearchUser) => void;
}

export function CustomerSearch({ selectedCustomer, onSelect }: CustomerSearchProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(selectedCustomer?.email ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { response: users, isLoading } = usePromise(
    () => DansshipAPI.instructors.searchUsersByEmail(debouncedSearch),
    debouncedSearch.length > 2,
  );

  const handleSelect = (customer: CustomerSearchUser) => {
    onSelect(customer);
    setSearchInput(customer.email);
    setIsDropdownOpen(false);
  };

  return (
    <div className='space-y-2' ref={dropdownRef}>
      <label className='text-sm font-medium text-gray-700'>{t('merch:selectCustomer')}</label>

      <div className='relative'>
        <Input
          value={searchInput}
          onChange={event => {
            setSearchInput(event.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={t('merch:searchCustomerByEmail')}
        />
        {isLoading ? (
          <SpinnerLoader className='absolute right-3 top-2.5 h-4 w-4' />
        ) : (
          <LuSearch className='absolute right-3 top-2.5 h-4 w-4 text-gray-400' />
        )}
      </div>

      {selectedCustomer ? <p className='text-sm text-gray-600'>{selectedCustomer.email}</p> : null}

      {isDropdownOpen && debouncedSearch.length > 2 ? (
        <div className='max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-sm'>
          {!isLoading && users?.ok && users.data.length === 0 ? (
            <p className='px-3 py-2 text-sm text-gray-500'>{t('common:noUsersFound')}</p>
          ) : (
            <ul className='py-1'>
              {users?.data?.map(user => (
                <li
                  key={user.id}
                  className='cursor-pointer px-3 py-2 text-sm hover:bg-purple-50'
                  onClick={() => handleSelect(user)}
                >
                  <p className='font-medium'>{user.email}</p>
                  <p className='text-xs text-gray-500'>{user.id}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
