import { Label, Switch } from 'dansship-ui';
import { useState } from 'react';

export function Default() {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Switch id='notifications' checked={checked} onCheckedChange={setChecked} />
      <Label htmlFor='notifications'>Email notifications</Label>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Switch size='sm' defaultChecked />
      <Switch size='default' defaultChecked />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <Switch disabled />
      <Switch disabled defaultChecked />
    </div>
  );
}
