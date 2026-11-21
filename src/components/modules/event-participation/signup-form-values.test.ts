import { describe, expect, it } from 'vitest';

import { artistForm, mySignup } from './participation.fixtures';
import { initialSignupValues, toSignupPayload, validateSignup } from './signup-form-values';

const t = (key: string) => key;
const visible = (actType: string) =>
  artistForm.fields.filter(field => !field.visible_when || field.visible_when.equals === actType);

describe('signup form values', () => {
  it('prefills an existing registration', () => {
    const values = initialSignupValues(artistForm.fields, mySignup);

    expect(values.answers.act_name).toBe('Raíces');
    expect(values.answers.music).toEqual({ url: 'https://youtu.be/x', note: 'Desde 0:08' });
    expect(values.answers.photo_video).toBe(false);
    expect(values.donation_type_ids).toEqual(['don-1']);
  });

  it('asks for required answers and group members only when they are shown', () => {
    const values = initialSignupValues(artistForm.fields);

    expect(Object.keys(validateSignup(values, visible('Lira'), t))).toEqual(
      expect.arrayContaining(['answers.act_type', 'answers.act_name', 'answers.music.url', 'answers.announcement']),
    );
    expect(validateSignup(values, visible('Lira'), t).members).toBeUndefined();
    expect(validateSignup(values, visible('Baile'), t).members).toBe('eventos:participation.form.membersRequired');
  });

  it('checks adult members contact and the long text limit', () => {
    const values = {
      ...initialSignupValues(artistForm.fields),
      answers: { act_type: 'Baile', act_name: 'Fuego', music: { url: 'x.com' }, announcement: 'x'.repeat(1001) },
      members: [{ full_name: 'Camila', is_minor: false, email: 'nope', phone: '', family_minor_user_id: '' }],
    };

    const errors = validateSignup(values, visible('Baile'), t);

    expect(errors['answers.announcement']).toBe('eventos:participation.form.tooLong');
    expect(errors['members.0.email']).toBe('eventos:participation.form.emailInvalid');
    expect(errors['members.0.phone']).toBe('validation:required');
  });

  it('sends visible answers only and minors by name', () => {
    const values = {
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
    };

    const payload = toSignupPayload(values, visible('Baile'), { termsVersionId: 'terms-1', accessToken: 'tok' });

    expect(payload.answers).toEqual({
      act_type: 'Baile',
      act_name: 'Fuego',
      music: { url: 'https://y.be', note: null },
      announcement: 'Hola',
    });
    expect(payload.members[1]).toEqual({ full_name: 'Lucía', is_minor: true, family_minor_user_id: 'minor-1' });
    expect(payload.terms_version_id).toBe('terms-1');
    expect(toSignupPayload(values, visible('Lira'), { termsVersionId: null, accessToken: null }).members).toEqual([]);
  });
});
