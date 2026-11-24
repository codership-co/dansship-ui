import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FormBuilder } from './form-builder';
import { type FormItem } from './form-items';

import '@core/i18n';

const question: FormItem = { key: 'act_name', label: 'Nombre', kind: 'short_text', required: false, options: {} };

function Harness({ onChange }: { onChange: (items: Array<FormItem>) => void }) {
  const [items, setItems] = useState<Array<FormItem>>([question]);

  return (
    <FormBuilder
      items={items}
      onChange={next => {
        setItems(next);
        onChange(next);
      }}
    />
  );
}

describe('FormBuilder', () => {
  afterEach(cleanup);

  it('adds a section with a description and moves it above a question', () => {
    const onChange = vi.fn();

    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar sección' }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).queryByLabelText('Tipo de pregunta')).toBeNull();
    fireEvent.change(within(dialog).getByLabelText('Título de la sección'), { target: { value: 'Tu presentación' } });
    fireEvent.change(within(dialog).getByLabelText('Descripción (opcional)'), { target: { value: 'Cuéntanos.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar' }));

    expect(onChange).toHaveBeenLastCalledWith([
      question,
      expect.objectContaining({
        key: 'section_tu_presentacion',
        kind: 'section',
        label: 'Tu presentación',
        help_text: 'Cuéntanos.',
        required: false,
      }),
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Subir Tu presentación' }));
    expect(onChange.mock.lastCall?.[0].map((entry: FormItem) => entry.key)).toEqual([
      'section_tu_presentacion',
      'act_name',
    ]);
  });

  it('adds a question with help text and marks it required', () => {
    const onChange = vi.fn();

    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar pregunta' }));
    const dialog = screen.getByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText('Pregunta'), { target: { value: 'Duración' } });
    fireEvent.change(within(dialog).getByLabelText('Texto de ayuda (opcional)'), { target: { value: 'En minutos.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Obligatorio: Duración' }));

    expect(onChange).toHaveBeenLastCalledWith([
      question,
      expect.objectContaining({ key: 'duracion', kind: 'short_text', help_text: 'En minutos.', required: true }),
    ]);
  });
});
