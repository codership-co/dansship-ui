import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BookingModal } from './booking-modal';

import '@core/i18n';

import type { ActiveSubscription, PublishedClass } from '@core/api';

const bookClass = vi.fn();

const DAY = 24 * 60 * 60 * 1000;
const dateKey = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

const plan = {
  id: 'sub-1',
  plan_id: 'plan-1',
  status: 'active',
  plan_name_snapshot: 'Mensual',
  class_count_snapshot: 8,
  price_snapshot: 0,
  expiration_policy_snapshot: '',
  remaining_classes: 5,
  bonus_classes_remaining: 0,
  bonus_expires_at: null,
  start_date: dateKey(-1),
  expiration_date: dateKey(30),
  original_price: 0,
  final_price: 0,
} as unknown as ActiveSubscription;

vi.mock('@contexts', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 'guardian', email: 'ana@correo.com' } }),
  useStudentSession: () => ({
    bookings: [],
    subscriptions: [plan],
    isTrialEligible: false,
    isLoadingSubscriptions: false,
  }),
}));

vi.mock('@hooks', async importOriginal => ({
  ...(await importOriginal<typeof import('@hooks')>()),
  useMyBookings: () => ({ bookClass, cancelClass: vi.fn(), isBookingClass: false, isCancelingClass: false }),
}));

vi.mock('@core/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@core/api')>();

  return {
    ...actual,
    DansshipAPI: {
      ...actual.DansshipAPI,
      family: {
        ...actual.DansshipAPI.family,
        getBookingPayer: vi.fn(async () => ({
          ok: true,
          data: {
            trial_eligible: false,
            subscriptions: [
              {
                id: 'sub-1',
                status: 'active',
                plan_name: 'Mensual',
                remaining_classes: 5,
                bonus_classes_remaining: 0,
                bonus_expires_at: null,
                start_date: dateKey(-1),
                expiration_date: dateKey(30),
              },
            ],
          },
        })),
      },
      bookings: {
        ...actual.DansshipAPI.bookings,
        getMyBookings: vi.fn(async () => ({ ok: true, data: { items: [], total: 0 } })),
      },
    },
  };
});

const start = new Date(Date.now() + 3 * DAY);
const twoForOneClass = {
  id: 'class-1',
  start_time: start.toISOString(),
  end_time: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
  capacity: 12,
  enrolled_count: 2,
  is_cancelled: false,
  two_for_one_eligible: true,
  user_booking_status: null,
  class_definition: { name: 'Pole Flow' },
  instructor: null,
  room: null,
} as unknown as PublishedClass;

const family = [
  { id: 'guardian', label: 'Yo' },
  { id: 'minor-1', label: 'Sofía · 9' },
  { id: 'minor-2', label: 'Mateo · 6' },
];

const renderModal = (attendeeUserId: string, attendeeOptions = family) =>
  render(
    <MemoryRouter>
      <BookingModal
        isOpen
        onClose={vi.fn()}
        selectedClass={twoForOneClass}
        attendeeUserId={attendeeUserId}
        attendeeName={attendeeOptions.find(option => option.id === attendeeUserId)?.label ?? null}
        attendeeOptions={attendeeOptions}
      />
    </MemoryRouter>,
  );

const pickFamilyCompanion = async (label: string) => {
  fireEvent.click(await screen.findByRole('button', { name: 'Mi familia' }));
  fireEvent.click(screen.getByRole('combobox', { name: /Acompañante de tu familia/ }));
  fireEvent.click(await screen.findByRole('option', { name: label }));
};

describe('BookingModal 2x1 companion', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = () => undefined;
    Element.prototype.hasPointerCapture = () => false;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    bookClass.mockReset();
    bookClass.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('lets a guardian bring one of their minors from the family', async () => {
    renderModal('guardian');

    await pickFamilyCompanion('Sofía · 9');
    fireEvent.click(screen.getByRole('button', { name: /Reservar/ }));

    await waitFor(() => expect(bookClass).toHaveBeenCalled());
    expect(bookClass).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduled_class_id: 'class-1',
        companion_user_id: 'minor-1',
        companion_email: undefined,
      }),
    );
  });

  it('offers the guardian and the other minors, never the attendee', async () => {
    renderModal('minor-1');

    fireEvent.click(await screen.findByRole('button', { name: 'Mi familia' }));
    fireEvent.click(screen.getByRole('combobox', { name: /Acompañante de tu familia/ }));

    expect(await screen.findByRole('option', { name: 'Yo' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Mateo · 6' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Sofía · 9' })).toBeNull();
  });

  it('lets a minor booking bring a companion by email, including the guardian', async () => {
    renderModal('minor-1');

    const email = await screen.findByLabelText(/Correo de tu acompañante/);
    fireEvent.change(email, { target: { value: 'ana@correo.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Reservar/ }));

    await waitFor(() => expect(bookClass).toHaveBeenCalled());
    expect(bookClass).toHaveBeenCalledWith(
      expect.objectContaining({
        attendee_user_id: 'minor-1',
        companion_email: 'ana@correo.com',
        companion_user_id: undefined,
      }),
    );
  });

  it('keeps the self-reference check when booking for oneself', async () => {
    renderModal('guardian');

    const email = await screen.findByLabelText(/Correo de tu acompañante/);
    fireEvent.change(email, { target: { value: 'Ana@correo.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Reservar/ }));

    expect(await screen.findByText(/No puedes nombrarte a ti misma/)).toBeTruthy();
    expect(bookClass).not.toHaveBeenCalled();
  });

  it('shows only the email field without minors in care', async () => {
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} selectedClass={twoForOneClass} />
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText(/Correo de tu acompañante/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mi familia' })).toBeNull();
  });
});
