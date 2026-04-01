import tsconfigPaths from 'vite-tsconfig-paths'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    environmentMatchGlobs: [['**/*.test.tsx', 'jsdom']],
    globals: true,
    testTimeout: 30_000,
    include: ['src/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.tsx'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'html'],
      include: [
        'src/client.ts',
        'src/config/**/*.ts',
        'src/constants.ts',
        'src/index.ts',
        'src/lib/**/*.ts',
        'src/modules/**/*.ts',
        'src/plugin.tsx',
        'src/schema/**/*.ts',
        'src/utils/**/*.ts',
      ],
      exclude: [
        '**/*.d.ts',
        'src/**/__tests__/**',
        'src/schema/**/components/**',
        'src/types/**',
        'src/**/types.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
