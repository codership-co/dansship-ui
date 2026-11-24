import { describe, expect, it } from 'vitest';

import { formItemKeyFrom, groupFormSections, isAnswerItem, type FormItem } from './form-items';

const item = (key: string, kind: FormItem['kind']): FormItem => ({
  key,
  label: key,
  kind,
  required: false,
  options: {},
});

describe('dynamic form items', () => {
  it('groups the questions under the section before them', () => {
    const groups = groupFormSections([
      item('intro', 'short_text'),
      item('s1', 'section'),
      item('a', 'choice'),
      item('b', 'long_text'),
      item('s2', 'section'),
      item('s3', 'section'),
      item('c', 'checkbox'),
    ]);

    expect(groups.map(group => [group.section?.key ?? null, group.items.map(entry => entry.key)])).toEqual([
      [null, ['intro']],
      ['s1', ['a', 'b']],
      ['s3', ['c']],
    ]);
  });

  it('answers only questions: sections and group members are not answered here', () => {
    expect(isAnswerItem(item('s', 'section'))).toBe(false);
    expect(isAnswerItem(item('p', 'people'))).toBe(false);
    expect(isAnswerItem(item('q', 'short_text'))).toBe(true);
  });

  it('makes stable unique keys from labels', () => {
    expect(formItemKeyFrom('¿Tu música?', [])).toBe('tu_musica');
    expect(formItemKeyFrom('Tu música', ['tu_musica'])).toBe('tu_musica_2');
    expect(formItemKeyFrom('2 opciones', [])).toBe('f_2_opciones');
  });
});
