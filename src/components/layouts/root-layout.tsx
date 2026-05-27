import { NavLink, Outlet, useFetchers, useNavigation } from 'react-router';

export const RootLayout = () => {
  const navigation = useNavigation();
  const fetchers = useFetchers();

  // 1. Check if traditional page navigation is loading
  const isNavigating = navigation.state === 'loading';

  // 2. Check if fetchers are running background tasks
  const isFetching = fetchers.some(f => f.state === 'loading');

  const isLoading = isNavigating || isFetching;

  return (
    <section>
      <nav className='flex gap-2'>
        <NavLink to='/'>Home</NavLink>
        <NavLink to='/user/ditto'>Ditto</NavLink>
        <NavLink to='/user/pikachu'>Pikachu</NavLink>
        <NavLink to='/user/metapod'>Metapod</NavLink>
      </nav>

      {/* This will show instantly on page refresh, no more blank screen! */}
      {isLoading ? <div>App is fetching data...</div> : <Outlet />}
    </section>
  );
};
