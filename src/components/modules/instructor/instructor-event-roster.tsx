import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { usePromise } from '@hooks';

interface InstructorEventRosterProps {
  eventId: string;
}

export function InstructorEventRoster({ eventId }: InstructorEventRosterProps) {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.eventos.getTeachingRoster(eventId), Boolean(eventId), [
    eventId,
  ]);

  if (isLoading) {
    return (
      <div className='flex justify-center p-8'>
        <SpinnerLoader />
      </div>
    );
  }

  if (!response?.ok) {
    return <p className='m-0 text-sm text-muted-foreground'>{t('instructor:home.eventRosterError')}</p>;
  }

  const rows = response.data ?? [];

  if (rows.length === 0) {
    return <p className='m-0 text-sm text-muted-foreground'>{t('instructor:home.eventRosterEmpty')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('instructor:home.eventRosterName')}</TableHead>
          <TableHead>{t('instructor:home.eventRosterEmail')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={`${row.email}-${index}`}>
            <TableCell className='font-semibold text-primary'>{row.display_name}</TableCell>
            <TableCell>{row.email}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
