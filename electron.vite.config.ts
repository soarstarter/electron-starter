import { resolve } from 'path'
import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

// Shared alias configuration
const aliases = {
  '@/app': resolve(__dirname, 'app'),
  '@/lib': resolve(__dirname, 'lib'),
  '@/resources': resolve(__dirname, 'resources'),
  '@/shared': resolve(__dirname, 'shared'),
}

// Build metadata surfaced on the About page and in diagnostics blobs. Resolved
// at build time and inlined via `define`; git failures degrade to 'unknown'.
const resolveCommitSha = (): string => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

export default defineConfig(() => {
  const buildMetaDefine = {
    __APP_COMMIT_SHA__: JSON.stringify(resolveCommitSha()),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  }

  return {
    main: {
      define: buildMetaDefine,
      build: {
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'lib/main/main.ts'),
          },
        },
      },
      resolve: {
        alias: aliases,
      },
      plugins: [externalizeDepsPlugin()],
    },
    preload: {
      define: buildMetaDefine,
      build: {
        // Bundle dependencies into the preload because Electron's sandboxed
        // preload cannot `require` arbitrary npm modules.
        externalizeDeps: false,
        rollupOptions: {
          input: {
            preload: resolve(__dirname, 'lib/preload/preload.ts'),
          },
        },
      },
      resolve: {
        alias: aliases,
      },
    },
    renderer: {
      define: buildMetaDefine,
      root: './app',
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'app/index.html'),
          },
        },
      },
      resolve: {
        alias: aliases,
      },
      plugins: [tailwindcss(), react()],
    },
  }
})
