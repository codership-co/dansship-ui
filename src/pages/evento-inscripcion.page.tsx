import { useTranslation } from 'react-i18next';
import { Navigate, useParams, useSearchParams } from 'react-router';

import { Section } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { ArtistSignupForm } from '@components/modules/event-participation';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

function EventoInscripcionPage() {
  const { t } = useTranslation();
  const { typeId = '' } = useParams();
  const [params] = useSearchParams();
  const accessToken = params.get('acceso');
  const { response, isLoading } = usePromise(
    () => DansshipAPI.participation.getForm(typeId, accessToken),
    Boolean(typeId),
    [typeId, accessToken],
  );
  const form = response?.data;

  if (isLoading && !response) {
    return (
      <Section navbarPadding>
        <SpinnerLoader />
      </Section>
    );
  }

  if (!form) {
    return (
      <Section navbarPadding>
        <p className='text-muted-foreground'>{t('eventos:landing.notFound')}</p>
      </Section>
    );
  }

  if (form.my_signup_id) {
    return <Navigate to={PageURLS.profile.signup(form.my_signup_id)} replace />;
  }

  return (
    <Section navbarPadding className='pb-10'>
      <div className='mx-auto max-w-2xl'>
        <ArtistSignupForm form={form} accessToken={accessToken} />
      </div>
    </Section>
  );
}

export const SecureEventoInscripcionPage = SecurityGuard(EventoInscripcionPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
