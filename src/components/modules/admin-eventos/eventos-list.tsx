import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { type AdminEventListItem } from '@core/api';
import { PageURLS } from '@core/constants';

interface EventosListProps {
  items: Array<AdminEventListItem>;
}

export function EventosList({ items }: EventosListProps) {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('eventos:admin.columns.name')}</TableHead>
          <TableHead>{t('eventos:admin.columns.date')}</TableHead>
          <TableHead>{t('eventos:admin.columns.status')}</TableHead>
          <TableHead>{t('eventos:admin.columns.enrolled')}</TableHead>
          <TableHead>{t('eventos:admin.columns.edit')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={`${item.kind}-${item.id}`}>
            <TableCell>
              <div className='flex items-center gap-2'>
                {item.kind === 'combo' ? (
                  <Badge variant='outline'>{t('eventos:admin.comboBadge')}</Badge>
                ) : item.type_label ? (
                  <Badge variant='outline'>{item.type_label}</Badge>
                ) : null}
                <span>{item.name}</span>
              </div>
            </TableCell>
            <TableCell>{item.date_label ?? '—'}</TableCell>
            <TableCell>
              {item.status === 'published' ? t('eventos:admin.published') : t('eventos:admin.draft')}
            </TableCell>
            <TableCell>
              {item.capacity !== null ? `${item.holding_registrations}/${item.capacity}` : item.holding_registrations}
            </TableCell>
            <TableCell>
              <Button asChild variant='outline' size='sm'>
                <Link
                  to={
                    item.kind === 'combo' ? PageURLS.admin.eventoComboEdit(item.id) : PageURLS.admin.eventoEdit(item.id)
                  }
                >
                  {t('eventos:admin.columns.edit')}
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
