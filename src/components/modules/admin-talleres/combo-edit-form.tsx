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
  type WorkshopPriceTierInput,
  type WorkshopStatus,
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
  const [selectedIds, setSelectedIds] = useState<Array<string>>(combo?.workshop_ids ?? []);
  const [status, setStatus] = useState<WorkshopStatus>(combo?.status ?? 'draft');
  const [basePrice, setBasePrice] = useState(String(combo?.base_price ?? ''));
  const [tiers, setTiers] = useState<Array<WorkshopPriceTierInput>>(
    combo?.price_tiers.map(tier => ({
      condition_type: tier.condition_type,
      condition_params: tier.condition_params,
      price: tier.price,
    })) ?? [],
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(combo?.image_url ?? null);
  const [saving, setSaving] = useState(false);

  const { response: listResponse } = usePromise(() => DansshipAPI.talleresAdmin.list());
  const { response: conditionsResponse } = usePromise(() => DansshipAPI.talleresAdmin.listPriceConditions());
  const workshops = (listResponse?.data ?? []).filter(item => item.kind === 'workshop');
  const conditions = Array.isArray(conditionsResponse?.data) ? conditionsResponse.data : [];

  const toggleWorkshop = (id: string, checked: boolean) => {
    setSelectedIds(current => (checked ? [...current, id] : current.filter(value => value !== id)));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();

    if (selectedIds.length < 2) {
      toast.error(t('talleres:admin.selectWorkshops'));

      return;
    }

    setSaving(true);
    const payload = {
      workshop_ids: selectedIds,
      base_price: Number(basePrice),
      price_tiers: tiers,
    };
    try {
      if (combo) {
        const { ok } = await DansshipAPI.talleresAdmin.updateCombo(combo.id, {
          ...payload,
          status,
        });

        if (!ok) {
          toast.error(t('talleres:admin.saveFailed'));

          return;
        }

        if (imageFile) {
          const upload = await DansshipAPI.talleresAdmin.uploadComboImage(combo.id, imageFile);

          if (!upload.data) {
            toast.error(t('talleres:admin.comboImageUploadFailed'));
          } else {
            setPreviewUrl(upload.data.image_url);
            setImageFile(null);
          }
        }

        toast.success(t('talleres:admin.comboUpdateSuccess'));
      } else {
        const { data, ok } = await DansshipAPI.talleresAdmin.createCombo(payload);

        if (!ok || !data) {
          toast.error(t('talleres:admin.saveFailed'));

          return;
        }

        if (imageFile) {
          const upload = await DansshipAPI.talleresAdmin.uploadComboImage(data.id, imageFile);

          if (!upload.data) {
            toast.error(t('talleres:admin.comboImageUploadFailed'));
          }
        }

        toast.success(t('talleres:admin.comboCreateSuccess'));
        navigate(PageURLS.admin.tallerComboEdit(data.id));
      }
    } catch (error) {
      const code = error instanceof DansshipAPIError ? error.body.error_code : '';
      toast.error(
        code === DANSSHIP_ERROR_CODE.WORKSHOP_COMBO_COMPONENTS_UNPUBLISHED
          ? t('talleres:admin.saveFailed')
          : t('talleres:admin.saveFailed'),
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
          <Link className='text-sm font-semibold text-primary' to={PageURLS.admin.talleres}>
            {t('talleres:admin.backToList')}
          </Link>
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='m-0 text-2xl font-bold text-foreground'>
              {combo ? t('talleres:admin.editCombo') : t('talleres:admin.newCombo')}
            </h1>
            <Badge variant={status === 'published' ? 'default' : 'outline'}>
              {status === 'published' ? t('talleres:admin.published') : t('talleres:admin.draft')}
            </Badge>
          </div>
          {combo?.name ? <p className='m-0 text-sm text-muted-foreground'>{combo.name}</p> : null}
        </div>
        <div className='flex flex-wrap items-center gap-2.5'>
          <label className='flex cursor-pointer items-center gap-2 rounded-full border bg-white px-3 py-1.5'>
            <span className='text-sm font-semibold'>
              {status === 'published' ? t('talleres:admin.published') : t('talleres:admin.draft')}
            </span>
            <Switch
              checked={status === 'published'}
              onCheckedChange={checked => setStatus(checked ? 'published' : 'draft')}
              className='data-[state=unchecked]:border-border data-[state=unchecked]:bg-gray-300'
            />
          </label>
          {combo ? (
            <Button asChild variant='outline'>
              <Link to={`${PageURLS.tallerLanding(combo.slug)}?preview=1`} target='_blank' rel='noreferrer'>
                {t('talleres:admin.preview')}
              </Link>
            </Button>
          ) : null}
          <Button type='submit' disabled={saving}>
            {saving ? t('talleres:admin.saving') : t('talleres:admin.saveCombo')}
          </Button>
        </div>
      </div>

      {locked ? (
        <p className='rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm'>{t('talleres:admin.lockBanner')}</p>
      ) : null}

      <p className='rounded-xl bg-secondary p-4 text-sm'>{t('talleres:admin.comboHint')}</p>

      <Card>
        <CardHeader>
          <CardTitle>{t('talleres:admin.includedWorkshops')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3'>
          {workshops.map(item => (
            <label key={item.id} className='flex items-center gap-3'>
              <Checkbox
                checked={selectedIds.includes(item.id)}
                disabled={locked}
                onCheckedChange={checked => toggleWorkshop(item.id, checked === true)}
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
          <CardTitle>{t('talleres:admin.comboImage')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3'>
          <OptionalFileUpload
            value={imageFile}
            previewUrl={previewUrl}
            acceptedTypes={Object.values(PaymentProofContentType)}
            isUploading={saving}
            helperText={t('talleres:admin.comboImageHint')}
            onChange={(file, nextPreviewUrl) => {
              setImageFile(file);
              setPreviewUrl(nextPreviewUrl ?? combo?.image_url ?? null);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('talleres:admin.priceRulesPair')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceTiersEditor
            conditions={conditions}
            tiers={tiers}
            basePrice={basePrice}
            baseLabel={t('talleres:admin.basePricePair')}
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
