import { describe, expect, it } from 'vitest';

import { artistForm, mySignup } from './participation.fixtures';
import {
  initialSignupValues,
  toSignupApplication,
  toSignupPayload,
  validateSignup,
  type SignupFormValues,
} from './signup-form-values';
import { emptyTicket } from './tickets';

const t = (key: string) => key;
const visible = (actType: string) =>
  artistForm.fields.filter(
    field => field.kind !== 'people' && (!field.visible_when || field.visible_when.equals === actType),
  );
const groupOption = artistForm.registration_options[1];

function values(overrides: Partial<SignupFormValues> = {}): SignupFormValues {
  return { ...initialSignupValues(artistForm.fields, null, artistForm.registration_options), ...overrides };
}

describe('signup form values', () => {
  it('prefills an existing registration and its option', () => {
    const prefilled = initialSignupValues(
      artistForm.fields,
      { ...mySignup, registration_option: 'single' },
      artistForm.registration_options,
    );

    expect(prefilled.answers.act_name).toBe('Raíces');
    expect(prefilled.answers.music).toEqual({ url: 'https://youtu.be/x', note: 'Desde 0:08' });
    expect(prefilled.answers.photo_video).toBe(false);
    expect(prefilled.donation_type_ids).toEqual(['don-1']);
    expect(prefilled.registration_option).toBe('single');
  });

  it('preselects the only option and leaves "¿Cómo te inscribes?" open when there are several', () => {
    expect(initialSignupValues([], null, [{ kind: 'pair' }]).registration_option).toBe('pair');
    expect(values().registration_option).toBe('');
  });

  it('asks group members only when the chosen option is "En grupo"', () => {
    expect(
      validateSignup(values({ registration_option: 'single' }), visible('Lira'), t, artistForm.registration_options[0])
        .members,
    ).toBeUndefined();
    expect(validateSignup(values({ registration_option: 'group' }), visible('Lira'), t, groupOption).members).toBe(
      'eventos:participation.form.membersRequired',
    );
    expect(
      validateSignup(values({ registration_option: 'group' }), visible('Lira'), t, {
        ...groupOption,
        members_required: false,
      }).members,
    ).toBeUndefined();
  });

  it('checks adult members contact, the partner email, the party size and the long text limit', () => {
    const group = values({
      registration_option: 'group',
      answers: { act_type: 'Baile', act_name: 'Fuego', music: { url: 'x.com' }, announcement: 'x'.repeat(1001) },
      members: [{ full_name: 'Camila', is_minor: false, email: 'nope', phone: '', family_minor_user_id: '' }],
    });
    const errors = validateSignup(group, visible('Baile'), t, groupOption);

    expect(errors['answers.announcement']).toBe('eventos:participation.form.tooLong');
    expect(errors['members.0.email']).toBe('eventos:participation.form.emailInvalid');
    expect(errors['members.0.phone']).toBe('validation:required');
    expect(validateSignup(values({ registration_option: 'pair', partner_email: 'x' }), [], t).partner_email).toBe(
      'eventos:participation.form.emailInvalid',
    );
    expect(validateSignup(values({ registration_option: 'group_booking', people_count: '' }), [], t).people_count).toBe(
      'validation:required',
    );
  });

  it('sends visible answers, and members only for a group', () => {
    const filled = values({
      registration_option: 'group',
      answers: {
        act_type: 'Baile',
        act_name: ' Fuego ',
        music: { url: 'https://y.be', note: '' },
        announcement: 'Hola',
      },
      members: [
        { full_name: 'Camila', is_minor: false, email: 'c@x.com', phone: '300', family_minor_user_id: '' },
        { full_name: 'Lucía', is_minor: true, email: '', phone: '', family_minor_user_id: 'minor-1' },
      ],
      donation_type_ids: ['don-2'],
      accepted_terms: true,
    });
    const payload = toSignupPayload(filled, visible('Baile'), { termsVersionId: 'terms-1' });

    expect(payload.answers).toEqual({
      act_type: 'Baile',
      act_name: 'Fuego',
      music: { url: 'https://y.be', note: null },
      announcement: 'Hola',
    });
    expect(payload.members[1]).toEqual({ full_name: 'Lucía', is_minor: true, family_minor_user_id: 'minor-1' });
    expect(payload.registration_option).toBe('group');
    expect(payload.terms_version_id).toBe('terms-1');
    expect(
      toSignupPayload({ ...filled, registration_option: 'single' }, visible('Lira'), { termsVersionId: null }).members,
    ).toEqual([]);
  });

  it('builds the one signup body from the chosen option', () => {
    const extra = { participantTypeId: 'type-1', termsVersionId: 'terms-1' };
    const pair = toSignupApplication(values({ registration_option: 'pair', partner_email: ' ana@x.com ' }), [], extra);
    const tickets = toSignupApplication(
      values({
        registration_option: 'multi_ticket',
        tickets: [{ ...emptyTicket(), full_name: 'Ana', email: 'ana@x.com' }],
      }),
      [],
      extra,
    );
    const booking = toSignupApplication(
      values({ registration_option: 'group_booking', package_id: 'pkg-1', people_count: '8' }),
      [],
      extra,
    );

    expect(pair).toMatchObject({
      participant_type_id: 'type-1',
      registration_option: 'pair',
      partner_email: 'ana@x.com',
      tickets: [],
    });
    expect(tickets.tickets).toEqual([{ full_name: 'Ana', is_minor: false, email: 'ana@x.com' }]);
    expect(tickets.partner_email).toBeNull();
    expect(booking).toMatchObject({ package_id: 'pkg-1', people_count: 8, terms_version_id: 'terms-1' });
  });
});
