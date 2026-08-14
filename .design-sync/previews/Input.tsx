import { Input, Label } from 'dansship-ui';

export function Default() {
  return (
    <div style={{ display: 'grid', gap: 8, width: 280 }}>
      <Label htmlFor='name'>Full name</Label>
      <Input id='name' placeholder='Jane Doe' />
    </div>
  );
}

export function WithValue() {
  return (
    <div style={{ display: 'grid', gap: 8, width: 280 }}>
      <Label htmlFor='email'>Email</Label>
      <Input id='email' type='email' defaultValue='jane@example.com' />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: 'grid', gap: 8, width: 280 }}>
      <Label htmlFor='disabled-input'>Studio ID</Label>
      <Input id='disabled-input' defaultValue='STU-2048' disabled />
    </div>
  );
}
