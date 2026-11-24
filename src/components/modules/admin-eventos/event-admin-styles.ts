import { EVENT_FIELDS } from '@components/modules/event-participation/signup-styles';

/**
 * Look of the event admin screens (prototype `ClausuraAdmin`): white bordered cards and fields,
 * pill tabs. Scoped to these screens so the app's filled inputs and cream cards stay as they are.
 */

/** White card with the border token (`.cl-card`); the base `Card` uses the gold `card-foreground`. */
export const ADMIN_CARD = 'rounded-[14px] border-border bg-white text-foreground shadow-none';

/** White inputs, textareas and select triggers (`.cl-field`), shared with the person's signup page. */
export const ADMIN_FIELDS = EVENT_FIELDS;

/**
 * White tab strip with a border; the active tab is primary-100 with primary text (`.cl-tabs`). It scrolls only
 * sideways (many tabs on a phone); the trigger's underline (`after:`, for the `line` variant) sits 5px below the
 * strip, so it is hidden or the strip would also scroll vertically.
 */
export const ADMIN_TABS_LIST =
  'h-auto w-full justify-start gap-1 overflow-x-auto overflow-y-hidden rounded-xl border border-border bg-white p-1';
export const ADMIN_TAB =
  'h-auto min-h-10 flex-none rounded-lg px-4 after:hidden text-muted-foreground data-[state=active]:bg-primary-100 data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none';
