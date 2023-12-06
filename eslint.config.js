import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'export-game-constants.ts',
      'exported-game-constants.js',
      'dist_bun/*',
    ],
  },
  // split to seperate config to prevent coupling of `ignores` and `rules`
  // https://github.com/antfu/eslint-config/issues/280
  {
    rules: {
      'no-console': ['warn'],
      'no-unused-vars': ['warn'],
      'unused-imports/no-unused-vars': ['warn'],
    },
    settings: {
      'import/core-modules': [
        'game',
        'game/prototypes',
        'game/utils',
        'game/path-finder',
        'game/constants',
        'game/visual',
        'arena',
        'arena/prototypes',
        'arena/constants',
      ], // https://github.com/benmosher/eslint-plugin-import/blob/v2.22.1/README.md#importcore-modules
    },
  },
  // Other flat configs...
)
