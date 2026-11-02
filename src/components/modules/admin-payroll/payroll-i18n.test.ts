import { describe, expect, it } from 'vitest';

import { getDefaultPayrollFilters } from './payroll-filters';

import i18n from '@core/i18n';

const STATUSES = ['issued', 'confirmed', 'disputed', 'paid', 'voided'];

describe('payroll copy', () => {
  it('resolves every payroll key to Spanish copy', () => {
    const t = (key: string, options?: Record<string, unknown>) => i18n.t(`admin:payroll.${key}`, options);
    const keys = [
      ...['title', 'subtitle', 'tabs.payments', 'tabs.assignments', 'assignmentsSubtitle', 'issuedOn', 'empty'],
      ...['filters.title', 'filters.person', 'filters.status', 'filters.dateBy', 'filters.from', 'filters.to'],
      ...['filters.reset', 'filters.paidRangeHint', 'filters.allStatuses', 'filters.toggle', 'filters.pickDate'],
      ...['filters.dateFields.issued', 'filters.dateFields.paid', 'filters.summaryDate.issued'],
      ...['filters.summaryDate.paid', 'summary.paid', 'summary.pending', 'summary.count', 'summary.countDetail'],
      ...['table.person', 'table.period', 'table.amount', 'table.paidAmount', 'table.paidAt', 'table.status'],
      ...['table.documents', 'downloads.invoice', 'downloads.receipt', 'downloads.openFailed'],
      ...['export.button', 'export.success', 'export.failed', 'loadFailed'],
      ...['pagination.previous', 'pagination.next', 'paymentTypes.hourly_classes', 'paymentTypes.fixed_amount'],
      ...['paymentTypes.mixed', ...STATUSES.map(status => `status.${status}`)],
    ];

    for (const key of keys) {
      expect(t(key), key).not.toContain('payroll.');
    }

    for (const key of ['summary.paidDocuments', 'summary.pendingDocuments']) {
      for (const count of [0, 1, 5]) {
        expect(t(key, { count }), `${key} ${count}`).not.toContain('payroll.');
      }
    }

    expect(t('pagination.page', { page: 2, pages: 5 })).toBe('Página 2 de 5');
    expect(getDefaultPayrollFilters().status).toBe('all');
  });
});
