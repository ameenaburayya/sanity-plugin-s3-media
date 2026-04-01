export default {
  '*.{js,mjs,cjs,ts,tsx,jsx}': [
    'eslint --fix --cache',
    'prettier --write --cache',
    () => 'pnpm typecheck:all',
  ],
  '*.{json,md,yml,yaml}': ['prettier --write --cache'],
}
