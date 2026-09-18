import { useTranslation } from 'react-i18next';

import { Button, Input, Label } from '@components/ui';
import { type PriceConditionCatalogItem, type WorkshopPriceTierInput } from '@core/api';

const FALLBACK_CONDITIONS: Array<PriceConditionCatalogItem> = [
  { condition_type: 'has_active_plan', label: 'Tiene un plan activo', param_schema: {} },
  {
    condition_type: 'has_active_plan_min_classes',
    label: 'Plan activo con ≥ N clases',
    param_schema: { min_classes: { type: 'integer', minimum: 1, required: true } },
  },
];

interface PriceTiersEditorProps {
  conditions: Array<PriceConditionCatalogItem>;
  tiers: Array<WorkshopPriceTierInput>;
  basePrice: string;
  baseLabel: string;
  locked: boolean;
  pairMode?: boolean;
  onChange: (tiers: Array<WorkshopPriceTierInput>) => void;
  onBasePriceChange: (value: string) => void;
}

export function PriceTiersEditor({
  conditions,
  tiers,
  basePrice,
  baseLabel,
  locked,
  onChange,
  onBasePriceChange,
}: PriceTiersEditorProps) {
  const { t } = useTranslation();
  const conditionOptions = conditions.length > 0 ? conditions : FALLBACK_CONDITIONS;
  const defaultType = conditionOptions[0]?.condition_type ?? 'has_active_plan';

  const updateTier = (index: number, patch: Partial<WorkshopPriceTierInput>) => {
    onChange(tiers.map((tier, current) => (current === index ? { ...tier, ...patch } : tier)));
  };

  return (
    <div className='grid gap-4'>
      {tiers.map((tier, index) => {
        const minClasses = String(tier.condition_params.min_classes ?? '');

        return (
          <div
            key={`${tier.condition_type}-${index}`}
            className='grid gap-3 rounded-xl border p-4 md:grid-cols-[1.4fr_auto_auto_auto] md:items-end'
          >
            <div className='grid gap-2'>
              <Label htmlFor={`tier-condition-${index}`}>{t('talleres:admin.condition')}</Label>
              <select
                id={`tier-condition-${index}`}
                className='rounded-2xl bg-gray-200/50 px-6 py-4'
                value={tier.condition_type}
                disabled={locked}
                onChange={event =>
                  updateTier(index, {
                    condition_type: event.target.value,
                    condition_params: event.target.value === 'has_active_plan_min_classes' ? { min_classes: 1 } : {},
                  })
                }
              >
                {conditionOptions.map(condition => (
                  <option key={condition.condition_type} value={condition.condition_type}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </div>
            {tier.condition_type === 'has_active_plan_min_classes' ? (
              <div className='grid gap-2'>
                <Label htmlFor={`tier-min-classes-${index}`}>{t('talleres:admin.minClasses')}</Label>
                <Input
                  id={`tier-min-classes-${index}`}
                  type='number'
                  min={1}
                  disabled={locked}
                  value={minClasses}
                  onChange={event =>
                    updateTier(index, {
                      condition_params: { min_classes: Number(event.target.value) || 1 },
                    })
                  }
                />
              </div>
            ) : (
              <div />
            )}
            <div className='grid gap-2'>
              <Label htmlFor={`tier-price-${index}`}>{t('talleres:admin.tierPrice')}</Label>
              <Input
                id={`tier-price-${index}`}
                type='number'
                min={0}
                disabled={locked}
                value={String(tier.price)}
                onChange={event => updateTier(index, { price: event.target.value })}
              />
            </div>
            <Button
              type='button'
              variant='outline'
              disabled={locked}
              onClick={() => onChange(tiers.filter((_, current) => current !== index))}
            >
              {t('talleres:admin.removeTier')}
            </Button>
          </div>
        );
      })}
      <div className='rounded-xl border border-dashed p-4'>
        <Label>{baseLabel}</Label>
        <Input
          className='mt-2'
          type='number'
          min={0}
          disabled={locked}
          value={basePrice}
          onChange={event => onBasePriceChange(event.target.value)}
        />
      </div>
      <Button
        type='button'
        variant='outline'
        disabled={locked}
        onClick={() =>
          onChange([
            ...tiers,
            {
              condition_type: defaultType,
              condition_params: defaultType === 'has_active_plan_min_classes' ? { min_classes: 1 } : {},
              price: 0,
            },
          ])
        }
      >
        {t('talleres:admin.addTier')}
      </Button>
    </div>
  );
}
