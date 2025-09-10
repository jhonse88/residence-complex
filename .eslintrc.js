/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  ignorePatterns: ['src/generated/**', 'src/generated/prisma/**', '.next/**', 'dist/**', 'node_modules/**'],
  overrides: [
    {
      files: ['src/generated/**/*.{js,ts}'],
      rules: {
        semi: ['error', 'never'],
        'no-console': 'error',
        'prettier/prettier': 'error',
        semi: ['error', 'never'],
        'prefer-template': 'error',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-unsafe-function-type': 'off',
        '@typescript-eslint/no-wrapper-object-types': 'off',
        '@typescript-eslint/no-unnecessary-type-constraint': 'off',
        'no-console': 'error',
        'prefer-object-spread': 'error'
      }
    }
  ]
}
