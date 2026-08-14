import { CheckboxField } from 'dansship-ui';
import { useState } from 'react';

export function Default() {
  const [checked, setChecked] = useState(false);
  return (
    <CheckboxField
      id='terms'
      name='terms'
      label='I agree to the terms and conditions'
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
    />
  );
}

export function CheckedWithError() {
  const [checked, setChecked] = useState(true);
  return (
    <CheckboxField
      id='consent'
      name='consent'
      label='I consent to receive marketing emails'
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
      error='You must accept this to continue'
    />
  );
}

export function Disabled() {
  return (
    <CheckboxField
      id='disabled-field'
      name='disabled-field'
      label='This option is unavailable'
      checked={false}
      onChange={() => {}}
      disabled
    />
  );
}
