import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { usePromise } from '@hooks';

interface InstructorWorkshopRosterProps {
  workshopId: string;
}

export function InstructorWorkshopRoster({ workshopId }: InstructorWorkshopRosterProps) {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(
    () => DansshipAPI.talleres.getTeachingRoster(workshopId),
    Boolean(workshopId),
    [workshopId],
  );

  if (isLoading) {
    return (
      <div className='flex justify-center p-8'>
        <SpinnerLoader />
      </div>
    );
  }

  if (!response?.ok) {
    return <p className='m-0 text-sm text-muted-foreground'>{t('instructor:home.workshopRosterError')}</p>;
  }

  const rows = response.data ?? [];

  if (rows.length === 0) {
    return <p className='m-0 text-sm text-muted-foreground'>{t('instructor:home.workshopRosterEmpty')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('instructor:home.workshopRosterName')}</TableHead>
          <TableHead>{t('instructor:home.workshopRosterEmail')}</TableHead>
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
