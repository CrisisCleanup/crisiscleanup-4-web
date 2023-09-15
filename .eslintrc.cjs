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
    // Enable type-enriched linting. See: https://typescript-eslint.io/linting/typed-linting/
    'plugin:@typescript-eslint/recommended-type-checked',
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
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.vue'],
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
  ignorePatterns: ['src/external/**/*.ts', 'src/assets/vendor/**/*'],
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
      files: ['*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
        'unicorn/no-null': 'warn',
        'unicorn/no-new-array': 'warn',
        'unicorn/consistent-destructuring': 'warn',
        'unicorn/consistent-function-scoping': 'warn',
        'unicorn/prefer-spread': 'warn',
        'unicorn/no-array-for-each': 'warn',
        'unicorn/prefer-query-selector': 'warn',
        'unicorn/prefer-logical-operator-over-ternary': 'warn',
        'import/namespace': 'warn',
        'promise/param-names': 'warn',
        'promise/catch-or-return': 'warn',
        'promise/always-return': 'warn',
        'vue/no-v-text-v-html-on-component': 'warn',
        'vue/no-unused-components': 'warn',
      },
    },
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ],
};

module.exports = config;
