import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ConfirmProvider, useConfirm } from './confirm-context';

function TestComponent() {
  const confirm = useConfirm();

  const handleClick = async () => {
    const result = await confirm({
      title: 'Test Title',
      message: 'Test message',
      confirmText: 'Yes',
      cancelText: 'No',
      danger: true,
    });
    document.title = result ? 'confirmed' : 'cancelled';
  };

  return <button onClick={handleClick}>Trigger</button>;
}

const renderWithProvider = () =>
  render(
    <ConfirmProvider>
      <TestComponent />
    </ConfirmProvider>,
  );

describe('ConfirmContext', () => {
  it('should show confirm dialog when triggered', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Trigger'));

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should resolve true when confirm clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Trigger'));
    await user.click(screen.getByText('Yes'));

    expect(document.title).toBe('confirmed');
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('should resolve false when cancel clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Trigger'));
    await user.click(screen.getByText('No'));

    expect(document.title).toBe('cancelled');
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('should render danger style button when danger is true', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Trigger'));

    const confirmBtn = screen.getByText('Yes');
    expect(confirmBtn.className).toContain('bg-danger');
  });

  it('uses default labels when options omit them', async () => {
    function MinimalComponent() {
      const confirm = useConfirm();
      return (
        <button onClick={() => confirm({ message: 'hi' })}>Trigger</button>
      );
    }

    const user = userEvent.setup();
    render(
      <ConfirmProvider>
        <MinimalComponent />
      </ConfirmProvider>,
    );

    await user.click(screen.getByText('Trigger'));
    // Default title "Confirm" appears as heading; default button labels.
    expect(
      screen.getByRole('heading', { name: 'Confirm' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmBtn.className).toContain('bg-primary');
  });

  it('closes via backdrop click (cancels)', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Trigger'));
    // The backdrop overlay is a div with bg-black/60
    const backdrop = document.querySelector('.bg-black\\/60');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop as Element);
    expect(document.title).toBe('cancelled');
  });
});
