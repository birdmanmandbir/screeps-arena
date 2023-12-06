await Bun.build({
  entrypoints: ['./src/arena_zeil_spawn_and_swamp/main.ts'],
  outdir: './dist/',
  target: 'node',
  format: 'esm',
  external: ['game', 'game/prototypes', 'game/constants', 'game/utils', 'game/path-finder', 'arena', 'game/visual'], // <-- suppresses the warning
  naming: '[name].mjs',
})

const outputFile = Bun.file('dist/main.mjs')
const gamingFile = Bun.file('/Users/neil/ScreepsArena/alpha-spawn_and_swamp/main.mjs')
Bun.write(gamingFile, outputFile)
