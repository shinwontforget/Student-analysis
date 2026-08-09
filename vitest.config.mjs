import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Use the Node environment (no DOM needed for pure engine logic)
    environment: 'node',
    // Show verbose test names in CI output
    reporter: 'verbose',
    // Collect coverage from services only
    coverage: {
      provider: 'v8',
      include: ['src/lib/services/**/*.ts'],
      exclude: ['src/lib/services/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
