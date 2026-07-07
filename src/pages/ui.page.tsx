import { Button, ColorTypes, Line, VariantTypes } from 'polpo/components';

const colors = Object.values(ColorTypes);
const variants = Object.values(VariantTypes);

export function UiPage() {
  return (
    <section className='max-w-7xl px-4 grid gap-6 mx-auto'>
      <section>
        <h4>Tipografía</h4>

        <h1 className='hero'>hero. Welcome to Dansship</h1>
        <h1>h1. Welcome to Dansship</h1>
        <h2>h2. Welcome to Dansship</h2>
        <h3>h3. Welcome to Dansship</h3>
        <h4>h4. Welcome to Dansship</h4>
        <p>
          <b>This is a paragraph.</b> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquam aliquid commodi
          deleniti dicta eius enim explicabo fuga fugit ipsa iusto libero magni maiores molestias nihil nobis nulla
          recusandae reiciendis repellat rerum sequi totam unde, velit voluptatibus. Accusamus delectus enim esse eum
          excepturi maiores natus nostrum pariatur quasi quo unde, veritatis.
        </p>
        <p>
          <b>This is a paragraph.</b> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquam aliquid commodi
          deleniti dicta eius enim explicabo fuga fugit ipsa iusto libero magni maiores molestias nihil nobis nulla
          recusandae reiciendis repellat rerum sequi totam unde, velit voluptatibus. Accusamus delectus enim esse eum
          excepturi maiores natus nostrum pariatur quasi quo unde, veritatis.
        </p>
        <p>
          <b>This is a paragraph.</b> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquam aliquid commodi
          deleniti dicta eius enim explicabo fuga fugit ipsa iusto libero magni maiores molestias nihil nobis nulla
          recusandae reiciendis repellat rerum sequi totam unde, velit voluptatibus. Accusamus delectus enim esse eum
          excepturi maiores natus nostrum pariatur quasi quo unde, veritatis.
        </p>
        <label className='block'>
          <b>This is a label text.</b> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus aliquam
          deleniti dignissimos eaque error inventore iste minima, nobis nostrum quasi quos recusandae unde! Commodi
          nesciunt nihil nobis. Autem deserunt, tempora.
        </label>
        <label className='block'>
          <b>This is a label text.</b> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus aliquam
          deleniti dignissimos eaque error inventore iste minima, nobis nostrum quasi quos recusandae unde! Commodi
          nesciunt nihil nobis. Autem deserunt, tempora.
        </label>
        <label className='block'>
          <b>This is a label text.</b> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus aliquam
          deleniti dignissimos eaque error inventore iste minima, nobis nostrum quasi quos recusandae unde! Commodi
          nesciunt nihil nobis. Autem deserunt, tempora.
        </label>
        <small className='block'>
          <b>This is a small text.</b> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Commodi excepturi
          exercitationem fuga incidunt molestias quam sed totam voluptas voluptatem. Amet atque eius maxime nesciunt
          officiis omnis quidem recusandae tenetur vitae.
        </small>
        <small className='block'>
          <b>This is a small text.</b> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Commodi excepturi
          exercitationem fuga incidunt molestias quam sed totam voluptas voluptatem. Amet atque eius maxime nesciunt
          officiis omnis quidem recusandae tenetur vitae.
        </small>
        <small className='block'>
          <b>This is a small text.</b> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Commodi excepturi
          exercitationem fuga incidunt molestias quam sed totam voluptas voluptatem. Amet atque eius maxime nesciunt
          officiis omnis quidem recusandae tenetur vitae.
        </small>
      </section>

      <Line color='var(--color-primary)' className='mt-8' />

      <section>
        <h4>Paleta de colores</h4>

        <section className='hidden md:grid grid-cols-[repeat(10,4em)] justify-start'>
          <section className='w-full aspect-square pl-2 bg-primary-50'>
            <small>50</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-primary-100'>
            <small>100</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-primary-200'>
            <small>200</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-primary-300'>
            <small>300</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-primary-400'>
            <small>400</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-primary-500 scale-110'>
            <small>500</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-primary-600'>
            <small>600</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-primary-700'>
            <small>700</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-primary-800'>
            <small>800</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-primary-900'>
            <small>900</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-secondary-50'>
            <small>50</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-secondary-100'>
            <small>100</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-secondary-200'>
            <small>200</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-secondary-300'>
            <small>300</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-secondary-400'>
            <small>400</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-secondary-500 scale-110'>
            <small>500</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-secondary-600'>
            <small>600</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-secondary-700'>
            <small>700</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-secondary-800'>
            <small>800</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-secondary-900'>
            <small>900</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-tertiary-50'>
            <small>50</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-tertiary-100'>
            <small>100</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-tertiary-200'>
            <small>200</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-tertiary-300'>
            <small>300</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-tertiary-400'>
            <small>400</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-tertiary-500 scale-110'>
            <small>500</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-tertiary-600'>
            <small>600</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-tertiary-700'>
            <small>700</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-tertiary-800'>
            <small>800</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-tertiary-900'>
            <small>900</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-highlight-50'>
            <small>50</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-highlight-100'>
            <small>100</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-highlight-200'>
            <small>200</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-highlight-300'>
            <small>300</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-highlight-400'>
            <small>400</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-highlight-500 scale-110'>
            <small>500</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-highlight-600'>
            <small>600</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-highlight-700'>
            <small>700</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-highlight-800'>
            <small>800</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-highlight-900'>
            <small>900</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-accent-50'>
            <small>50</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-accent-100'>
            <small>100</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-accent-200'>
            <small>200</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-accent-300'>
            <small>300</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-accent-400'>
            <small>400</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-accent-500 scale-110'>
            <small>500</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-accent-600'>
            <small>600</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-accent-700'>
            <small>700</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-accent-800'>
            <small>800</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-accent-900'>
            <small>900</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-active-50'>
            <small>50</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-active-100'>
            <small>100</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-active-200'>
            <small>200</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-active-300'>
            <small>300</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-active-400'>
            <small>400</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-active-500 scale-110'>
            <small>500</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-active-600'>
            <small>600</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-active-700'>
            <small>700</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-active-800'>
            <small>800</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-active-900'>
            <small>900</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-warning-50'>
            <small>50</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-warning-100'>
            <small>100</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-warning-200'>
            <small>200</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-warning-300'>
            <small>300</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-warning-400'>
            <small>400</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-warning-500 scale-110'>
            <small>500</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-warning-600'>
            <small>600</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-warning-700'>
            <small>700</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-warning-800'>
            <small>800</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-warning-900'>
            <small>900</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-alert-50'>
            <small>50</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-alert-100'>
            <small>100</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-alert-200'>
            <small>200</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-alert-300'>
            <small>300</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-alert-400'>
            <small>400</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-alert-500 scale-110'>
            <small>500</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-alert-600'>
            <small>600</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-alert-700'>
            <small>700</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-alert-800'>
            <small>800</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-alert-900'>
            <small>900</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-info-50'>
            <small>50</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-info-100'>
            <small>100</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-info-200'>
            <small>200</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-info-300'>
            <small>300</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-info-400'>
            <small>400</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-info-500 scale-110'>
            <small>500</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-info-600'>
            <small>600</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-info-700'>
            <small>700</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-info-800'>
            <small>800</small>
          </section>
          <section className='w-full aspect-square pl-2 bg-info-900'>
            <small>900</small>
          </section>
        </section>
      </section>

      <Line color='var(--color-primary)' className='mt-8' />

      <section>
        <h4>Botones</h4>
        <section className='p-6 grid grid-cols-[repeat(5,200px)] gap-4'>
          {colors.map(color => [
            <label key={color} className='text-right'>
              {color}
            </label>,
            ...variants.map(variant => (
              <Button key={`${variant}-${color}`} color={color} variant={variant}>
                {variant}
              </Button>
            )),
          ])}
          <span />
          {variants.map(variant => (
            <Button key={`${variant}-disabled`} disabled variant={variant}>
              disabled
            </Button>
          ))}
        </section>
      </section>
    </section>
  );
}
