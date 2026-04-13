import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from './drawer';

describe('Drawer', () => {
  it('renders with title and children when open', () => {
    render(
      <Drawer open onClose={vi.fn()} title="My Drawer">
        <p>Body content</p>
      </Drawer>,
    );
    expect(
      screen.getByRole('dialog', { name: 'My Drawer' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Drawer open onClose={onClose} title="X">
        <div />
      </Drawer>,
    );
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Drawer open onClose={onClose} title="X">
        <div />
      </Drawer>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores non-Escape key presses', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Drawer open onClose={onClose} title="X">
        <div />
      </Drawer>,
    );
    await user.keyboard('a');
    await user.keyboard('{Enter}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not respond to Escape when closed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Drawer open={false} onClose={onClose} title="X">
        <div />
      </Drawer>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Drawer open onClose={onClose} title="X">
        <div />
      </Drawer>,
    );
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll only while open', () => {
    const { rerender } = render(
      <Drawer open={false} onClose={vi.fn()} title="X">
        <div />
      </Drawer>,
    );
    expect(document.body.style.overflow).not.toBe('hidden');

    rerender(
      <Drawer open onClose={vi.fn()} title="X">
        <div />
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Drawer open={false} onClose={vi.fn()} title="X">
        <div />
      </Drawer>,
    );
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
