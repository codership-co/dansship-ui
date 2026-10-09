import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { PriceTiersEditor } from './price-tiers-editor';

import { OptionalFileUpload } from '@components/forms/optional-file-upload';
import { SpinnerLoader } from '@components/loaders';
import { Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Switch, Badge } from '@components/ui';
import {
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  PaymentProofContentType,
  type ComboAdmin,
  type EventPriceTierInput,
  type EventStatus,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

interface ComboEditFormProps {
  combo?: ComboAdmin;
}

export function ComboEditForm({ combo }: ComboEditFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locked = Boolean(combo?.fields_locked);
  const [selectedIds, setSelectedIds] = useState<Array<string>>(combo?.event_ids ?? []);
  const [status, setStatus] = useState<EventStatus>(combo?.status ?? 'draft');
  const [basePrice, setBasePrice] = useState(String(combo?.base_price ?? ''));
  const [tiers, setTiers] = useState<Array<EventPriceTierInput>>(
    combo?.price_tiers.map(tier => ({
      condition_type: tier.condition_type,
      condition_params: tier.condition_params,
      price: tier.price,
    })) ?? [],
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(combo?.image_url ?? null);
  const [saving, setSaving] = useState(false);

  const { response: listResponse } = usePromise(() => DansshipAPI.eventosAdmin.list());
  const { response: conditionsResponse } = usePromise(() => DansshipAPI.eventosAdmin.listPriceConditions());
  const events = (listResponse?.data ?? []).filter(item => item.kind === 'event' && item.type !== 'clase_especial');
  const conditions = Array.isArray(conditionsResponse?.data) ? conditionsResponse.data : [];

  const toggleEvent = (id: string, checked: boolean) => {
    setSelectedIds(current => (checked ? [...current, id] : current.filter(value => value !== id)));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();

    if (selectedIds.length < 2) {
      toast.error(t('eventos:admin.selectEvents'));

      return;
    }

    setSaving(true);
    const payload = {
      event_ids: selectedIds,
      base_price: Number(basePrice),
      price_tiers: tiers,
    };
    try {
      if (combo) {
        const { ok } = await DansshipAPI.eventosAdmin.updateCombo(combo.id, {
          ...payload,
          status,
        });

        if (!ok) {
          toast.error(t('eventos:admin.saveFailed'));

          return;
        }

        if (imageFile) {
          const upload = await DansshipAPI.eventosAdmin.uploadComboImage(combo.id, imageFile);

          if (!upload.data) {
            toast.error(t('eventos:admin.comboImageUploadFailed'));
          } else {
            setPreviewUrl(upload.data.image_url);
            setImageFile(null);
          }
        }

        toast.success(t('eventos:admin.comboUpdateSuccess'));
      } else {
        const { data, ok } = await DansshipAPI.eventosAdmin.createCombo(payload);

        if (!ok || !data) {
          toast.error(t('eventos:admin.saveFailed'));

          return;
        }

        if (imageFile) {
          const upload = await DansshipAPI.eventosAdmin.uploadComboImage(data.id, imageFile);

          if (!upload.data) {
            toast.error(t('eventos:admin.comboImageUploadFailed'));
          }
        }

        toast.success(t('eventos:admin.comboCreateSuccess'));
        navigate(PageURLS.admin.eventoComboEdit(data.id));
      }
    } catch (error) {
      const code = error instanceof DansshipAPIError ? error.body.error_code : '';
      toast.error(
        code === DANSSHIP_ERROR_CODE.EVENT_COMBO_COMPONENTS_UNPUBLISHED
          ? t('eventos:admin.saveFailed')
          : t('eventos:admin.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!listResponse || !conditionsResponse) {
    return <SpinnerLoader />;
  }

  return (
    <form className='grid gap-6' onSubmit={save}>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='grid gap-1'>
          <Link className='text-sm font-semibold text-primary' to={PageURLS.admin.eventos}>
            {t('eventos:admin.backToList')}
          </Link>
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='m-0 text-2xl font-bold text-foreground'>
              {combo ? t('eventos:admin.editCombo') : t('eventos:admin.newCombo')}
            </h1>
            <Badge variant={status === 'published' ? 'default' : 'outline'}>
              {status === 'published' ? t('eventos:admin.published') : t('eventos:admin.draft')}
            </Badge>
          </div>
          {combo?.name ? <p className='m-0 text-sm text-muted-foreground'>{combo.name}</p> : null}
        </div>
        <div className='flex flex-wrap items-center gap-2.5'>
          <label className='flex cursor-pointer items-center gap-2 rounded-full border bg-white px-3 py-1.5'>
            <span className='text-sm font-semibold'>
              {status === 'published' ? t('eventos:admin.published') : t('eventos:admin.draft')}
            </span>
            <Switch
              checked={status === 'published'}
              onCheckedChange={checked => setStatus(checked ? 'published' : 'draft')}
              className='data-[state=unchecked]:border-border data-[state=unchecked]:bg-gray-300'
            />
          </label>
          {combo ? (
            <Button asChild variant='outline'>
              <Link to={`${PageURLS.eventoLanding(combo.slug)}?preview=1`} target='_blank' rel='noreferrer'>
                {t('eventos:admin.preview')}
              </Link>
            </Button>
          ) : null}
          <Button type='submit' disabled={saving}>
            {saving ? t('eventos:admin.saving') : t('eventos:admin.saveCombo')}
          </Button>
        </div>
      </div>

      {locked ? (
        <p className='rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm'>{t('eventos:admin.lockBanner')}</p>
      ) : null}

      <p className='rounded-xl bg-secondary p-4 text-sm'>{t('eventos:admin.comboHint')}</p>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:admin.includedEvents')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3'>
          {events.map(item => (
            <label key={item.id} className='flex items-center gap-3'>
              <Checkbox
                checked={selectedIds.includes(item.id)}
                disabled={locked}
                onCheckedChange={checked => toggleEvent(item.id, checked === true)}
              />
              <span>
                {item.name} · {item.date_label}
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:admin.comboImage')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3'>
          <OptionalFileUpload
            value={imageFile}
            previewUrl={previewUrl}
            acceptedTypes={Object.values(PaymentProofContentType)}
            isUploading={saving}
            helperText={t('eventos:admin.comboImageHint')}
            onChange={(file, nextPreviewUrl) => {
              setImageFile(file);
              setPreviewUrl(nextPreviewUrl ?? combo?.image_url ?? null);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:admin.priceRulesPair')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceTiersEditor
            conditions={conditions}
            tiers={tiers}
            basePrice={basePrice}
            baseLabel={t('eventos:admin.basePricePair')}
            locked={locked}
            pairMode
            onChange={setTiers}
            onBasePriceChange={setBasePrice}
          />
        </CardContent>
      </Card>
    </form>
  );
}
