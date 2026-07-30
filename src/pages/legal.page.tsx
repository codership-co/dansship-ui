import { Tabs } from 'polpo/components';
import { useTranslation } from 'react-i18next';

import { Section, SectionHeading } from '@components/containers';
import { PDFViewer } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';

enum LegalTabs {
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
  CLASS_TERMS_AND_CONDITION = 'CLASS_TERMS_AND_CONDITION',
}

function LegalPage() {
  const { t } = useTranslation();

  return (
    <Section navbarPadding className='min-h-dvh'>
      <SectionHeading intro={t('legal:intro')} title={t('legal:title')} subtitle={t('legal:subtitle')} />

      <section className='grid md:grid-cols-[auto_1fr] gap-8 md:items-start'>
        <Tabs defaultOpenTab={LegalTabs.PRIVACY_POLICY}>
          <Tabs.TabList
            color='primary'
            className='md:px-4 md:py-8 grid-flow-row sm:grid-flow-col md:grid-flow-row'
            tabs={[
              { id: LegalTabs.PRIVACY_POLICY, label: t('legal:documents.privacy.tab') },
              { id: LegalTabs.TERMS_AND_CONDITIONS, label: t('legal:documents.termsAndConditions.tab') },
              { id: LegalTabs.CLASS_TERMS_AND_CONDITION, label: t('legal:documents.classTermsAndConditions.tab') },
            ]}
          />

          <section className='grid gap-8'>
            <Tabs.TabPanel id={LegalTabs.PRIVACY_POLICY}>
              <section>
                <h3 className='text-primary'>{t('legal:documents.privacy.tab')}</h3>
                <p>{t('legal:documents.privacy.description')}</p>
              </section>

              <PDFViewer url='/assets/legal/politica-privacidad.pdf' />
            </Tabs.TabPanel>
            <Tabs.TabPanel id={LegalTabs.TERMS_AND_CONDITIONS}>
              <section>
                <h3 className='text-primary'>{t('legal:documents.termsAndConditions.tab')}</h3>
                <p>{t('legal:documents.termsAndConditions.description')}</p>
              </section>

              <PDFViewer url='/assets/legal/terminos-y-condiciones.pdf' />
            </Tabs.TabPanel>
            <Tabs.TabPanel id={LegalTabs.CLASS_TERMS_AND_CONDITION}>
              <section>
                <h3 className='text-primary'>{t('legal:documents.classTermsAndConditions.tab')}</h3>
                <p>{t('legal:documents.classTermsAndConditions.description')}</p>
              </section>

              <PDFViewer url='/assets/legal/terminos-y-condiciones-para-compras.pdf' />
            </Tabs.TabPanel>
          </section>
        </Tabs>
      </section>
    </Section>
  );
}

export const SecureLegalPage = SecurityGuard(LegalPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isFiguresPageEnabled],
});
