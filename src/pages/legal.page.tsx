import { Tabs } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { Section, SectionHeading } from '@components/containers';
import { PDFViewer } from '@components/ui/pdf-viewer';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { LEGAL_DOCUMENTS, LEGAL_TAB_QUERY, LEGAL_TAB_QUERY_PARAM } from '@core/constants';

enum LegalTabs {
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
  CLASS_TERMS_AND_CONDITION = 'CLASS_TERMS_AND_CONDITION',
  CLASS_RECOVERY_TERMS = 'CLASS_RECOVERY_TERMS',
}

function LegalPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialTab =
    searchParams.get(LEGAL_TAB_QUERY_PARAM) === LEGAL_TAB_QUERY.classRecoveryTerms
      ? LegalTabs.CLASS_RECOVERY_TERMS
      : LegalTabs.PRIVACY_POLICY;

  return (
    <Section navbarPadding className='min-h-dvh'>
      <SectionHeading intro={t('legal:intro')} title={t('legal:title')} subtitle={t('legal:subtitle')} />

      <section className='grid md:grid-cols-[auto_1fr] gap-8 md:items-start'>
        <Tabs defaultOpenTab={initialTab}>
          <Tabs.TabList
            color='primary'
            className='md:px-4 md:py-8 grid-flow-row sm:grid-flow-col md:grid-flow-row'
            tabs={[
              { id: LegalTabs.PRIVACY_POLICY, label: t('legal:documents.privacy.tab') },
              { id: LegalTabs.TERMS_AND_CONDITIONS, label: t('legal:documents.termsAndConditions.tab') },
              { id: LegalTabs.CLASS_TERMS_AND_CONDITION, label: t('legal:documents.classTermsAndConditions.tab') },
              { id: LegalTabs.CLASS_RECOVERY_TERMS, label: t('legal:documents.classRecoveryTerms.tab') },
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

              <PDFViewer url='/assets/legal/terminos-y-condiciones-servicio.pdf' />
            </Tabs.TabPanel>
            <Tabs.TabPanel id={LegalTabs.CLASS_RECOVERY_TERMS}>
              <section>
                <h3 className='text-primary'>{t('legal:documents.classRecoveryTerms.tab')}</h3>
                <p>{t('legal:documents.classRecoveryTerms.description')}</p>
              </section>

              <PDFViewer url={LEGAL_DOCUMENTS.classRecoveryTerms} />
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
