/**
 * Look of the dynamic forms (prototype `.cl-card` / `.cl-field`). Tailwind v4's bare `border` falls back to
 * `currentColor`, so the border token is always set.
 */

/** White card with the border token. */
export const FORM_CARD = 'rounded-[14px] border border-border bg-white text-foreground';

/**
 * Put on a screen's root: inputs, textareas and select triggers inside it become white with the border token,
 * 10px radius and 44px height. Dialogs render in portals and keep their style.
 */
export const FORM_FIELDS = [
  '[&_:is([data-slot=input],[data-slot=textarea],[data-slot=select-trigger])]:rounded-[10px]',
  '[&_:is([data-slot=input],[data-slot=textarea],[data-slot=select-trigger])]:border',
  '[&_:is([data-slot=input],[data-slot=textarea],[data-slot=select-trigger])]:border-border',
  '[&_:is([data-slot=input],[data-slot=textarea],[data-slot=select-trigger])]:bg-white',
  '[&_:is([data-slot=input],[data-slot=textarea],[data-slot=select-trigger])]:px-3.5',
  '[&_:is([data-slot=input],[data-slot=textarea],[data-slot=select-trigger])]:py-2.5',
  '[&_:is([data-slot=input],[data-slot=select-trigger])]:min-h-11',
  '[&_:is([data-slot=input],[data-slot=textarea],[data-slot=select-trigger])]:text-sm',
  '[&_[data-slot=textarea]]:min-h-24',
].join(' ');

/** A selectable row (radio card, checkbox row): primary border and tint when on. */
export function choiceRowClass(on: boolean) {
  return on ? 'border-primary bg-primary/5' : 'border-border bg-white';
}
