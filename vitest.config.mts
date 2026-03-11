import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'test/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    globals: true,
    css: true,
    exclude: [
      'node_modules/**',
      'tests/e2e/**',
      '**/*.e2e.{test,spec}.{ts,tsx}',
      '**/*.pw.{test,spec}.{ts,tsx}',
    ],
  },
})
