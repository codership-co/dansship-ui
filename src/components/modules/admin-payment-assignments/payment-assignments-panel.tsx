import { addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronDown } from 'react-icons/lu';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui';
import { DansshipAPI, type PaymentAssignment, type PaymentAssignmentState, type PaymentType } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatPrice } from '@helpers';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

type PersonOption = {
  id: string;
  full_name: string;
  email: string;
};

type AssignmentGroup = {
  userId: string;
  person: string;
  email: string;
  rows: Array<PaymentAssignment>;
};

type TimelineSegment = {
  key: string;
  flex: number;
  tone: PaymentAssignmentState | 'gap';
};

const STATE_VARIANT: Record<PaymentAssignmentState, 'outlineActive' | 'outline' | 'outlineNeutral'> = {
  active: 'outlineActive',
  scheduled: 'outline',
  ended: 'outlineNeutral',
};

function groupAssignments(items: Array<PaymentAssignment>): Array<AssignmentGroup> {
  const groups = new Map<string, AssignmentGroup>();

  for (const item of items) {
    const current = groups.get(item.user_id);

    if (current) {
      current.rows.push(item);

      continue;
    }

    groups.set(item.user_id, {
      userId: item.user_id,
      person: item.full_name,
      email: item.email,
      rows: [item],
    });
  }

  return [...groups.values()].map(group => ({
    ...group,
    rows: [...group.rows].sort((left, right) => left.start_date.localeCompare(right.start_date)),
  }));
}

function timelineSegments(rows: Array<PaymentAssignment>): Array<TimelineSegment> {
  const sorted = [...rows].sort((left, right) => left.start_date.localeCompare(right.start_date));
  const origin = parseISO(sorted[0].start_date);
  const latestStart = sorted.reduce((latest, row) => {
    const start = parseISO(row.start_date);

    return start > latest ? start : latest;
  }, origin);
  const horizon = addMonths(latestStart, 6);
  const end = sorted.reduce((latest, row) => {
    const rowEnd = row.end_date ? parseISO(row.end_date) : horizon;

    return rowEnd > latest ? rowEnd : latest;
  }, horizon);
  const span = Math.max(differenceInCalendarDays(end, origin), 1);
  const segments: Array<TimelineSegment> = [];
  let cursor = 0;

  for (const row of sorted) {
    const from = Math.max(differenceInCalendarDays(parseISO(row.start_date), origin), 0);
    const rowEnd = row.end_date ? parseISO(row.end_date) : end;
    const to = Math.min(Math.max(differenceInCalendarDays(rowEnd, origin), from + 1), span);

    if (from > cursor) {
      segments.push({ key: `gap-${row.id}`, flex: from - cursor, tone: 'gap' });
    }

    segments.push({ key: row.id, flex: Math.max(to - from, 1), tone: row.state });
    cursor = to;
  }

  if (cursor < span) {
    segments.push({ key: 'tail', flex: span - cursor, tone: 'gap' });
  }

  return segments;
}

function segmentClassName(tone: TimelineSegment['tone']) {
  if (tone === 'active') return 'bg-active';

  if (tone === 'scheduled') return 'bg-info';

  if (tone === 'ended') return 'bg-gray-300';

  return 'bg-transparent';
}

export function PaymentAssignmentsPanel({ onReady }: { onReady: (openCreate: () => void) => void }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading, reFetch } = usePromise(() =>
    DansshipAPI.instructorPaymentsAdmin.listPaymentAssignments(),
  );
  const { call: createAssignment, isLoading: isCreating } = useCallablePromise(
    (payload: {
      user_id: string;
      payment_type: PaymentType;
      amount: number;
      start_date: string;
      end_date: string | null;
    }) => DansshipAPI.instructorPaymentsAdmin.createPaymentAssignment(payload),
  );
  const { call: updateAssignment, isLoading: isUpdating } = useCallablePromise(
    (
      assignmentId: string,
      payload: {
        payment_type: PaymentType;
        amount: number;
        start_date: string;
        end_date: string | null;
      },
    ) => DansshipAPI.instructorPaymentsAdmin.updatePaymentAssignment(assignmentId, payload),
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<PaymentAssignment | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [person, setPerson] = useState<PersonOption | null>(null);
  const [query, setQuery] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('hourly_classes');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const dialogOpen = createOpen || editing !== null;
  const searchEnabled = dialogOpen && !editing && query.trim().length >= 3;
  const { response: searchResponse, isLoading: isSearching } = usePromise(
    () => DansshipAPI.usersAdmin.search({ search: query.trim(), limit: 8 }),
    searchEnabled,
    [query],
  );
  const groups = useMemo(() => groupAssignments(response?.data?.items ?? []), [response?.data?.items]);
  const searchResults = searchResponse?.data?.items ?? [];
  const isSaving = isCreating || isUpdating;

  const openCreate = useCallback(() => {
    setEditing(null);
    setPerson(null);
    setQuery('');
    setPaymentType('hourly_classes');
    setAmount('');
    setStartDate('');
    setEndDate('');
    setCreateOpen(true);
  }, []);

  useEffect(() => {
    onReady(openCreate);
  }, [onReady, openCreate]);

  const openEdit = (assignment: PaymentAssignment) => {
    setCreateOpen(false);
    setEditing(assignment);
    setPerson({ id: assignment.user_id, full_name: assignment.full_name, email: assignment.email });
    setQuery('');
    setPaymentType(assignment.payment_type);
    setAmount(String(assignment.amount));
    setStartDate(assignment.start_date);
    setEndDate(assignment.end_date ?? '');
  };

  const closeDialog = () => {
    setCreateOpen(false);
    setEditing(null);
  };

  const formatDay = (value: string) => format(parseISO(value), 'd MMM yyyy', { locale });

  const handleSave = async () => {
    const parsedAmount = Number(amount);

    if (!person || !startDate || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error(t('admin:paymentAssignments.invalid'));

      return;
    }

    if (endDate && endDate < startDate) {
      toast.error(t('admin:paymentAssignments.invalidRange'));

      return;
    }

    const payload = {
      payment_type: paymentType,
      amount: parsedAmount,
      start_date: startDate,
      end_date: endDate || null,
    };
    const result = editing
      ? await updateAssignment(editing.id, payload)
      : await createAssignment({ ...payload, user_id: person.id });

    if (!result.ok) {
      toast.error(t('admin:paymentAssignments.saveFailed'));

      return;
    }

    toast.success(t('admin:paymentAssignments.saveSuccess'));
    closeDialog();
    void reFetch();
  };

  return (
    <section className='grid gap-4'>
      {isLoading ? <SpinnerLoader /> : null}

      {!isLoading && !groups.length ? (
        <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin:paymentAssignments.empty')}</p>
      ) : null}

      {groups.map(group => {
        const isOpen = Boolean(expanded[group.userId]);
        const multiple = group.rows.length > 1;

        return (
          <article key={group.userId} className='rounded-md border bg-white'>
            <div className='flex w-full items-center justify-between gap-3 p-4'>
              <button
                type='button'
                className='flex min-w-0 flex-1 items-center justify-between gap-3 text-left'
                onClick={() =>
                  setExpanded(current => ({
                    ...current,
                    [group.userId]: !current[group.userId],
                  }))
                }
              >
                <span className='min-w-0'>
                  <span className='block font-semibold'>{group.person}</span>
                  <span className='block truncate text-sm text-muted-foreground'>{group.email}</span>
                </span>
                <span className='flex items-center gap-2'>
                  {multiple ? (
                    <Badge variant='outlineTertiary' size='small'>
                      {t('admin:paymentAssignments.multiple', { count: group.rows.length })}
                    </Badge>
                  ) : null}
                  <LuChevronDown className={isOpen ? 'rotate-180' : undefined} />
                </span>
              </button>
              <Link
                className='shrink-0 text-sm font-semibold text-primary'
                to={PageURLS.admin.userDetails(group.userId)}
              >
                {t('admin:users.viewUser')}
              </Link>
            </div>

            {isOpen ? (
              <div className='grid gap-3 border-t px-4 py-4'>
                {multiple ? (
                  <div className='flex h-2 overflow-hidden rounded-full bg-muted'>
                    {timelineSegments(group.rows).map(segment => (
                      <div
                        key={segment.key}
                        className={segmentClassName(segment.tone)}
                        style={{ flex: segment.flex }}
                      />
                    ))}
                  </div>
                ) : null}

                {group.rows.map(row => (
                  <div key={row.id} className='flex flex-wrap items-center justify-between gap-3'>
                    <div className='grid gap-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge variant='outlineTertiary' size='small'>
                          {t(`admin:paymentAssignments.types.${row.payment_type}`)}
                        </Badge>
                        <Badge variant={STATE_VARIANT[row.state]} size='small'>
                          {t(`admin:paymentAssignments.states.${row.state}`)}
                        </Badge>
                      </div>
                      <p className='text-sm'>
                        {formatPrice(row.amount, 'COP')}
                        {t(`admin:paymentAssignments.amountSuffix.${row.payment_type}`)}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {row.end_date
                          ? t('admin:paymentAssignments.range', {
                              start: formatDay(row.start_date),
                              end: formatDay(row.end_date),
                            })
                          : t('admin:paymentAssignments.openRange', { start: formatDay(row.start_date) })}
                      </p>
                    </div>
                    <Button type='button' variant='outline' onClick={() => openEdit(row)}>
                      {t('admin:paymentAssignments.edit')}
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}

      <Dialog open={dialogOpen} onOpenChange={open => (open ? undefined : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t('admin:paymentAssignments.editTitle') : t('admin:paymentAssignments.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {editing ? t('admin:paymentAssignments.editHint') : t('admin:paymentAssignments.formHint')}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='grid gap-1.5'>
              <Label htmlFor='payment-assignment-person'>{t('admin:paymentAssignments.person')}</Label>
              {person ? (
                <div className='flex items-center justify-between gap-3 rounded-md border px-3 py-2'>
                  <span>
                    <span className='block text-sm font-medium'>{person.full_name}</span>
                    <span className='block text-xs text-muted-foreground'>{person.email}</span>
                  </span>
                  {editing ? null : (
                    <Button type='button' variant='outline' onClick={() => setPerson(null)}>
                      {t('admin:paymentAssignments.changePerson')}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Input
                    id='payment-assignment-person'
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder={t('admin:paymentAssignments.personPlaceholder')}
                  />
                  {searchEnabled ? (
                    <div className='grid rounded-md border'>
                      {isSearching ? (
                        <p className='px-3 py-2 text-sm text-muted-foreground'>
                          {t('admin:paymentAssignments.searching')}
                        </p>
                      ) : null}
                      {!isSearching && !searchResults.length ? (
                        <p className='px-3 py-2 text-sm text-muted-foreground'>
                          {t('admin:paymentAssignments.noPeople')}
                        </p>
                      ) : null}
                      {searchResults.map(result => (
                        <button
                          key={result.id}
                          type='button'
                          className='px-3 py-2 text-left text-sm hover:bg-muted'
                          onClick={() => setPerson({ id: result.id, full_name: result.full_name, email: result.email })}
                        >
                          <span className='block font-medium'>{result.full_name}</span>
                          <span className='block text-xs text-muted-foreground'>{result.email}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className='text-xs text-muted-foreground'>{t('admin:paymentAssignments.searchHint')}</p>
                  )}
                </>
              )}
            </div>

            <div className='grid gap-1.5'>
              <Label>{t('admin:paymentAssignments.type')}</Label>
              <Select value={paymentType} onValueChange={value => setPaymentType(value as PaymentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='hourly_classes'>{t('admin:paymentAssignments.types.hourly_classes')}</SelectItem>
                  <SelectItem value='fixed_amount'>{t('admin:paymentAssignments.types.fixed_amount')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-1.5'>
              <Label htmlFor='payment-assignment-amount'>{t('admin:paymentAssignments.amount')}</Label>
              <Input
                id='payment-assignment-amount'
                type='number'
                min='1'
                step='1'
                value={amount}
                onChange={event => setAmount(event.target.value)}
              />
            </div>

            <div className='grid gap-1.5'>
              <Label htmlFor='payment-assignment-start'>{t('admin:paymentAssignments.start')}</Label>
              <Input
                id='payment-assignment-start'
                type='date'
                value={startDate}
                onChange={event => setStartDate(event.target.value)}
              />
            </div>

            <div className='grid gap-1.5'>
              <Label htmlFor='payment-assignment-end'>{t('admin:paymentAssignments.end')}</Label>
              <Input
                id='payment-assignment-end'
                type='date'
                value={endDate}
                onChange={event => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={closeDialog}>
              {t('common:cancel')}
            </Button>
            <Button type='button' onClick={() => void handleSave()} disabled={isSaving}>
              {t('admin:paymentAssignments.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
