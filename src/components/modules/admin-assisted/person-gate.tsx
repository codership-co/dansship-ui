import type { ReactNode } from 'react';

import { AssistedPanel } from './assisted-panel';
import { PersonPicker } from './person-picker';
import { useSelectedPerson } from './use-selected-person';

import type { PersonSearchResult } from '@core/api';

interface PersonGateProps {
  children: (person: PersonSearchResult) => ReactNode;
  /** Rendered under the picker while nobody is chosen, e.g. to create the person on the spot. */
  emptyAction?: (select: (person: PersonSearchResult) => void) => ReactNode;
}

/** Every tab starts with its own person picker; the tab body renders once someone is chosen. */
export function PersonGate({ children, emptyAction }: PersonGateProps) {
  const { person, select } = useSelectedPerson();

  return (
    <div className='grid gap-6'>
      <AssistedPanel>
        <PersonPicker person={person} onSelect={select} />
        {person ? null : emptyAction?.(select)}
      </AssistedPanel>
      {person ? <AssistedPanel>{children(person)}</AssistedPanel> : null}
    </div>
  );
}
