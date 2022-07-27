const { getESLintConfig } = require('@iceworks/spec');

// https://www.npmjs.com/package/@iceworks/spec
module.exports = getESLintConfig('common-ts', {
  extends: [
    "prettier"
  ],
  rules: {
    '@typescript-eslint/no-useless-constructor': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-invalid-void-type': 'off',
    '@typescript-eslint/method-signature-style': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    'no-undef': 'error',
    'prefer-const': 'warn',
    '@typescript-eslint/no-shadow': 'off',
  },
});
