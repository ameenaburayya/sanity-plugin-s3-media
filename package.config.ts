const {defineConfig} = require('@sanity/pkg-utils')

module.exports = defineConfig({
  dist: 'dist',
  tsconfig: 'tsconfig.dist.json',
  babel: {reactCompiler: true},
  reactCompilerOptions: {target: '19'},

  // Remove this block to enable strict export validation
  extract: {
    rules: {
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
})
