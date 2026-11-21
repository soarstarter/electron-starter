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
    include: [
      'shared/config.test.ts',
      'lib/conveyor/schemas/schemas.test.ts',
      'lib/conveyor/handlers/file-handler.test.ts',
      'lib/preload/shared.test.ts',
      'lib/preload/preload.test.ts',
      'lib/main/app-intents.test.ts',
      'lib/main/argv-intents.test.ts',
      'lib/main/external-url.test.ts',
      'lib/main/ipc-sender.test.ts',
      'lib/main/shared.test.ts',
      'lib/main/log-redact.test.ts',
      'lib/main/navigation-guard.test.ts',
      'lib/main/permissions.test.ts',
      'lib/main/recent-file-access.test.ts',
      'lib/main/secure-storage.test.ts',
      'lib/main/settings.test.ts',
      'lib/main/window-state.test.ts',
    ],
    setupFiles: ['./test/setup.ts'],
  },
})
