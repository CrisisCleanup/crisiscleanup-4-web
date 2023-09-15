/**
 * @type {import("eslint").Linter.Config}
 */
const config = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended', // See: https://eslint.vuejs.org/user-guide/#bundle-configurations
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/recommended',
    'plugin:import/recommended',
    'plugin:promise/recommended',
    './.eslintrc-auto-import.json', // for unplugin-auto-import
    'plugin:prettier/recommended',
  ],
  // See: https://eslint.vuejs.org/user-guide/#how-to-use-a-custom-parser
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
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
  ignorePatterns: ['src/external/**/*.ts'],
  plugins: [
    'vue',
    '@typescript-eslint',
    'prettier',
    'unicorn',
    'import',
    'promise',
  ],
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
    // This rule is giving false positives on VueX find methods
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/filename-case': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/no-null': 'error', // The 'unicorn/no-null' rule is intentionally enabled. See: https://github.com/sindresorhus/meta/discussions/7
    '@typescript-eslint/naming-convention': 'off',
    'import/no-unassigned-import': 'off',
    'import/no-cycle': 'off',
    'import/named': 'off',
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        'vue/multi-word-component-names': 'warn',
        'vue/no-reserved-component-names': 'warn',
      },
    },
    {
      files: ['test/e2e/**'],
      rules: {
        'no-await-in-loop': 'off',
      },
    },
    {
      files: ['*.json'],
      rules: {
        'unicorn/numeric-separators-style': 'off',
        'unicorn/no-null': 'off',
      },
    },
  ],
};

module.exports = config;
