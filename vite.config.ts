import babel from '@rolldown/plugin-babel';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    basicSsl(),
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG || 'codership',
            project: process.env.SENTRY_PROJECT || 'dansship-ui',
            authToken: sentryAuthToken,
          }),
        ]
      : []),
  ],
  build: {
    manifest: true,
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@sentry')) {
            return 'sentry';
          }

          if (id.includes('node_modules/@embedpdf')) {
            return 'pdf';
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: 'localhost.dansship.com',
    open: true,
  },
});
