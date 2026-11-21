import { Button } from 'polpo/components';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCopy, LuPlus, LuX } from 'react-icons/lu';
import { toast } from 'sonner';

import { FormFieldDialog } from './form-field-dialog';
import { ParticipantTermsEditor } from './participant-terms-editor';

import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Label, Switch } from '@components/ui';
import {
  bogotaLocalToIso,
  chargesMoney,
  DansshipAPI,
  isoToBogotaLocal,
  participantAccessLink,
  participantTypeConfig,
  participationErrorMessage,
  takesDonations,
  type ParticipantField,
  type ParticipantTypeAdmin,
  type ParticipantTypeConfig,
} from '@core/api';

const SELECT_CLASS = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
const COMMUNITY_CONDITION = 'has_active_plan';

function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-b-0'>
      <div className='grid min-w-0 flex-[1_1_240px] gap-0.5'>
        <p className='m-0 text-sm font-semibold'>{title}</p>
        {hint ? <p className='m-0 text-xs text-muted-foreground'>{hint}</p> : null}
      </div>
      <div className='flex min-w-0 flex-[0_1_340px] justify-end'>{children}</div>
    </div>
  );
}

interface ParticipantTypeEditorProps {
  eventId: string;
  eventSlug: string;
  eventCapacity: number;
  type: ParticipantTypeAdmin;
  onSaved: (type: ParticipantTypeAdmin) => void;
}

/** The generic editor: every participant type is edited with the same sections. */
export function ParticipantTypeEditor({
  eventId,
  eventSlug,
  eventCapacity,
  type,
  onSaved,
}: ParticipantTypeEditorProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<ParticipantTypeConfig>(() => participantTypeConfig(type));
  const [closesAt, setClosesAt] = useState(isoToBogotaLocal(type.closes_at));
  const [saving, setSaving] = useState(false);
  const [newDonation, setNewDonation] = useState('');
  const [editingField, setEditingField] = useState<ParticipantField | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [terms, setTerms] = useState(type.terms);

  useEffect(() => {
    setDraft(participantTypeConfig(type));
    setClosesAt(isoToBogotaLocal(type.closes_at));
    setTerms(type.terms);
  }, [type]);

  const set = <K extends keyof ParticipantTypeConfig>(key: K, value: ParticipantTypeConfig[K]) =>
    setDraft(current => ({ ...current, [key]: value }));
  const money = chargesMoney(draft.contribution_model);
  const donations = takesDonations(draft.contribution_model);
  const isTickets = draft.registration_mode === 'multi_ticket';
  const shareLink =
    draft.access_mode === 'link' ? participantAccessLink(window.location.origin, eventSlug, type.access_token) : null;

  const save = async () => {
    setSaving(true);
    try {
      const { ok, data, error } = await DansshipAPI.participationAdmin.updateType(eventId, type.id, {
        ...draft,
        closes_at: bogotaLocalToIso(closesAt),
        minor_price: draft.minor_price === '' ? null : draft.minor_price,
      });

      if (!ok || !data) {
        toast.error(participationErrorMessage(error, t, 'eventos:participation.editor.saveFailed'));

        return;
      }

      onSaved(data);
      toast.success(t('eventos:participation.editor.saved'));
    } finally {
      setSaving(false);
    }
  };

  const rotate = async () => {
    const { ok, data } = await DansshipAPI.participationAdmin.rotateToken(eventId, type.id);

    if (!ok || !data) {
      toast.error(t('eventos:participation.editor.rotateFailed'));

      return;
    }

    onSaved(data);
    toast.success(t('eventos:participation.editor.rotated'));
  };

  const copyLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success(t('eventos:participation.editor.copied'));
    } catch {
      toast.error(t('eventos:participation.editor.copyFailed'));
    }
  };

  const saveField = (field: ParticipantField) => {
    setDraft(current => {
      const exists = current.fields.some(item => item.key === field.key);

      return {
        ...current,
        fields: exists
          ? current.fields.map(item => (item.key === field.key ? field : item))
          : [...current.fields, field],
      };
    });
    setFieldDialogOpen(false);
  };

  const removeField = (key: string) =>
    setDraft(current => ({
      ...current,
      fields: current.fields
        .filter(item => item.key !== key)
        .map(item => (item.visible_when?.field_key === key ? { ...item, visible_when: null } : item)),
    }));

  const addDonation = () => {
    const label = newDonation.trim();

    if (!label || draft.donation_types.some(item => item.label === label)) return;

    set('donation_types', [...draft.donation_types, { label }]);
    setNewDonation('');
  };

  return (
    <div className='grid min-w-0 gap-4'>
      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:participation.editor.general')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-0'>
          <Row title={t('eventos:participation.editor.name')} hint={t('eventos:participation.editor.nameHint')}>
            <Input
              aria-label={t('eventos:participation.editor.name')}
              value={draft.name}
              maxLength={80}
              onChange={change => set('name', change.target.value)}
            />
          </Row>
          <Row title={t('eventos:participation.editor.registrationMode')}>
            <select
              aria-label={t('eventos:participation.editor.registrationMode')}
              className={SELECT_CLASS}
              value={draft.registration_mode}
              disabled={type.signup_count > 0 || type.people_count > 0}
              onChange={change =>
                set('registration_mode', change.target.value as ParticipantTypeConfig['registration_mode'])
              }
            >
              <option value='single'>{t('eventos:participation.registrationModes.single')}</option>
              <option value='single_or_group'>{t('eventos:participation.registrationModes.single_or_group')}</option>
              <option value='multi_ticket'>{t('eventos:participation.registrationModes.multi_ticket')}</option>
            </select>
          </Row>
          <Row title={t('eventos:participation.editor.access')} hint={t('eventos:participation.editor.accessHint')}>
            <select
              aria-label={t('eventos:participation.editor.access')}
              className={SELECT_CLASS}
              value={draft.access_mode}
              onChange={change => set('access_mode', change.target.value as ParticipantTypeConfig['access_mode'])}
            >
              <option value='public'>{t('eventos:participation.accessModes.public')}</option>
              <option value='link'>{t('eventos:participation.accessModes.link')}</option>
            </select>
          </Row>
          {draft.access_mode === 'link' ? (
            <Row
              title={t('eventos:participation.editor.shareLink')}
              hint={
                shareLink
                  ? t('eventos:participation.editor.rotateHint')
                  : t('eventos:participation.editor.shareLinkPending')
              }
            >
              {shareLink ? (
                <div className='grid w-full gap-2'>
                  <div className='flex gap-2'>
                    <Input readOnly value={shareLink} aria-label={t('eventos:participation.editor.shareLink')} />
                    <Button type='button' variant='outlined' color='primary' onClick={() => void copyLink()}>
                      <LuCopy className='size-4' aria-hidden />
                      {t('eventos:participation.editor.copy')}
                    </Button>
                  </div>
                  <Button type='button' variant='text' color='primary' size='small' onClick={() => void rotate()}>
                    {t('eventos:participation.editor.rotate')}
                  </Button>
                </div>
              ) : null}
            </Row>
          ) : null}
          <Row
            title={t('eventos:participation.editor.requiresAccount')}
            hint={t('eventos:participation.editor.requiresAccountHint')}
          >
            <Switch
              aria-label={t('eventos:participation.editor.requiresAccount')}
              checked={draft.requires_account}
              onCheckedChange={value => set('requires_account', value)}
            />
          </Row>
          <Row
            title={t('eventos:participation.editor.requiresApproval')}
            hint={t('eventos:participation.editor.requiresApprovalHint')}
          >
            <Switch
              aria-label={t('eventos:participation.editor.requiresApproval')}
              checked={draft.requires_approval}
              onCheckedChange={value => set('requires_approval', value)}
            />
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:participation.editor.contribution')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <Row title={t('eventos:participation.editor.contributionModel')}>
            <select
              aria-label={t('eventos:participation.editor.contributionModel')}
              className={SELECT_CLASS}
              value={draft.contribution_model}
              onChange={change =>
                set('contribution_model', change.target.value as ParticipantTypeConfig['contribution_model'])
              }
            >
              {(['free', 'money', 'in_kind', 'money_and_in_kind'] as const).map(model => (
                <option key={model} value={model}>
                  {t(`eventos:participation.contributionModels.${model}`)}
                </option>
              ))}
            </select>
          </Row>
          {money ? (
            <div className='grid gap-3 border-t border-border pt-3'>
              <p className='m-0 text-sm font-semibold'>{t('eventos:participation.editor.fees')}</p>
              {draft.fees.map((fee, index) => (
                <div
                  key={fee.id ?? `new-${index}`}
                  className='grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end'
                >
                  <div className='grid gap-1'>
                    <Label className='text-xs'>{t('eventos:participation.editor.feeName')}</Label>
                    <Input
                      value={fee.label}
                      maxLength={80}
                      onChange={change =>
                        set(
                          'fees',
                          draft.fees.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, label: change.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className='grid gap-1'>
                    <Label className='text-xs'>{t('eventos:participation.editor.feeWho')}</Label>
                    <select
                      className={SELECT_CLASS}
                      value={fee.condition_type ?? ''}
                      onChange={change =>
                        set(
                          'fees',
                          draft.fees.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, condition_type: change.target.value || null } : item,
                          ),
                        )
                      }
                    >
                      <option value=''>{t('eventos:participation.editor.feeEveryone')}</option>
                      <option value={COMMUNITY_CONDITION}>{t('eventos:participation.editor.feeCommunity')}</option>
                    </select>
                  </div>
                  <div className='grid gap-1'>
                    <Label className='text-xs'>{t('eventos:participation.editor.feePrice')}</Label>
                    <Input
                      type='number'
                      min={0}
                      value={String(fee.price)}
                      onChange={change =>
                        set(
                          'fees',
                          draft.fees.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, price: change.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <Button
                    type='button'
                    variant='text'
                    color='primary'
                    aria-label={t('eventos:participation.editor.removeFee')}
                    onClick={() =>
                      set(
                        'fees',
                        draft.fees.filter((_item, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    <LuX className='size-4' aria-hidden />
                  </Button>
                </div>
              ))}
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <Button
                  type='button'
                  variant='outlined'
                  color='primary'
                  size='small'
                  onClick={() => set('fees', [...draft.fees, { label: '', condition_type: null, price: 0 }])}
                >
                  <LuPlus className='size-4' aria-hidden />
                  {t('eventos:participation.editor.addFee')}
                </Button>
                <small className='text-xs text-muted-foreground'>{t('eventos:participation.editor.feesHint')}</small>
              </div>
            </div>
          ) : null}
          {donations ? (
            <div className='grid gap-3 border-t border-border pt-3'>
              <p className='m-0 text-sm font-semibold'>{t('eventos:participation.editor.donationTypes')}</p>
              <div className='flex flex-wrap gap-2'>
                {draft.donation_types.length === 0 ? (
                  <p className='m-0 text-xs text-muted-foreground'>{t('eventos:participation.editor.noDonations')}</p>
                ) : null}
                {draft.donation_types.map(item => (
                  <Badge key={item.id ?? item.label} variant='outline' className='gap-1'>
                    {item.label}
                    <button
                      type='button'
                      className='grid size-5 place-items-center rounded-full text-muted-foreground'
                      aria-label={t('eventos:participation.editor.removeDonation', { label: item.label })}
                      onClick={() =>
                        set(
                          'donation_types',
                          draft.donation_types.filter(donation => donation !== item),
                        )
                      }
                    >
                      <LuX className='size-3' aria-hidden />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className='flex gap-2'>
                <Input
                  value={newDonation}
                  maxLength={80}
                  placeholder={t('eventos:participation.editor.donationPlaceholder')}
                  aria-label={t('eventos:participation.editor.donationPlaceholder')}
                  onChange={change => setNewDonation(change.target.value)}
                  onKeyDown={keyEvent => {
                    if (keyEvent.key === 'Enter') {
                      keyEvent.preventDefault();
                      addDonation();
                    }
                  }}
                />
                <Button type='button' variant='outlined' color='primary' onClick={addDonation}>
                  {t('eventos:participation.editor.addDonation')}
                </Button>
              </div>
              <small className='text-xs text-muted-foreground'>{t('eventos:participation.editor.donationsHint')}</small>
            </div>
          ) : null}
          {draft.contribution_model === 'free' ? (
            <p className='m-0 text-xs text-muted-foreground'>{t('eventos:participation.editor.freeHint')}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:participation.editor.form')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-0'>
          {isTickets ? (
            <>
              <Row
                title={t('eventos:participation.editor.ticketName')}
                hint={t('eventos:participation.fieldKinds.short_text')}
              >
                <span className='text-xs text-muted-foreground'>{t('eventos:participation.editor.always')}</span>
              </Row>
              <Row
                title={t('eventos:participation.editor.ticketEmail')}
                hint={t('eventos:participation.editor.ticketEmailHint')}
              >
                <span className='text-xs text-muted-foreground'>{t('eventos:participation.editor.always')}</span>
              </Row>
            </>
          ) : null}
          {draft.fields.map(field => (
            <Row
              key={field.key}
              title={field.label}
              hint={[
                t(`eventos:participation.fieldKinds.${field.kind}`),
                field.visible_when
                  ? t('eventos:participation.editor.visibleWhenHint', { value: field.visible_when.equals })
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            >
              <div className='flex items-center gap-2'>
                <span className='text-xs text-muted-foreground'>{t('eventos:participation.fields.required')}</span>
                <Switch
                  aria-label={t('eventos:participation.editor.requiredFor', { label: field.label })}
                  checked={field.required}
                  onCheckedChange={value =>
                    set(
                      'fields',
                      draft.fields.map(item => (item.key === field.key ? { ...item, required: value } : item)),
                    )
                  }
                />
                <Button
                  type='button'
                  variant='text'
                  color='primary'
                  size='small'
                  onClick={() => {
                    setEditingField(field);
                    setFieldDialogOpen(true);
                  }}
                >
                  {t('eventos:participation.editor.editField')}
                </Button>
                <Button
                  type='button'
                  variant='text'
                  color='primary'
                  size='small'
                  aria-label={t('eventos:participation.editor.removeField', { label: field.label })}
                  onClick={() => removeField(field.key)}
                >
                  <LuX className='size-4' aria-hidden />
                </Button>
              </div>
            </Row>
          ))}
          <div className='grid gap-2 pt-3'>
            <div>
              <Button
                type='button'
                variant='outlined'
                color='primary'
                size='small'
                onClick={() => {
                  setEditingField(null);
                  setFieldDialogOpen(true);
                }}
              >
                <LuPlus className='size-4' aria-hidden />
                {t('eventos:participation.editor.addField')}
              </Button>
            </div>
            <small className='text-xs text-muted-foreground'>{t('eventos:participation.editor.fieldKindsHint')}</small>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:participation.editor.minors')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-0'>
          <Row
            title={t('eventos:participation.editor.minorsAllowed')}
            hint={
              isTickets
                ? t('eventos:participation.editor.minorsTicketsHint')
                : t('eventos:participation.editor.minorsGroupHint')
            }
          >
            <Switch
              aria-label={t('eventos:participation.editor.minorsAllowed')}
              checked={draft.minors_allowed}
              onCheckedChange={value => set('minors_allowed', value)}
            />
          </Row>
          {draft.minors_allowed ? (
            <>
              <Row
                title={t('eventos:participation.editor.minorMaxAge')}
                hint={t('eventos:participation.editor.minorMaxAgeHint')}
              >
                <Input
                  type='number'
                  min={1}
                  max={25}
                  aria-label={t('eventos:participation.editor.minorMaxAge')}
                  value={draft.minor_max_age ?? ''}
                  onChange={change => set('minor_max_age', change.target.value ? Number(change.target.value) : null)}
                />
              </Row>
              <Row
                title={t('eventos:participation.editor.minorsPerAdult')}
                hint={t('eventos:participation.editor.minorsPerAdultHint')}
              >
                <Input
                  type='number'
                  min={1}
                  max={20}
                  aria-label={t('eventos:participation.editor.minorsPerAdult')}
                  value={draft.minors_per_adult_max ?? ''}
                  onChange={change =>
                    set('minors_per_adult_max', change.target.value ? Number(change.target.value) : null)
                  }
                />
              </Row>
              {money ? (
                <Row
                  title={t('eventos:participation.editor.minorPrice')}
                  hint={t('eventos:participation.editor.minorPriceHint')}
                >
                  <Input
                    type='number'
                    min={0}
                    aria-label={t('eventos:participation.editor.minorPrice')}
                    value={draft.minor_price === null ? '' : String(draft.minor_price)}
                    onChange={change => set('minor_price', change.target.value === '' ? null : change.target.value)}
                  />
                </Row>
              ) : null}
              <Row title={t('eventos:participation.editor.minorsCount')}>
                <Switch
                  aria-label={t('eventos:participation.editor.minorsCount')}
                  checked={draft.minors_count_toward_capacity}
                  onCheckedChange={value => set('minors_count_toward_capacity', value)}
                />
              </Row>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:participation.editor.capacityDates')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-0'>
          <Row
            title={t('eventos:participation.editor.countsTowardCapacity')}
            hint={t('eventos:participation.editor.countsTowardCapacityHint', { capacity: eventCapacity })}
          >
            <Switch
              aria-label={t('eventos:participation.editor.countsTowardCapacity')}
              checked={draft.counts_toward_capacity}
              onCheckedChange={value => set('counts_toward_capacity', value)}
            />
          </Row>
          <Row
            title={
              isTickets
                ? t('eventos:participation.editor.salesClose')
                : t('eventos:participation.editor.registrationClose')
            }
            hint={
              isTickets
                ? t('eventos:participation.editor.salesCloseHint')
                : t('eventos:participation.editor.registrationCloseHint')
            }
          >
            <Input
              type='datetime-local'
              aria-label={
                isTickets
                  ? t('eventos:participation.editor.salesClose')
                  : t('eventos:participation.editor.registrationClose')
              }
              value={closesAt}
              onChange={change => setClosesAt(change.target.value)}
            />
          </Row>
          <Row title={t('eventos:participation.editor.entryQr')} hint={t('eventos:participation.editor.entryQrHint')}>
            <Switch
              aria-label={t('eventos:participation.editor.entryQr')}
              checked={draft.issues_entry_qr}
              onCheckedChange={value => set('issues_entry_qr', value)}
            />
          </Row>
          <Row title={t('eventos:participation.editor.active')} hint={t('eventos:participation.editor.activeHint')}>
            <Switch
              aria-label={t('eventos:participation.editor.active')}
              checked={draft.is_active}
              onCheckedChange={value => set('is_active', value)}
            />
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:participation.editor.terms')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipantTermsEditor
            eventId={eventId}
            typeId={type.id}
            typeName={draft.name}
            current={terms}
            onSaved={setTerms}
          />
        </CardContent>
      </Card>

      <div className='flex flex-wrap justify-end gap-3'>
        <Button
          type='button'
          variant='outlined'
          color='primary'
          disabled={saving}
          onClick={() => {
            setDraft(participantTypeConfig(type));
            setClosesAt(isoToBogotaLocal(type.closes_at));
          }}
        >
          {t('eventos:participation.cancel')}
        </Button>
        <Button type='button' variant='solid' color='primary' disabled={saving} onClick={() => void save()}>
          {saving ? t('eventos:participation.editor.saving') : t('eventos:participation.editor.save')}
        </Button>
      </div>

      <FormFieldDialog
        open={fieldDialogOpen}
        field={editingField}
        otherFields={draft.fields.filter(item => item.key !== editingField?.key)}
        onOpenChange={setFieldDialogOpen}
        onSave={saveField}
      />
    </div>
  );
}
