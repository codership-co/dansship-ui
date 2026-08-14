import { Badge } from 'dansship-ui';

export function Variants() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Badge variant='default'>Active</Badge>
      <Badge variant='secondary'>Pending</Badge>
      <Badge variant='destructive'>Overdue</Badge>
      <Badge variant='outline'>Draft</Badge>
      <Badge variant='outlineActive'>Confirmed</Badge>
      <Badge variant='outlineNeutral'>Archived</Badge>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Badge size='small'>Small</Badge>
      <Badge size='regular'>Regular</Badge>
      <Badge size='large'>Large</Badge>
    </div>
  );
}
