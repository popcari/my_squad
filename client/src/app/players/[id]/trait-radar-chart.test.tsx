import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Recharts needs fixed-size container in jsdom
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: '600px', height: '400px' }}>{children}</div>
    ),
  };
});

import { TraitRadarChart } from './trait-radar-chart';

const sampleTraits = [
  { id: 'ut1', name: 'Finesse Shot', rating: 4.5 },
  { id: 'ut2', name: 'Long Passer', rating: 3 },
  { id: 'ut3', name: 'Speed Dribbler', rating: 5 },
];

describe('TraitRadarChart', () => {
  it('renders nothing when less than 3 traits', () => {
    const { container } = render(
      <TraitRadarChart data={sampleTraits.slice(0, 2)} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('mounts the chart container when 3 or more traits', () => {
    const { container } = render(<TraitRadarChart data={sampleTraits} />);
    // Chart wrapper div is present (SVG internals depend on layout which JSDOM doesn't compute)
    const wrapper = container.querySelector('div');
    expect(wrapper).not.toBeNull();
    // The recharts responsive wrapper from our mock is rendered
    expect(container.innerHTML).toContain('600px');
  });
});
