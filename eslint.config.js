// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Build output must never be linted:
    //   dist/ -> local expo export output
    //   web/  -> deployed web bundle (committed for the VPS deploy)
    // Linting generated bundles produced ~32k false errors and broke CI.
    ignores: ['dist/*', 'web/*', 'node_modules/*'],
  },
]);
