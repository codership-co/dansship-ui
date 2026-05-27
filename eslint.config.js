import { resolve } from 'node:path';

import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettierFlat from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import preferArrow from 'eslint-plugin-prefer-arrow';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

const project = resolve(process.cwd(), 'tsconfig.json');

export const prettierConfig = {
  printWidth: 120,
  singleQuote: true,
  useTabs: false,
  tabWidth: 2,
  semi: true,
  arrowParens: 'avoid',
  trailingComma: 'all',
  jsxSingleQuote: true,
  endOfLine: 'auto',
};

export default defineConfig([
  globalIgnores(['**/dist/**', '**/.next/**', '**/node_modules/**', '*.d.ts']),
  {
    linterOptions: {
      reportUnusedInlineConfigs: 'error',
      reportUnusedDisableDirectives: 'error',
    },
  },
  eslint.configs.recommended,
  typescriptEslint.configs.recommended,
  eslintPluginPrettierRecommended,
  eslintConfigPrettierFlat,
  {
    plugins: {
      js: eslint,
      import: importPlugin,
      'prefer-arrow': preferArrow,
      prettier: eslintPluginPrettier,
      '@typescript-eslint': typescriptEslint.plugin,
      'unused-imports': unusedImports,
    },
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {},
      parser: typescriptEslint.parser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project,
        },
      },
    },
    rules: {
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': ['error'],
      '@typescript-eslint/ban-types': ['off'],
      '@typescript-eslint/no-empty-object-type': 'off',
      'array-callback-return': 'error',
      eqeqeq: ['error', 'always'],
      'guard-for-in': 'warn',
      'import/no-default-export': 'off',
      'import/no-named-as-default': 'error',
      'import/no-named-default': 'error',
      'import/no-namespace': 'error',
      'import/no-self-import': 'error',
      'import/export': 'error',
      'import/exports-last': 'off',
      'import/first': 'error',
      'import/group-exports': 'off',
      'import/newline-after-import': 'error',
      'import/no-absolute-path': 'error',
      'import/no-cycle': ['error', { ignoreExternal: true }],
      'import/no-deprecated': 'error',
      'import/no-extraneous-dependencies': ['error', { optionalDependencies: false }],
      'import/no-useless-path-segments': ['error', { noUselessIndex: true }],
      'import/no-webpack-loader-syntax': 'error',
      'import/prefer-default-export': 'off',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          warnOnUnassignedImports: true,
          groups: ['builtin', 'external', 'parent', 'sibling', 'internal', 'index', 'object', 'type', 'unknown'],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: false,
          },
        },
      ],
      'line-comment-position': ['error', 'above'],
      'multiline-comment-style': ['error', 'starred-block'],
      'no-confusing-arrow': 'off',
      'no-console': 'warn',
      'no-duplicate-imports': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-implicit-globals': 'error',
      'no-invalid-this': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-new': 'error',
      'no-promise-executor-return': 'error',
      'no-prototype-builtins': 'warn',
      'no-return-assign': 'error',
      'no-return-await': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-vars': 'off',
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: '*', next: 'continue' },
        { blankLine: 'always', prev: '*', next: 'break' },
        { blankLine: 'always', prev: '*', next: 'if' },
        { blankLine: 'always', prev: 'if', next: '*' },
        { blankLine: 'always', prev: 'while', next: '*' },
        { blankLine: 'always', prev: '*', next: 'while' },
        { blankLine: 'always', prev: 'switch', next: '*' },
        { blankLine: 'always', prev: '*', next: 'switch' },
        { blankLine: 'always', prev: 'for', next: '*' },
        { blankLine: 'always', prev: '*', next: 'for' },
      ],
      'prefer-arrow-callback': ['error'],
      'prefer-arrow/prefer-arrow-functions': 'off',
      'prettier/prettier': ['error', prettierConfig],
      quotes: ['error', 'single'],
      semi: 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',
      yoda: 'error',
    },
  },
  pluginReact.configs.flat.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react: pluginReact,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
        React: true,
        JSX: true,
      },
    },
    rules: {
      'react/destructuring-assignment': ['error', 'always'],
      'react/jsx-fragments': ['error', 'syntax'],
      'react/jsx-no-target-blank': [
        'error',
        {
          allowReferrer: true,
        },
      ],
      'react/jsx-no-useless-fragment': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/function-component-definition': [
        'off',
        { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
      ],
      'react-refresh/only-export-components': ['off', { allowConstantExport: true }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]);
