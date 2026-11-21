import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { Section } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { MySignupSummary } from '@components/modules/event-participation';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

function InscripcionPage() {
  const { t } = useTranslation();
  const { signupId = '' } = useParams();
  const { response, isLoading } = usePromise(() => DansshipAPI.participation.getMine(signupId), Boolean(signupId), [
    signupId,
  ]);

  return (
    <Section navbarPadding className='pb-10'>
      <div className='mx-auto max-w-2xl'>
        {isLoading && !response ? (
          <SpinnerLoader />
        ) : response?.data ? (
          <MySignupSummary signup={response.data} />
        ) : (
          <p className='text-muted-foreground'>{t('eventos:participation.mine.notFound')}</p>
        )}
      </div>
    </Section>
  );
}

export const SecureInscripcionPage = SecurityGuard(InscripcionPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
