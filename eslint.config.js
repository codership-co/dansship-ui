import { defineConfig } from 'eslint/config';
import EslintConfig from 'polpo-eslint-config/react';

export default defineConfig(EslintConfig, {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@components/ui',
            importNames: ['Button'],
            message: 'Import Button from polpo/components.',
          },
          {
            name: '@components/ui/button',
            importNames: ['Button'],
            message: 'Import Button from polpo/components.',
          },
        ],
      },
    ],
  },
});
