import { useTranslation } from 'react-i18next';
import { type LoaderFunctionArgs, useLoaderData } from 'react-router';

import { delayPromise } from '@helpers';

const fetchData = async (name: string) => {
  const url = `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Pokémon not found (Status: ${response.status})`);
    }

    return await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UserLoader({ params }: LoaderFunctionArgs): any {
  return delayPromise(fetchData(params.id), 3000);
}

export function UserPage() {
  const data = useLoaderData<typeof UserLoader>();
  const { t, i18n } = useTranslation();

  return (
    <section>
      <h1>User</h1>
      <p>{t('home:title')}</p>
      <img src={data.sprites.front_default} alt='pokemon' />
      <button onClick={() => i18n.changeLanguage('en')}>En</button>
      <button onClick={() => i18n.changeLanguage('es')}>Es</button>
    </section>
  );
}
