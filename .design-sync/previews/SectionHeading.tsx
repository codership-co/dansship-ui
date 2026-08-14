import { SectionHeading } from 'dansship-ui';

export function Default() {
  return <SectionHeading title='Upcoming classes' subtitle='This week at your studio' />;
}

export function Centered() {
  return (
    <SectionHeading
      intro='Membership'
      title='Choose your plan'
      subtitle='Flexible options for every dancer.'
      centered
    />
  );
}
