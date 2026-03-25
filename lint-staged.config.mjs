export default {
  '*.{ts,js,mjs,css}': ['prettier --write', 'eslint --fix --max-warnings 0 --no-warn-ignored'],
  '*.json': ['prettier --write'],
}
