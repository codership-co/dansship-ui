interface SectionEmptyProps {
  message: string;
  title?: string;
  label?: string;
}

export function SectionEmpty({ message, label, title }: SectionEmptyProps) {
  return (
    <section className='grid gap-4'>
      {title && <h4>{title}</h4>}
      <section className='px-8 py-16 rounded-3xl bg-white/50 grid place-content-center text-center'>
        <p className='m-0'>{message}</p>
        {label && <label className='text-gray-500'>{label}</label>}
      </section>
    </section>
  );
}
