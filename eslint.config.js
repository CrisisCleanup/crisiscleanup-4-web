import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import vue from 'eslint-plugin-vue';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import unicorn from 'eslint-plugin-unicorn';
import _import from 'eslint-plugin-import';
import promise from 'eslint-plugin-promise';
import globals from 'globals';
import parser from 'vue-eslint-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      'src/external/**/*.ts',
      'src/assets/vendor/**/*',
      '**/*.json',
      '**/.DS_Store',
      '**/dist',
      '**/public',
      '**/node_modules',
      '**/node_modules/**/*',
      '**/coverage/**/*',
      '**/playwright/**/*',
      '**/playwright-report/**/*',
      '**/test-results/**/*',
      '**/coverage',
      '**/pnpm-debug.log',
      '**/auto-imports.d.ts',
      '**/.eslintrc-auto-import.json',
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:vue/vue3-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-type-checked',
      'plugin:unicorn/recommended',
      'plugin:import/recommended',
      'plugin:promise/recommended',
      './.eslintrc-auto-import.json',
      'plugin:prettier/recommended',
    ),
  ),
  {
    plugins: {
      vue: fixupPluginRules(vue),
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      prettier: fixupPluginRules(prettier),
      unicorn: fixupPluginRules(unicorn),
      import: fixupPluginRules(_import),
      promise: fixupPluginRules(promise),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: parser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        parser: '@typescript-eslint/parser',
        project: ['./tsconfig.json', './tsconfig.node.json'],
        extraFileExtensions: ['.vue'],

        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },

      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },

    rules: {
      camelcase: 'off',
      'no-warning-comments': 'off',
      'capitalized-comments': 'off',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/member-ordering': 'warn',
      'n/file-extension-in-import': 'off',
      'import/extensions': 'off',
      'import/no-anonymous-default-export': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-null': 'error',
      '@typescript-eslint/naming-convention': 'off',
      'import/no-unassigned-import': 'off',
      'import/no-cycle': 'error',
      'import/named': 'off',
    },
  },
  {
    files: ['**/*.vue'],

    languageOptions: {
      parser: parser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        parser: 'typescript-eslint-parser-for-extra-files',
      },
    },

    rules: {
      'vue/multi-word-component-names': 'warn',
      'vue/no-reserved-component-names': 'warn',
      'vue/require-toggle-inside-transition': 'warn',
    },
  },
  {
    files: ['test/e2e/**'],

    rules: {
      'no-await-in-loop': 'off',
    },
  },
  {
    files: ['**/*.json'],

    rules: {
      'unicorn/numeric-separators-style': 'off',
      'unicorn/no-null': 'off',
    },
  },

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // TODO: ENABLE THESE RULES
  //
  // The following rules have been temporarily set to 'warn' instead of 'error'.
  // This is a temporary measure to allow us to introduce linting into our CI pipeline
  // without it failing due to a large number of existing linting issues in our codebase.
  //
  // The goal is to gradually fix these warnings and eventually switch these rules back to 'error'.
  // This will help us improve the quality of our codebase incrementally, without disrupting
  // the current development workflow.
  //
  // Note: These rules were not arbitrarily chosen. They represent common issues in our codebase
  // that we want to address. However, due to the sheer volume of these issues, it's not feasible
  // to fix them all at once. Hence, we're using 'warn' as a stepping stone towards better code quality.
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  {
    files: ['**/*'],

    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',

      '@typescript-eslint/unbound-method': [
        'warn',
        {
          ignoreStatic: true,
        },
      ],

      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/restrict-plus-operands': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      'unicorn/no-null': 'warn',
      'unicorn/no-new-array': 'warn',
      'unicorn/consistent-destructuring': 'warn',
      'unicorn/consistent-function-scoping': 'warn',
      'unicorn/prefer-spread': 'warn',
      'unicorn/no-array-for-each': 'warn',
      'unicorn/prefer-query-selector': 'warn',
      'unicorn/prefer-logical-operator-over-ternary': 'warn',
      'unicorn/no-anonymous-default-export': 'warn',
      'import/namespace': 'warn',
      'import/export': 'warn',
      'promise/param-names': 'warn',
      'promise/catch-or-return': 'warn',
      'promise/always-return': 'warn',
      'vue/no-v-text-v-html-on-component': 'warn',
      'vue/no-unused-components': 'warn',

      'import/no-unresolved': [
        2,
        {
          ignore: ['~icons/.*$'],
        },
      ],
    },
  },
];
