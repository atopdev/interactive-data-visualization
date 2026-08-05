import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'src/routeTree.gen.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      pluginQuery.configs['flat/recommended'],
      pluginRouter.configs['flat/recommended'],
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // TanStack Router route files export `Route` alongside components by design.
    files: ['src/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // shadcn/ui primitives co-export variant helpers (e.g. buttonVariants).
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // React Bits components are copied in from the registry. Type errors and
    // `any` usage have been fixed, but several React Compiler rules conflict
    // with the imperative WebGL/animation patterns these components rely on:
    //  - refs/immutability: "latest props" refs and mutating three.js/ogl
    //    uniforms in place are how they avoid tearing down GL contexts.
    //  - set-state-in-effect: measurement/animation state seeded after mount.
    //  - exhaustive-deps: effects intentionally omit props that are read via
    //    refs so a slider change does not rebuild the whole renderer.
    //  - prefer-const: `let program` is declared before closures that read it
    //    and assigned once afterwards (read-before-assign).
    // Keep this override scoped to the vendored folder only.
    files: ['src/components/react-bits/**/*.tsx'],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'prefer-const': ['error', { ignoreReadBeforeAssign: true }],
    },
  },
  {
    files: ['scripts/**/*.ts', 'vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
  eslintConfigPrettier,
])
