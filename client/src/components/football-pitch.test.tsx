import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FootballPitch } from './football-pitch';

const sampleSlots = [
  { role: 'GK', x: 50, y: 10 },
  { role: 'LB', x: 20, y: 35 },
  { role: 'CB', x: 50, y: 30 },
  { role: 'RB', x: 80, y: 35 },
  { role: 'LM', x: 25, y: 65 },
  { role: 'RM', x: 75, y: 65 },
  { role: 'ST', x: 50, y: 88 },
];

describe('FootballPitch', () => {
  it('renders all 7 slots with default role labels', () => {
    render(<FootballPitch slots={sampleSlots} />);
    expect(screen.getByText('GK')).toBeInTheDocument();
    expect(screen.getByText('LB')).toBeInTheDocument();
    expect(screen.getByText('CB')).toBeInTheDocument();
    expect(screen.getByText('RB')).toBeInTheDocument();
    expect(screen.getByText('LM')).toBeInTheDocument();
    expect(screen.getByText('RM')).toBeInTheDocument();
    expect(screen.getByText('ST')).toBeInTheDocument();
  });

  it('uses custom renderSlot when provided', () => {
    render(
      <FootballPitch
        slots={sampleSlots}
        renderSlot={(slot, i) => (
          <div>
            slot-{i}-{slot.role}
          </div>
        )}
      />,
    );
    expect(screen.getByText('slot-0-GK')).toBeInTheDocument();
    expect(screen.getByText('slot-6-ST')).toBeInTheDocument();
  });

  it('calls onSlotDrop with index and data when item dropped on slot', () => {
    const onSlotDrop = vi.fn();
    render(<FootballPitch slots={sampleSlots} onSlotDrop={onSlotDrop} />);

    const gk = screen.getByText('GK').parentElement;
    expect(gk).toBeTruthy();

    const dataTransfer = {
      getData: vi.fn().mockReturnValue('player-u1'),
    };
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
    gk!.dispatchEvent(dropEvent);

    expect(onSlotDrop).toHaveBeenCalledWith(0, 'player-u1');
  });

  it('positions slots using x/y percent coordinates with flipped y-axis', () => {
    // Data y=88 renders at top=12% (pitch is flipped so GK at bottom).
    render(<FootballPitch slots={[{ role: 'ST', x: 50, y: 88 }]} />);
    const slot = screen.getByText('ST').parentElement;
    expect(slot).toHaveStyle({ left: '50%', top: '12%' });
  });
});
