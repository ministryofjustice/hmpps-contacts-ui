import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig({
    extraIgnorePaths: ['assets', '**/contactsApi/index.d.ts'],
  }),
  {
    rules: {
      'dot-notation': 'off',
      'import/prefer-default-export': 0,
    },
  },
]
