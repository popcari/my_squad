import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './select';

/** Helper: the visible trigger is the first element matching the label text;
 * the hidden native <select> has the same options as duplicates. */
const trigger = (label: string) => screen.getAllByText(label)[0];

describe('Select', () => {
  it('renders the selected option label', () => {
    render(
      <Select value="a" onChange={vi.fn()} aria-label="Letters">
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </Select>,
    );
    expect(trigger('Alpha')).toBeInTheDocument();
  });

  it('opens dropdown on click and shows options', async () => {
    const user = userEvent.setup();
    render(
      <Select value="a" onChange={vi.fn()} aria-label="Letters">
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </Select>,
    );

    await user.click(trigger('Alpha'));
    // After opening, 'Beta' appears in the dropdown menu (in addition to
    // the hidden native <select> option, so ≥ 2 matches).
    expect(screen.getAllByText('Beta').length).toBeGreaterThanOrEqual(2);
  });

  it('calls onChange when option is selected from dropdown', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select value="a" onChange={onChange} aria-label="Letters">
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </Select>,
    );

    await user.click(trigger('Alpha'));
    // Find the dropdown item (li) for Beta — the native option is a separate node
    const items = screen.getAllByText('Beta');
    const li = items.find((el) => el.tagName === 'LI');
    expect(li).toBeDefined();
    await user.click(li!);

    expect(onChange).toHaveBeenCalled();
    const event = onChange.mock.calls[0][0] as { target: { value: string } };
    expect(event.target.value).toBe('b');
  });

  it('does not open dropdown when disabled', async () => {
    const user = userEvent.setup();
    render(
      <Select value="a" onChange={vi.fn()} disabled aria-label="Letters">
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </Select>,
    );

    await user.click(trigger('Alpha'));
    // Dropdown list (li elements) should not render; only native <option>s exist.
    const items = screen.queryAllByText('Beta');
    expect(items.every((el) => el.tagName !== 'LI')).toBe(true);
  });

  it('uncontrolled Select updates its own state on selection', async () => {
    const user = userEvent.setup();
    render(
      <Select defaultValue="a" aria-label="Letters">
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </Select>,
    );
    await user.click(trigger('Alpha'));
    const items = screen.getAllByText('Beta');
    const li = items.find((el) => el.tagName === 'LI');
    await user.click(li!);
    // After selecting Beta, the trigger should now show Beta.
    expect(trigger('Beta')).toBeInTheDocument();
  });

  describe('dropdown placement (auto-flip)', () => {
    const mockRect = (top: number) =>
      ({
        top,
        bottom: top + 38,
        left: 10,
        right: 200,
        width: 190,
        height: 38,
        x: 10,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;

    it('opens dropdown below the trigger when it sits in the top 70% of the viewport', async () => {
      const user = userEvent.setup();
      render(
        <Select value="a" onChange={vi.fn()} aria-label="Letters">
          <option value="a">Alpha</option>
          <option value="b">Beta</option>
        </Select>,
      );

      const triggerEl = screen.getAllByText('Alpha')[0];
      const wrapper = triggerEl.closest('div.relative') as HTMLElement;
      vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect(100));

      await user.click(triggerEl);
      const ul = document.querySelector('.select-dropdown-menu');
      expect(ul).toHaveAttribute('data-placement', 'bottom');
    });

    it('flips dropdown above the trigger when it sits in the bottom 30% of the viewport', async () => {
      const user = userEvent.setup();
      render(
        <Select value="a" onChange={vi.fn()} aria-label="Letters">
          <option value="a">Alpha</option>
          <option value="b">Beta</option>
        </Select>,
      );

      // jsdom viewport is 768 tall by default → bottom 30% starts around y≈538
      const triggerEl = screen.getAllByText('Alpha')[0];
      const wrapper = triggerEl.closest('div.relative') as HTMLElement;
      vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(mockRect(700));

      await user.click(triggerEl);
      const ul = document.querySelector('.select-dropdown-menu');
      expect(ul).toHaveAttribute('data-placement', 'top');
    });
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Select value="a" onChange={vi.fn()} aria-label="Letters">
          <option value="a">Alpha</option>
          <option value="b">Beta</option>
        </Select>
        <button>Outside</button>
      </div>,
    );
    await user.click(trigger('Alpha'));
    expect(screen.getAllByText('Beta').length).toBeGreaterThanOrEqual(2);

    // Click outside to close
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    // Only the hidden <option>Beta</option> remains; no <li>Beta</li>
    const items = screen.queryAllByText('Beta');
    expect(items.every((el) => el.tagName !== 'LI')).toBe(true);
  });
});
