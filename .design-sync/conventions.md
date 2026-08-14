## Dansship UI — build with these conventions

This is a Tailwind v4 component set (shadcn/Radix-based primitives + a few
composed form-fields). No provider or theme wrapper is required — components
render correctly on their own, with no `ThemeProvider`, i18n provider, or
router context needed for the synced set.

### Styling idiom: Tailwind utility classes + CSS custom-property tokens

Style with Tailwind utility classes, not inline styles, for anything the
classes below cover. Every color is a CSS custom property under the hood
(`--color-*`), so any of these compose:

**Color family** (each has a 50–900 shade scale plus `-foreground`, e.g.
`bg-primary-400`, `text-primary-foreground`):
`primary`, `secondary`, `tertiary`, `accent`, `active`, `alert`, `warning`,
`info`, `highlight`, `destructive`. Common surface/utility colors:
`background`, `background-paper`, `foreground`, `border`, `muted` /
`muted-foreground`, `card` / `card-foreground`, `popover` /
`popover-foreground`.

Examples actually shipped in this bundle: `bg-primary`, `bg-secondary`,
`bg-tertiary`, `bg-accent`, `text-primary-foreground`,
`text-secondary-foreground`, `text-destructive`, `text-muted-foreground`,
`border-accent`.

**Typography scale** (`text-{name}`): `text-small`, `text-label`,
`text-body`. Larger display sizes (`header1`–`header4`, `hero`) exist as
`--text-*` tokens (with matched `--text-*--line-height`,
`--*--font-weight`, `--*--letter-spacing`) but have no pre-generated
utility class in this bundle — use them via
`style={{ fontSize: 'var(--text-header2)' }}` rather than a
`text-header2` class name, which won't resolve.

**Font families**: `font-main` (body — Montserrat Alternates), `font-title`
(headings — Josefin Sans), `font-brand` (the `guntertest` brand mark),
`font-code`. Montserrat Alternates and Josefin Sans load at runtime from
Google Fonts (not bundled as local files) — they render correctly as long
as the environment loads them the same way; `guntertest` ships as a real
font file in this bundle.

**Radius & spacing**: `rounded-md`, `rounded-lg`, `rounded-2xl` are the
common corner radii used across components (`--radius` is the base token).
Spacing follows standard Tailwind scale (`--spacing` base unit).

**Dark mode**: supported via a `.dark` class ancestor
(`@custom-variant dark (&:where(.dark, .dark *))`) — Tailwind's standard
`dark:` variant works as usual.

### One idiomatic composition

```tsx
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from 'dansship-ui';

<Card style={{ width: 320 }}>
  <CardHeader>
    <CardTitle>Monthly Unlimited</CardTitle>
    <CardDescription>Unlimited classes, billed monthly.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>$89.00 / month</p>
  </CardContent>
  <CardFooter>
    <Button style={{ width: '100%' }}>Select plan</Button>
  </CardFooter>
</Card>
```

Button variants: `default`, `secondary`, `tertiary`, `outline`,
`outlinePrimary`, `outlineTertiary`, `ghost`, `ghostPrimary`, `link`,
`destructive`. Sizes: `xs`, `sm`, `default`, `lg`, `icon`, `icon-xs`,
`icon-sm`, `icon-lg`.

### Form fields

`form-fields/*` components (`TextField`, `EmailField`, `PasswordField`,
`PhoneField`, `SelectField`, `DateField`, `CheckboxField`) are built for
`react-hook-form` — each takes a `control` prop from `useForm()`, plus
`name`, `label`, and field-specific props. They are NOT plain
`value`/`onChange` inputs. `CheckboxField` is the exception — it takes
`checked`/`onChange` directly (no `control`), matching a native checkbox
API. The raw `ui/` primitives (`Input`, `Textarea`, `Select`, `Checkbox`,
`Switch`) take standard HTML/Radix props and compose freely with `Label`.

### Where the truth lives

Read `_ds_bundle.css` (and its `styles.css` entry point) for the full
compiled stylesheet — every class and token referenced above is defined
there. Read each component's own `.prompt.md` for its specific props and
usage examples.
