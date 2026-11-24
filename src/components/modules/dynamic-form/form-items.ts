/**
 * Dynamic forms (Google Forms style): an ordered list of items. A `section` item is a title (and an optional
 * description in `help_text`); every question after it, up to the next section, belongs to it.
 * The shapes match the API's form fields, so event signups, surveys and any other form can share them.
 */

export type FormItemKind =
  | 'short_text'
  | 'long_text'
  | 'link'
  | 'choice'
  | 'multi_choice'
  | 'checkbox'
  | 'people'
  | 'section';

export interface FormItemOptions {
  choices?: Array<string>;
  max_length?: number;
  with_note?: boolean;
  max_people?: number;
}

export interface FormItemVisibleWhen {
  field_key: string;
  equals: string;
}

export interface FormItem {
  key: string;
  label: string;
  kind: FormItemKind;
  required: boolean;
  options: FormItemOptions;
  /** Help under a question, or a section's description. */
  help_text?: string | null;
  visible_when?: FormItemVisibleWhen | null;
  admin_editable_copy?: boolean;
  show_in_admin_list?: boolean;
}

export type FormAnswer = string | boolean | Array<string> | { url?: string; note?: string | null } | null;

/** What the builder asks for each kind. A new kind is one entry here (plus its input in `ANSWER_INPUTS`). */
export interface FormItemKindMeta {
  /** A layout item: never answered, required or conditional. */
  layout?: boolean;
  /** Answered outside the dynamic form (group members come from the signup option). */
  external?: boolean;
  /** Takes a whole row of the two-column section grid. */
  fullWidth?: boolean;
  /** A list of choices (also a source for "visible when"). */
  choices?: boolean;
  maxLength?: boolean;
  note?: boolean;
  /** The team may edit a copy of the answer. */
  adminCopy?: boolean;
  /** May be shown as a column in the answers list. */
  listColumn?: boolean;
  /** Fixed options sent with the item. */
  defaults?: FormItemOptions;
}

export const FORM_ITEM_KINDS: Record<FormItemKind, FormItemKindMeta> = {
  short_text: { listColumn: true },
  long_text: { fullWidth: true, maxLength: true, adminCopy: true, listColumn: true },
  link: { fullWidth: true, note: true, listColumn: true },
  choice: { choices: true, listColumn: true },
  multi_choice: { fullWidth: true, choices: true, listColumn: true },
  checkbox: { fullWidth: true, listColumn: true },
  people: { external: true, defaults: { max_people: 30 } },
  section: { layout: true },
};

export const LONG_TEXT_DEFAULT_MAX = 1000;

export function isLayoutItem(item: Pick<FormItem, 'kind'>): boolean {
  return Boolean(FORM_ITEM_KINDS[item.kind]?.layout);
}

/** Items answered by the dynamic form itself. */
export function isAnswerItem(item: Pick<FormItem, 'kind'>): boolean {
  const meta = FORM_ITEM_KINDS[item.kind];

  return Boolean(meta) && !meta.layout && !meta.external;
}

export function isItemVisible(item: FormItem, answers: Record<string, unknown>): boolean {
  if (!item.visible_when) return true;

  const value = answers[item.visible_when.field_key];

  return Array.isArray(value) ? value.includes(item.visible_when.equals) : value === item.visible_when.equals;
}

export interface FormSectionGroup<T extends FormItem = FormItem> {
  key: string;
  /** Null for the questions before the first section. */
  section: T | null;
  items: Array<T>;
}

/** Splits the ordered items into sections; a section without questions to show is left out. */
export function groupFormSections<T extends FormItem>(items: Array<T>): Array<FormSectionGroup<T>> {
  const groups: Array<FormSectionGroup<T>> = [];
  let current: FormSectionGroup<T> = { key: '__start', section: null, items: [] };

  items.forEach(item => {
    if (isLayoutItem(item)) {
      groups.push(current);
      current = { key: item.key, section: item, items: [] };

      return;
    }

    current.items.push(item);
  });
  groups.push(current);

  return groups.filter(group => group.items.length > 0);
}

export function emptyAnswer(item: Pick<FormItem, 'kind'>): FormAnswer {
  if (item.kind === 'checkbox') return false;

  if (item.kind === 'multi_choice') return [];

  if (item.kind === 'link') return { url: '', note: '' };

  return '';
}

export function isAnswerEmpty(item: Pick<FormItem, 'kind'>, value: unknown): boolean {
  if (value === null || value === undefined) return true;

  if (item.kind === 'checkbox') return value !== true;

  if (Array.isArray(value)) return value.length === 0;

  if (typeof value === 'object') return !(value as { url?: string }).url?.trim();

  return typeof value === 'string' && !value.trim();
}

/** The form path that holds an item's error (a link's error sits on its URL). */
export function answerErrorPath(prefix: string, item: Pick<FormItem, 'key' | 'kind'>): string {
  return item.kind === 'link' ? `${prefix}.${item.key}.url` : `${prefix}.${item.key}`;
}

/** A stable answer key from a label: lowercase ASCII words joined by "_". */
export function formItemKeyFrom(label: string, taken: Array<string>, fallback = 'field'): string {
  const base =
    label
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50) || fallback;
  const start = /^[a-z]/.test(base) ? base : `f_${base}`;
  let key = start;
  let suffix = 2;

  while (taken.includes(key)) {
    key = `${start}_${suffix}`;
    suffix += 1;
  }

  return key;
}
