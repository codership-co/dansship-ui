import { useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';

import { LanguageFlag } from './language-flag';

import { useLanguage } from '@hooks';

import type { LanguageCode } from '@core/constants';

interface LanguageSelectorProps {
  variant?: 'buttons' | 'dropdown';
}

export function LanguageSelector({ variant = 'buttons' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, changeLanguage, languages } = useLanguage();

  const handleLanguageChange = (code: LanguageCode) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  if (!currentLanguage || languages.length < 2) return null;

  if (variant === 'buttons') {
    return (
      <div className='flex items-center space-x-2'>
        {languages.map(({ code, name, flag }) => (
          <button
            key={code}
            onClick={() => handleLanguageChange(code)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              currentLanguage.code === code ? 'bg-secondary text-primary' : 'hover:bg-gray-100'
            }`}
          >
            <span className='text-xl'>{flag}</span>
            <span className='text-sm font-medium'>{name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center space-x-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-100 sm:space-x-2 sm:px-3 sm:py-2'
      >
        <LanguageFlag />
        <span className='hidden text-sm font-medium sm:inline'>{currentLanguage.code.toUpperCase()}</span>
        <LuChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-48 rounded-md overflow-hidden shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50'>
          <div className='py-1' role='menu'>
            {languages.map(({ code, name, flag }) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`w-full text-left px-4 py-2 text-sm cursor-pointer ${
                  currentLanguage.code === code ? 'bg-secondary text-primary' : 'text-gray-700 hover:bg-gray-50'
                } flex items-center space-x-2`}
                role='menuitem'
              >
                <span className='text-xl'>{flag}</span>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
