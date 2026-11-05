import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { apiErrorCode } from './assisted-errors';
import { PersonPicker } from './person-picker';

import { SelectField, TextField, TextareaField } from '@components/form-fields';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@components/ui';
import { useOrPermissions } from '@contexts';
import { type ContactLead, type ContactLeadStatus, DansshipAPI, type PersonSearchResult } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions, PERMISSION } from '@core/permissions';
import { cn } from '@helpers';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

const STATUSES: Array<ContactLeadStatus> = ['new', 'following', 'converted', 'not_interested'];
const EDITABLE: Array<Exclude<ContactLeadStatus, 'converted'>> = ['new', 'following', 'not_interested'];
const CHANNELS = ['whatsapp', 'instagram', 'facebook', 'other'] as const;

const leadSchema = z.object({
  name: z.string().trim().max(150).optional(),
  channel: z.enum(CHANNELS),
  contact: z.string().trim().min(1).max(255),
  inquiry: z.string().trim().max(1000).optional(),
});

type LeadForm = z.infer<typeof leadSchema>;

function NewLeadDialog({ onOpenChange, onCreated }: { onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  const { t } = useTranslation('assisted');
  const { control, handleSubmit } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: '', channel: 'whatsapp', contact: '', inquiry: '' },
  });
  const { call: create, isLoading } = useCallablePromise((payload: LeadForm) =>
    DansshipAPI.assistedAdmin.createContactLead({
      ...payload,
      name: payload.name || undefined,
      inquiry: payload.inquiry || undefined,
    }),
  );

  const submit = handleSubmit(async values => {
    const { ok, error } = await create(values);

    if (!ok) {
      toast.error(
        t(`errors.${apiErrorCode(error)}`, {
          defaultValue: t('errors.generic'),
        }),
      );

      return;
    }

    toast.success(t('contacts.created'));
    onCreated();
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('contacts.newTitle')}</DialogTitle>
          <DialogDescription>{t('contacts.privacyNotice')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className='grid gap-4'>
          <TextField control={control} name='name' label={t('contacts.name')} />
          <SelectField
            control={control}
            name='channel'
            label={t('contacts.channel')}
            options={CHANNELS.map(channel => ({
              value: channel,
              label: t(`contacts.channels.${channel}`),
            }))}
          />
          <TextField
            control={control}
            name='contact'
            label={t('contacts.contact')}
            placeholder={t('contacts.contactPlaceholder')}
          />
          <TextareaField control={control} name='inquiry' label={t('contacts.inquiry')} />
          <DialogFooter>
            <Button color='primary' variant='outlined' type='button' onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button color='primary' variant='solid' type='submit' disabled={isLoading}>
              {t('contacts.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinkUserDialog({
  lead,
  initial,
  onOpenChange,
  onLinked,
}: {
  lead: ContactLead;
  initial: PersonSearchResult | null;
  onOpenChange: (open: boolean) => void;
  onLinked: () => void;
}) {
  const { t } = useTranslation('assisted');
  const [person, setPerson] = useState<PersonSearchResult | null>(initial);
  const { call: link, isLoading } = useCallablePromise((userId: string) =>
    DansshipAPI.assistedAdmin.linkContactLead(lead.id, userId),
  );

  const submit = async () => {
    if (!person) {
      return;
    }

    const { ok, error } = await link(person.id);

    if (!ok) {
      toast.error(
        t(`errors.${apiErrorCode(error)}`, {
          defaultValue: t('errors.generic'),
        }),
      );

      return;
    }

    toast.success(t('contacts.linked'));
    onLinked();
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('contacts.linkTitle')}</DialogTitle>
          <DialogDescription>{t('contacts.linkHelp', { count: lead.notes_count })}</DialogDescription>
        </DialogHeader>
        <PersonPicker
          person={person}
          onSelect={setPerson}
          search={query => DansshipAPI.assistedAdmin.searchContactLeadUsers(query)}
        />
        <DialogFooter>
          <Button color='primary' variant='outlined' type='button' onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            color='primary'
            variant='solid'
            type='button'
            disabled={!person || isLoading}
            onClick={() => void submit()}
          >
            {t('contacts.linkAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({ lead, disabled, onChanged }: { lead: ContactLead; disabled: boolean; onChanged: () => void }) {
  const { t } = useTranslation('assisted');
  const { call: change } = useCallablePromise((status: Exclude<ContactLeadStatus, 'converted'>) =>
    DansshipAPI.assistedAdmin.changeContactLeadStatus(lead.id, status),
  );
  const isLocked = disabled || lead.status === 'converted';

  return (
    <Select
      value={lead.status}
      disabled={isLocked}
      onValueChange={async value => {
        const { ok, error } = await change(value as Exclude<ContactLeadStatus, 'converted'>);

        if (!ok) {
          toast.error(
            t(`errors.${apiErrorCode(error)}`, {
              defaultValue: t('errors.generic'),
            }),
          );

          return;
        }

        onChanged();
      }}
    >
      <SelectTrigger
        size='sm'
        aria-label={t('contacts.status')}
        className='h-7 w-auto min-w-36 rounded-full border-border bg-background px-3 text-xs'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(lead.status === 'converted' ? STATUSES : EDITABLE).map(status => (
          <SelectItem key={status} value={status} disabled={status === 'converted'}>
            {t(`contacts.statuses.${status}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LeadRow({ lead, canManage, onChanged }: { lead: ContactLead; canManage: boolean; onChanged: () => void }) {
  const { t } = useTranslation('assisted');
  const locale = useDateLocale();
  const canOpen360 = useOrPermissions(AdminPermissions.users);
  const [note, setNote] = useState('');
  const [linking, setLinking] = useState<PersonSearchResult | null | false>(false);
  const { call: addNote, isLoading: isAdding } = useCallablePromise((body: string) =>
    DansshipAPI.assistedAdmin.addContactLeadNote(lead.id, body),
  );
  const suggestion = lead.suggested_accounts[0];
  const isLinked = lead.linked_user !== null;

  const submitNote = async () => {
    const { ok, error } = await addNote(note.trim());

    if (!ok) {
      toast.error(
        t(`errors.${apiErrorCode(error)}`, {
          defaultValue: t('errors.generic'),
        }),
      );

      return;
    }

    setNote('');
    onChanged();
  };

  return (
    <li className='grid gap-3 p-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <span className='font-semibold'>{lead.name || t('contacts.noName')}</span>
        <StatusPill lead={lead} disabled={!canManage} onChanged={onChanged} />
      </div>
      <p className='text-sm text-muted-foreground'>
        {t(`contacts.channels.${lead.channel}`)} · {lead.contact} ·{' '}
        {format(parseISO(lead.contacted_at), 'd MMM', { locale })}
      </p>
      {lead.inquiry ? <p className='text-sm'>{lead.inquiry}</p> : null}
      {isLinked && lead.linked_user ? (
        <p className='text-sm'>
          {t('contacts.hasAccount', { name: lead.linked_user.full_name })}
          {canOpen360 ? (
            <>
              {' · '}
              <Link
                className='font-medium text-primary underline'
                to={PageURLS.admin.userDetails(lead.linked_user.user_id)}
              >
                {t('contacts.viewUser')}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      {!isLinked && suggestion ? (
        <div className='flex flex-wrap items-center gap-2 rounded-md bg-muted p-2 text-sm'>
          <span>{t('contacts.hasAccount', { name: suggestion.full_name })}</span>
          {canOpen360 ? (
            <Link className='font-medium text-primary underline' to={PageURLS.admin.userDetails(suggestion.user_id)}>
              {t('contacts.viewUser')}
            </Link>
          ) : null}
          {canManage ? (
            <Button
              color='primary'
              variant='text'
              size='small'
              onClick={() =>
                setLinking({
                  id: suggestion.user_id,
                  full_name: suggestion.full_name,
                  email: suggestion.email,
                })
              }
            >
              {t('contacts.suggestLink')}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className='flex flex-wrap items-start gap-x-6 gap-y-2'>
        {lead.notes_moved_to_user ? (
          <p className='text-sm text-muted-foreground'>{t('contacts.notesMoved', { count: lead.notes_count })}</p>
        ) : (
          <details className='group w-full'>
            <summary className='cursor-pointer text-sm font-semibold text-primary'>
              {t('contacts.viewNotes', { count: lead.notes_count })}
            </summary>
            <div className='mt-3 grid gap-3'>
              {lead.notes.map(item => (
                <div key={item.id} className='grid gap-1'>
                  <span className='text-xs text-muted-foreground'>
                    {item.created_by_full_name ?? t('contacts.unknownAuthor')} ·{' '}
                    {format(parseISO(item.created_at), 'd MMM yyyy, p', {
                      locale,
                    })}
                  </span>
                  <p className='text-sm'>{item.body}</p>
                </div>
              ))}
              {canManage ? (
                <div className={cn('grid gap-2 border-t pt-3')}>
                  <Label htmlFor={`note-${lead.id}`}>{t('contacts.addNote')}</Label>
                  <Textarea id={`note-${lead.id}`} value={note} onChange={event => setNote(event.target.value)} />
                  <div>
                    <Button
                      color='primary'
                      variant='outlined'
                      size='small'
                      disabled={!note.trim() || isAdding}
                      onClick={() => void submitNote()}
                    >
                      {t('contacts.saveNote')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </details>
        )}
        {canManage && !isLinked ? (
          <Button color='primary' variant='text' size='small' onClick={() => setLinking(null)}>
            {t('contacts.linkUser')}
          </Button>
        ) : null}
      </div>
      {linking !== false ? (
        <LinkUserDialog
          lead={lead}
          initial={linking}
          onOpenChange={open => !open && setLinking(false)}
          onLinked={onChanged}
        />
      ) : null}
    </li>
  );
}

export function ContactsTab() {
  const { t } = useTranslation('assisted');
  const canManage = useOrPermissions([PERMISSION.CONTACT_LEAD_MANAGE]);
  const [filter, setFilter] = useState<ContactLeadStatus | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const { response, reFetch } = usePromise(
    () => DansshipAPI.assistedAdmin.listContactLeads(filter ?? undefined),
    true,
    [filter],
  );
  const { response: all } = usePromise(() => DansshipAPI.assistedAdmin.listContactLeads(), true, [
    response?.data?.leads.length,
  ]);
  const counts = all?.data?.counts ?? {};
  const total = Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0);
  const leads = response?.data?.leads ?? [];

  return (
    <div className='grid gap-4'>
      <div className='grid gap-1'>
        <h2 className='text-lg font-semibold'>{t('contacts.title')}</h2>
        <p className='text-sm text-muted-foreground'>{t('contacts.help')}</p>
      </div>
      {canManage ? (
        <div>
          <Button color='primary' variant='solid' onClick={() => setIsNewOpen(true)}>
            {t('contacts.new')}
          </Button>
        </div>
      ) : null}
      <div className='flex flex-wrap gap-2'>
        <FilterChip
          active={filter === null}
          onClick={() => setFilter(null)}
          label={`${t('contacts.all')} (${total})`}
        />
        {STATUSES.map(status => (
          <FilterChip
            key={status}
            active={filter === status}
            onClick={() => setFilter(status)}
            label={`${t(`contacts.statuses.${status}`)} (${counts[status] ?? 0})`}
          />
        ))}
      </div>
      {leads.length === 0 ? <p className='text-sm text-muted-foreground'>{t('contacts.empty')}</p> : null}
      <ul className='divide-y rounded-md border'>
        {leads.map(lead => (
          <LeadRow key={lead.id} lead={lead} canManage={canManage} onChanged={() => void reFetch()} />
        ))}
      </ul>
      {isNewOpen ? <NewLeadDialog onOpenChange={setIsNewOpen} onCreated={() => void reFetch()} /> : null}
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs',
        active ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border hover:bg-muted',
      )}
    >
      {label}
    </button>
  );
}
