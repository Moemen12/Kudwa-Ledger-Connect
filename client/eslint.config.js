import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/*',
                '@/presentation/*',
                '@/components/*',
                '@/hooks/*',
                '@/features/*/*',
              ],
              message:
                'Feature modules must stay independent from app/presentation layers and import other features through their public index.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/*',
                '@/features/*',
                '@/presentation/*',
                '@/components/*',
                '@/hooks/*',
              ],
              message:
                'Shared lib code must stay generic and cannot depend on app, feature, or UI layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/infrastructure/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/*',
                '@/features/*',
                '@/presentation/*',
                '@/components/*',
                '@/hooks/*',
              ],
              message:
                'Infrastructure code must stay framework/data-adapter focused and cannot depend on features or UI.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/presentation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/features/*/*'],
              message:
                'Presentation code should not import app internals or private feature files. Use feature public indexes.',
            },
          ],
        },
      ],
    },
  },
])
