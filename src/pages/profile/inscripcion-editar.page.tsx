import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { Section } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { ParticipantSignupForm } from '@components/modules/event-participation';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

function InscripcionEditarPage() {
  const { t } = useTranslation();
  const { signupId = '' } = useParams();
  const { response: signupResponse, isLoading } = usePromise(
    () => DansshipAPI.participation.getMine(signupId),
    Boolean(signupId),
    [signupId],
  );
  const signup = signupResponse?.data;
  const { response: formResponse } = usePromise(
    () => DansshipAPI.participation.getForm(signup?.participant_type_id ?? ''),
    Boolean(signup?.participant_type_id),
    [signup?.participant_type_id],
  );
  const form = formResponse?.data;

  if ((isLoading && !signupResponse) || (signup && !formResponse)) {
    return (
      <Section navbarPadding>
        <SpinnerLoader />
      </Section>
    );
  }

  return (
    <Section navbarPadding className='pb-10'>
      <div className='mx-auto max-w-2xl'>
        {signup && form ? (
          signup.editable ? (
            <ParticipantSignupForm form={form} signup={signup} />
          ) : (
            <p className='text-muted-foreground'>{t('eventos:participation.mine.notEditable')}</p>
          )
        ) : (
          <p className='text-muted-foreground'>{t('eventos:participation.mine.notFound')}</p>
        )}
      </div>
    </Section>
  );
}

export const SecureInscripcionEditarPage = SecurityGuard(InscripcionEditarPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
