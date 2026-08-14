import { Section, SectionHeading } from 'dansship-ui';

export function Default() {
  return (
    <Section verticalPadding>
      <SectionHeading title='Upcoming classes' subtitle='This week at your studio' />
      <div style={{ background: '#eee', padding: 16, borderRadius: 8, marginTop: 16 }}>
        Section content goes here.
      </div>
    </Section>
  );
}
