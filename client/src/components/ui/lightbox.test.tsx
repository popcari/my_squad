import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @next/next/no-img-element
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

import { Lightbox } from './lightbox';

describe('Lightbox', () => {
  it('renders trigger with children', () => {
    render(
      <Lightbox src="/img.png" alt="Player photo">
        <span>Trigger</span>
      </Lightbox>,
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /preview player photo/i }),
    ).toBeInTheDocument();
  });

  it('opens preview dialog on click and renders image', async () => {
    const user = userEvent.setup();
    render(
      <Lightbox src="/img.png" alt="Player photo">
        <span>Trigger</span>
      </Lightbox>,
    );

    await user.click(
      screen.getByRole('button', { name: /preview player photo/i }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByAltText('Player photo')).toBeInTheDocument();
  });

  it('closes preview when close button clicked', async () => {
    const user = userEvent.setup();
    render(
      <Lightbox src="/img.png" alt="Player photo">
        <span>Trigger</span>
      </Lightbox>,
    );

    await user.click(
      screen.getByRole('button', { name: /preview player photo/i }),
    );
    await user.click(screen.getByRole('button', { name: /close preview/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on backdrop click', async () => {
    const user = userEvent.setup();
    render(
      <Lightbox src="/img.png" alt="Player photo">
        <span>Trigger</span>
      </Lightbox>,
    );

    await user.click(
      screen.getByRole('button', { name: /preview player photo/i }),
    );

    const dialog = screen.getByRole('dialog');
    await user.click(dialog);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
