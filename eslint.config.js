// @ts-check
import tsEslintPlugin from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    files: ['**/*.ts', '**/*.js'],
  },
  {
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      'eslint-plugin-prettier': eslintPluginPrettierRecommended,
    },
  },
  {
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
      }
    },
  },
  {
    rules: {
      ...tsEslintPlugin.configs['recommended']?.rules,
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
];