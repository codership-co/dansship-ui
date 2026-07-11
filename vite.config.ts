import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [basicSsl(), tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
  build: {
    manifest: true,
  },
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: 'localhost.dansship.com',
    open: true,
  },
});
