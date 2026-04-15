import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StarRating } from './star-rating';

describe('StarRating', () => {
  it('renders 5 star slots', () => {
    render(<StarRating value={3} readOnly />);
    expect(screen.getAllByTestId(/^star-slot-/).length).toBe(5);
  });

  it('calls onChange with 3.5 when left half of 4th slot is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StarRating value={2} onChange={onChange} />);
    await user.click(screen.getByTestId('star-slot-4-left'));
    expect(onChange).toHaveBeenCalledWith(3.5);
  });

  it('calls onChange with 4 when right half of 4th slot is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StarRating value={2} onChange={onChange} />);
    await user.click(screen.getByTestId('star-slot-4-right'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not fire onChange in readOnly mode', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StarRating value={3} onChange={onChange} readOnly />);
    // In readOnly mode, half-click targets should not exist as buttons
    expect(screen.queryByTestId('star-slot-4-left')).not.toBeInTheDocument();
    // Even clicking on visible star shouldn't call onChange
    const slots = screen.getAllByTestId(/^star-slot-/);
    await user.click(slots[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies default (slate) tier class when rating < 3', () => {
    const { container } = render(<StarRating value={2.5} readOnly />);
    expect(container.firstChild as HTMLElement).toHaveClass(/slate/);
  });

  it('applies silver tier class when rating is 3.0 or 3.5', () => {
    const { container } = render(<StarRating value={3.5} readOnly />);
    const el = container.firstChild as HTMLElement;
    // silver tier uses slate-300
    expect(el.className).toMatch(/slate-300/);
  });

  it('applies gold tier class when rating is 4.0 or 4.5', () => {
    const { container } = render(<StarRating value={4.5} readOnly />);
    expect((container.firstChild as HTMLElement).className).toMatch(/yellow/);
  });

  it('applies diamond (cyan) tier class only when rating is exactly 5', () => {
    const { container } = render(<StarRating value={5} readOnly />);
    expect((container.firstChild as HTMLElement).className).toMatch(/cyan/);
  });
});
