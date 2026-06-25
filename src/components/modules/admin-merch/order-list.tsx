import { format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { OrderDetail } from './order-detail';

import { SpinnerLoader } from '@components/loaders';
import { PaymentStatusBadge } from '@components/modules';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { DansshipAPI, type Order, type OrderStatus } from '@core/api';
import { formatMerchPrice } from '@helpers';
import { useCallablePromise, usePromise } from '@hooks';

type StatusFilter = 'all' | OrderStatus;

function formatEntityDisplay(
  entity?: {
    human_identifier?: string | null;
    name?: string | null;
  } | null,
): string {
  return entity?.human_identifier ?? entity?.name ?? '-';
}

export function OrderList() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filters = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  };

  const { response: orders, isLoading } = usePromise(() => DansshipAPI.merchAdmin.getOrders(filters));

  const { call: cancelOrderPromise, isLoading: isCancelling } = useCallablePromise((id: string) =>
    DansshipAPI.merchAdmin.cancelOrder(id),
  );

  const cancelOrder = useCallback(
    async (id: string) => {
      const { ok } = await cancelOrderPromise(id);

      if (ok) {
        toast.success(t('merch:orderCancelled'));
      } else {
        toast.error(t('merch:errors.orderCancelFailed'));
      }
    },
    [cancelOrderPromise, t],
  );

  const sortedOrders = useMemo(
    () => [...(orders?.data ?? [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [orders],
  );

  const closeDetail = () => setSelectedOrder(null);

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='w-full sm:max-w-xs'>
          <p className='mb-2 text-sm text-gray-600'>{t('common:status')}</p>
          <Select value={statusFilter} onValueChange={value => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('common:all', { defaultValue: 'All' })}</SelectItem>
              <SelectItem value='pending'>{t('merch:orderStatus.pending')}</SelectItem>
              <SelectItem value='paid'>{t('merch:orderStatus.paid')}</SelectItem>
              <SelectItem value='cancelled'>{t('merch:orderStatus.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className='mb-2 text-sm text-gray-600'>{t('reports:dateFrom', { defaultValue: 'Date from' })}</p>
          <Input type='date' value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>

        <div>
          <p className='mb-2 text-sm text-gray-600'>{t('reports:dateTo', { defaultValue: 'Date to' })}</p>
          <Input type='date' value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t('common:email')}</TableHead>
              <TableHead>{t('payments:total')}</TableHead>
              <TableHead>{t('merch:orderStatusLabel', { defaultValue: 'Order status' })}</TableHead>
              <TableHead>{t('payments:statusLabel', { defaultValue: 'Payment status' })}</TableHead>
              <TableHead>{t('common:date')}</TableHead>
              <TableHead>{t('payments:userLabel')}</TableHead>
              <TableHead className='text-right'>{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='py-8 text-center text-gray-500'>
                  {t('common:noData')}
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className='font-mono text-xs'>{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{formatEntityDisplay(order.customer)}</TableCell>
                  <TableCell>{formatMerchPrice(order.total_amount)}</TableCell>
                  <TableCell>
                    <span className='capitalize'>{t(`merch.orderStatus.${order.status}`)}</span>
                  </TableCell>
                  <TableCell>
                    {order.payment_intent?.status ? (
                      <div className='space-y-1'>
                        <PaymentStatusBadge status={order.payment_intent.status} />
                        {order.payment_intent.status === 'pending_manual_review' ? (
                          <Link to='/admin/payments' className='block text-xs text-amber-700 underline'>
                            {t('payments:admin.review')}
                          </Link>
                        ) : null}
                      </div>
                    ) : (
                      <span className='text-gray-500'>-</span>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                  <TableCell>{formatEntityDisplay(order.created_by_user)}</TableCell>
                  <TableCell className='text-right'>
                    <Button variant='outline' size='sm' onClick={() => setSelectedOrder(order)}>
                      {t('merch:orderDetail')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={open => !open && closeDetail()}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-4xl'>
          <DialogHeader>
            <DialogTitle>{t('merch:orderDetail')}</DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <OrderDetail orderId={selectedOrder.id} onCancelOrder={cancelOrder} isCancelling={isCancelling} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
