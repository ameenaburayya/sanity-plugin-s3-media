export default {
  '**/*.{js,jsx}': ['eslint --fix'],
  '**/*.{ts,tsx}': ['eslint --fix', () => 'tsc --build'],
}
