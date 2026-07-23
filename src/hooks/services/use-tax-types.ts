import { useMemo } from 'react';

import { usePromise } from '../use-promise';

import { DansshipAPI } from '@core/api';

const IVA_CODES = new Set(['iva', 'general_vat']);

export const useTaxTypes = () => {
  const { response: taxTypes, isLoading } = usePromise(() => DansshipAPI.billingAdmin.getTaxTypes());

  const items = useMemo(() => taxTypes?.data ?? [], [taxTypes?.data]);
  const defaultTaxTypeId = useMemo(() => {
    const iva = items.find(item => IVA_CODES.has(item.code));

    return iva?.id ?? items[0]?.id ?? '';
  }, [items]);

  return {
    taxTypes: items,
    defaultTaxTypeId,
    isLoading,
  };
};
