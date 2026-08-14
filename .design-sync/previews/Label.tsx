import { Input, Label } from 'dansship-ui';

export function Default() {
  return <Label htmlFor='dance-style'>Dance style</Label>;
}

export function WithField() {
  return (
    <div style={{ display: 'grid', gap: 8, width: 280 }}>
      <Label htmlFor='instructor'>Instructor</Label>
      <Input id='instructor' placeholder='Search instructors' />
    </div>
  );
}
