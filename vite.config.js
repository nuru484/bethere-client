import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Source maps are generated as "hidden": full maps for Sentry, but no
// sourceMappingURL comment in the shipped bundles, so browsers (and casual
// visitors) never load them. When SENTRY_AUTH_TOKEN is present (CI), the
// Sentry plugin uploads the maps against a release and deletes them from
// dist so they are never deployed; without the token the plugin is skipped
// entirely and the unreferenced maps are harmless build artifacts.
// The release every Sentry event is tagged with: the commit Vercel is
// building (VERCEL_GIT_COMMIT_SHA is set automatically), or SENTRY_RELEASE
// for any other host. Defined into the bundle as VITE_SENTRY_RELEASE so the
// runtime SDK reads it without a source-map upload having run.
const sentryRelease =
  process.env.SENTRY_RELEASE ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VITE_VERCEL_GIT_COMMIT_SHA ||
  undefined;

const sentryPlugins = process.env.SENTRY_AUTH_TOKEN
  ? [
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: {
          // Vercel exposes the commit SHA at build time; the plugin also
          // injects this release id into the bundle so the runtime SDK
          // tags events with it automatically (see src/lib/sentry.js).
          name: sentryRelease,
        },
        sourcemaps: {
          filesToDeleteAfterUpload: ['dist/**/*.map'],
        },
      }),
    ]
  : [];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ...sentryPlugins],
  define: {
    'import.meta.env.VITE_SENTRY_RELEASE': JSON.stringify(sentryRelease ?? ''),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        // Split the heavy, rarely-changing libraries into their own chunks so
        // they are cached across deploys and parsed once. recharts is shared by
        // both dashboards; @zxing (barcode/QR scanning) is only pulled in by the
        // attendance capture screens.
        manualChunks: {
          recharts: ['recharts'],
          zxing: ['@zxing/browser', '@zxing/library'],
          // On-device face guide: only the guided liveness screens pull this
          // in, and it changes on its own cadence.
          mediapipe: ['@mediapipe/tasks-vision'],
        },
      },
    },
  },
  esbuild: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
});
