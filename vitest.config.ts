import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    env: {
      VITE_SUPABASE_URL: 'https://placeholder-test-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test_token_placeholder_for_vitest_unit_tests',
    },
  },
});
