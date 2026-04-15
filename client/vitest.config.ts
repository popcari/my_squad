import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/test/**',
        'src/types/**',
        'src/constant/**',
        'src/i18n/**',
        'src/schemas/**',
        'src/services/**',
        'src/hooks/**',
        'src/contexts/theme-context.tsx',
        'src/components/shared/skeleton.tsx',
        'src/components/ui/language-selector.tsx',
        'src/components/score-modal.tsx',
        'src/components/layout/**',
        'src/app/funding/**',
        'src/app/formations/**',
        'src/app/players/[id]/**',
        'src/app/players/page.tsx',
        'src/app/settings/uniforms/page.tsx',
        'src/app/matches/page.tsx',
        'src/app/matches/match-details-drawer.tsx',
        'src/app/matches/performance-chart.tsx',
        'src/app/matches/player-stats-chart.tsx',
        'src/app/matches/win-rate-pie-chart.tsx',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
        'src/app/**/not-found.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
