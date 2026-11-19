import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __APP_COMMIT_SHA__: JSON.stringify('test'),
    __APP_BUILD_TIME__: JSON.stringify('1970-01-01T00:00:00.000Z'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['app/**/*.test.{ts,tsx}', 'lib/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
})
