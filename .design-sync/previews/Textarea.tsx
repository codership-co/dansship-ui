import { Label, Textarea } from 'dansship-ui';

export function Default() {
  return (
    <div style={{ display: 'grid', gap: 8, width: 320 }}>
      <Label htmlFor='notes'>Instructor notes</Label>
      <Textarea id='notes' placeholder='Add notes about this class...' rows={4} />
    </div>
  );
}

export function WithValue() {
  return (
    <div style={{ display: 'grid', gap: 8, width: 320 }}>
      <Label htmlFor='bio'>Bio</Label>
      <Textarea
        id='bio'
        rows={4}
        defaultValue='Certified instructor with 8 years of experience in contemporary and hip-hop.'
      />
    </div>
  );
}
