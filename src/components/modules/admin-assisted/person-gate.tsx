import type { ReactNode } from 'react';

import { PersonPicker } from './person-picker';
import { useSelectedPerson } from './use-selected-person';

import type { PersonSearchResult } from '@core/api';

interface PersonGateProps {
  children: (person: PersonSearchResult) => ReactNode;
}

/** Every tab starts with its own person picker; the tab body renders once someone is chosen. */
export function PersonGate({ children }: PersonGateProps) {
  const { person, select } = useSelectedPerson();

  return (
    <div className='grid gap-6'>
      <PersonPicker person={person} onSelect={select} />
      {person ? children(person) : null}
    </div>
  );
}
