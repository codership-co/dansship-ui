import type { ParticipantTypeAdmin, ParticipantTypeFormValues, PriceConditionCatalogItem } from '@core/api';
import type { UseFormReturn } from 'react-hook-form';

/** What every section of the generic participant-type editor receives. */
export interface TypeEditorSectionProps {
  form: UseFormReturn<ParticipantTypeFormValues>;
  type: ParticipantTypeAdmin;
  /** Conditions the editor may offer (`offered_in_editor`); "Todos" is no condition. */
  conditions: Array<PriceConditionCatalogItem>;
  eventCapacity: number;
  isPrivate: boolean;
}
