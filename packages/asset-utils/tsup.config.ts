import {defineConfig} from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: ['sanity-plugin-s3-media-types'],
  },
  clean: true,
  noExternal: ['sanity-plugin-s3-media-types'],
})
