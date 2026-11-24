import { format } from 'date-fns';
import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import {
  adminCellText,
  bogotaDayLabel,
  signupStatusLabel,
  type PeopleColumn,
  type PeopleKind,
  type ParticipationPersonRow,
} from '@core/api';

export const PRINT_BODY_CLASS = 'printing-list';

/** "sábado, 12 de diciembre · 3:30 p. m." in Bogotá time. */
export function eventDateTimeLabel(iso: string | null | undefined): string {
  if (!iso) return '';

  const time = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

  return `${bogotaDayLabel(iso)} · ${time}`;
}

export interface PrintEntry {
  person: ParticipationPersonRow;
  minors: Array<ParticipationPersonRow>;
}

/** Adults in alphabetical order with their minors under them; orphan minors stay as rows. */
export function groupForPrint(rows: Array<ParticipationPersonRow>): Array<PrintEntry> {
  const byName = (a: ParticipationPersonRow, b: ParticipationPersonRow) =>
    a.full_name.localeCompare(b.full_name, 'es', { sensitivity: 'base' });
  const shown = new Set(rows.map(row => row.person_id));
  const minorsOf = new Map<string, Array<ParticipationPersonRow>>();
  const entries: Array<PrintEntry> = [];

  rows.forEach(row => {
    if (row.is_minor && row.attached_to_person_id && shown.has(row.attached_to_person_id)) {
      minorsOf.set(row.attached_to_person_id, [...(minorsOf.get(row.attached_to_person_id) ?? []), row]);
    }
  });
  rows.forEach(row => {
    if (row.is_minor && row.attached_to_person_id && shown.has(row.attached_to_person_id)) return;

    entries.push({ person: row, minors: (minorsOf.get(row.person_id) ?? []).sort(byName) });
  });

  return entries.sort((a, b) => byName(a.person, b.person));
}

interface ParticipationPrintListProps {
  rows: Array<ParticipationPersonRow>;
  columns: Array<PeopleColumn>;
  kind: PeopleKind;
  eventName: string;
  eventStartsAt?: string | null;
  filterLabel: string;
  printedAt: Date;
}

const BOX = <span aria-hidden className='inline-block size-4 border border-foreground align-middle' />;

/**
 * The paper list for the door (plan B): exactly the filtered Inscritos rows, rendered in a
 * portal that only shows while printing. Generated in the browser; nothing is stored.
 */
export function ParticipationPrintList({
  rows,
  columns,
  kind,
  eventName,
  eventStartsAt,
  filterLabel,
  printedAt,
}: ParticipationPrintListProps) {
  const { t } = useTranslation();
  /*
   * Created up front and attached in a layout effect, so a flushSync render has the list
   * in the document before window.print() runs.
   */
  const [container] = useState(() => {
    const node = document.createElement('div');

    node.className = 'print-root';
    node.setAttribute('data-testid', 'print-root');

    return node;
  });

  useLayoutEffect(() => {
    document.body.appendChild(container);

    return () => {
      container.remove();
    };
  }, [container]);

  const entries = groupForPrint(rows);
  const holders = kind === 'holders';
  const members = kind === 'members';
  const cell = 'border border-foreground px-1.5 py-1 align-top text-left';
  const headers = holders
    ? [
        t('eventos:participation.print.name'),
        ...columns.map(column => column.label),
        t('eventos:participation.print.group'),
        t('eventos:participation.print.donations'),
      ]
    : members
      ? [
          t('eventos:participation.print.name'),
          t('eventos:participation.print.group'),
          t('eventos:participation.print.leader'),
        ]
      : [
          t('eventos:participation.print.name'),
          t('eventos:participation.print.email'),
          t('eventos:participation.print.type'),
        ];

  const cells = (row: ParticipationPersonRow) =>
    holders
      ? [
          ...columns.map(column => adminCellText(row.answers[column.key], t)),
          row.member_count > 1
            ? t('eventos:participation.people.groupOf', { count: row.member_count, minors: row.minor_count })
            : t('eventos:participation.people.solo'),
          row.donations.length
            ? `${row.donations.join(', ')}${row.donation_received ? ` (${t('eventos:participation.print.received')})` : ''}`
            : '—',
        ]
      : members
        ? [row.signup_title ?? '—', row.leader_name ?? '—']
        : [row.email ?? '—', row.participant_type_name];

  return createPortal(
    <section className='grid gap-2 bg-background font-sans text-foreground'>
      <header className='grid gap-0.5 border-b-2 border-foreground pb-2'>
        <p className='m-0 text-[9pt] font-bold tracking-wide uppercase'>
          {t('eventos:participation.print.confidential')}
        </p>
        <p className='m-0 text-[16pt] font-bold'>{eventName}</p>
        <p className='m-0'>{eventDateTimeLabel(eventStartsAt)}</p>
        <p className='m-0'>
          {t('eventos:participation.print.filter', { filter: filterLabel })} ·{' '}
          {t('eventos:participation.print.total', { count: rows.length })}
        </p>
        <p className='m-0 text-[9pt]'>
          {t('eventos:participation.print.printedAt', { date: format(printedAt, 'dd/MM/yyyy HH:mm') })}
        </p>
        <p className='m-0 text-[9pt]'>{t('eventos:participation.print.entriesHint')}</p>
      </header>
      {entries.length === 0 ? (
        <p className='m-0'>{t('eventos:participation.print.empty')}</p>
      ) : (
        <table className='w-full border-collapse'>
          <thead>
            <tr>
              <th className={`${cell} w-14`}>{t('eventos:participation.print.entry')}</th>
              {headers.map(header => (
                <th key={header} className={cell}>
                  {header}
                </th>
              ))}
              <th className={cell}>{t('eventos:participation.print.status')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ person, minors }) => [
              <tr key={person.person_id} data-print-row='person'>
                <td className={`${cell} text-center`}>{BOX}</td>
                <td className={`${cell} font-semibold`}>
                  {person.is_minor
                    ? t('eventos:participation.print.minor', { name: person.full_name })
                    : person.full_name}
                  {holders && person.announcement_copy ? (
                    <p className='m-0 mt-1 text-[9.5pt] font-normal whitespace-pre-line'>
                      {t('eventos:participation.print.announcement', { text: person.announcement_copy })}
                    </p>
                  ) : null}
                </td>
                {cells(person).map((value, index) => (
                  <td key={`${person.person_id}-${index}`} className={cell}>
                    {value}
                  </td>
                ))}
                <td className={cell}>{signupStatusLabel(person.status, t, 'admin')}</td>
              </tr>,
              ...minors.map(minor => (
                <tr key={minor.person_id} data-print-row='minor'>
                  <td className={`${cell} text-center`}>{BOX}</td>
                  <td className={cell} colSpan={headers.length + 1}>
                    ↳ {t('eventos:participation.print.minor', { name: minor.full_name })}
                  </td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      )}
    </section>,
    container,
  );
}
