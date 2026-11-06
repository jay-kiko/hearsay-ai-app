import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CountryInput } from './Wizard';

describe('CountryInput', () => {
  it('passes up the canonical country for shorthand', () => {
    const onChange = vi.fn();
    render(<CountryInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'uk' } });
    expect(onChange).toHaveBeenLastCalledWith('United Kingdom');
  });

  it('treats a typo as no market and flags it, never sending it', () => {
    const onChange = vi.fn();
    render(<CountryInput value="Kenya" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'Kenyaa' } });
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.getByText('Pick a country from the list.')).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears to global when emptied', () => {
    const onChange = vi.fn();
    render(<CountryInput value="Peru" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.queryByText('Pick a country from the list.')).not.toBeInTheDocument();
  });
});
