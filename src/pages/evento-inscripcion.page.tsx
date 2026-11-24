import { useTranslation } from 'react-i18next';
import { Navigate, useParams, useSearchParams } from 'react-router';

import { Section } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { ParticipantSignupForm } from '@components/modules/event-participation';
import { PreviewBanner } from '@components/modules/eventos';
import { FEATURE_FLAG, SecurityGuard, useOrPermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { usePromise } from '@hooks';

function EventoInscripcionPage() {
  const { t } = useTranslation();
  const { slug = '', typeId = '' } = useParams();
  const [params] = useSearchParams();
  const canPreview = useOrPermissions(AdminPermissions.eventos);
  // The admin's "Previsualizar": a draft too; nothing is saved or paid.
  const preview = params.get('preview') === '1' && canPreview;
  const { response, isLoading } = usePromise(
    () => DansshipAPI.participation.getForm(typeId, preview),
    Boolean(typeId),
    [typeId, preview],
  );
  const { response: landingResponse } = usePromise(
    () => (preview ? DansshipAPI.eventosAdmin.preview(slug) : DansshipAPI.eventos.getBySlug(slug)),
    Boolean(slug),
    [slug, preview],
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

  if (form.my_signup_id && !preview) {
    return <Navigate to={PageURLS.profile.signup(form.my_signup_id)} replace />;
  }

  return (
    <Section navbarPadding className='pb-10'>
      <div className='mx-auto grid max-w-2xl gap-5'>
        {preview ? <PreviewBanner /> : null}
        <ParticipantSignupForm form={form} landing={landingResponse?.data ?? null} preview={preview} />
      </div>
    </Section>
  );
}

export const SecureEventoInscripcionPage = SecurityGuard(EventoInscripcionPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
