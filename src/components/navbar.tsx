import { NavLink } from 'react-router';

export const Navbar = () => {
  return (
    <nav className='flex gap-2'>
      <NavLink to='/'>Home</NavLink>
      <NavLink to='/user/ditto'>Ditto</NavLink>
      <NavLink to='/user/pikachu'>Pikachu</NavLink>
      <NavLink to='/user/metapod'>Metapod</NavLink>
    </nav>
  );
};
