import { Checkbox, Label } from 'dansship-ui';
import { useState } from 'react';

export function States() {
  const [checked, setChecked] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox id='unchecked' />
        <Label htmlFor='unchecked'>Unchecked</Label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox id='checked' checked={checked} onCheckedChange={setChecked} />
        <Label htmlFor='checked'>Checked</Label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox id='disabled' disabled />
        <Label htmlFor='disabled'>Disabled</Label>
      </div>
    </div>
  );
}
