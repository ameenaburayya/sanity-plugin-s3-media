/* eslint-disable import/extensions */
import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import {defineConfig, globalIgnores} from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import sanityImport from 'eslint-config-sanity/import.js'
import sanityRecommended from 'eslint-config-sanity/index.js'
import sanityReact from 'eslint-config-sanity/react.js'
import sanityTypescript from 'eslint-config-sanity/typescript.js'
import * as importPlugin from 'eslint-plugin-import'
import pluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import vitestPlugin from 'eslint-plugin-vitest'
import globals from 'globals'

const ignores = [
  '*.js',
  '.eslintrc.js',
  'commitlint.config.js',
  'dist',
  'lint-staged.config.js',
  'package.config.ts',
]

export default defineConfig([
  globalIgnores(ignores),
  {
    name: 'language-options+globals',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
    },
    settings: {react: {version: 'detect'}},
  },
  {
    name: '@eslint/js/recommended',
    ...js.configs.recommended,
  },
  {
    name: 'react/recommended',
    ...pluginReact.configs.flat.recommended,
  },
  {
    name: 'react/jsx-runtime',
    ...pluginReact.configs.flat['jsx-runtime'],
  },
  {
    name: 'react-hooks/recommended',
    ...reactHooks.configs.flat.recommended,
  },
  {
    name: '@typescript-eslint/eslint-recommended',
    ...tseslint.configs['flat/eslint-recommended'],
  },
  {
    name: 'eslint-plugin-import/typescript',
    ...importPlugin.flatConfigs?.typescript,
  },
  ...tseslint.configs['flat/recommended'],
  reactHooks.configs.flat['recommended-latest'],
  {
    name: 'sanity/base',
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      ...sanityRecommended.rules,
      ...sanityReact.rules,
      ...sanityImport.rules,
      ...sanityTypescript.rules,
      'no-void': 'off',
      'no-nested-ternary': 'off',
      'react/jsx-no-bind': 'off',
      'no-shadow': 'off',
      'no-negated-condition': 'off',
      'import/named': 'off',
      'import/no-unresolved': 'off',
      'no-unused-vars': 'off',
      'simple-import-sort/imports': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-explicit-any': ['warn'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {ignoreRestSiblings: true, argsIgnorePattern: '^_'},
      ],
      'react/require-default-props': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    name: 'vitest/recommended',
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{test,spec}.{js,jsx,ts,tsx}'],
    plugins: {
      vitest: vitestPlugin,
    },
    languageOptions: {
      ...vitestPlugin.configs.env.languageOptions,
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
    },
  },
  eslintConfigPrettier,
])
