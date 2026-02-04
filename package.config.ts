import {defineConfig, type PkgConfigOptions} from '@sanity/pkg-utils'

export default defineConfig({
  extract: {enabled: false},
  strictOptions: {
    noImplicitBrowsersList: 'off',
    noImplicitSideEffects: 'off',
    noCheckTypes: 'error',
    noPackageJsonBrowser: 'error',
    noPackageJsonTypesVersions: 'error',
    preferModuleType: 'error',
    noPublishConfigExports: 'error',
  } satisfies NonNullable<PkgConfigOptions['strictOptions']>,
  dts: 'rolldown',
  tsconfig: 'tsconfig.build.json',
  babel: {reactCompiler: true},
  reactCompilerOptions: {target: '19'},
})
