import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { type AdminWorkshopListItem } from '@core/api';
import { PageURLS } from '@core/constants';

interface TalleresListProps {
  items: Array<AdminWorkshopListItem>;
}

export function TalleresList({ items }: TalleresListProps) {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('talleres:admin.columns.name')}</TableHead>
          <TableHead>{t('talleres:admin.columns.date')}</TableHead>
          <TableHead>{t('talleres:admin.columns.status')}</TableHead>
          <TableHead>{t('talleres:admin.columns.enrolled')}</TableHead>
          <TableHead>{t('talleres:admin.columns.edit')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={`${item.kind}-${item.id}`}>
            <TableCell>
              <div className='flex items-center gap-2'>
                {item.kind === 'combo' ? <Badge variant='outline'>{t('talleres:admin.comboBadge')}</Badge> : null}
                <span>{item.name}</span>
              </div>
            </TableCell>
            <TableCell>{item.date_label ?? '—'}</TableCell>
            <TableCell>
              {item.status === 'published' ? t('talleres:admin.published') : t('talleres:admin.draft')}
            </TableCell>
            <TableCell>
              {item.capacity !== null ? `${item.holding_registrations}/${item.capacity}` : item.holding_registrations}
            </TableCell>
            <TableCell>
              <Button asChild variant='outline' size='sm'>
                <Link
                  to={
                    item.kind === 'combo' ? PageURLS.admin.tallerComboEdit(item.id) : PageURLS.admin.tallerEdit(item.id)
                  }
                >
                  {t('talleres:admin.columns.edit')}
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
