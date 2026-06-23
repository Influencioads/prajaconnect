const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo support: only watch the workspace package this app actually imports
// (@praja/types). Watching the whole workspace root makes Metro crawl the 1.4GB
// root node_modules on Windows (no watchman), which hangs the bundler. Hoisted
// deps still resolve on demand via nodeModulesPaths below.
config.watchFolders = [path.resolve(workspaceRoot, 'packages/types')];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force a single React/React-DOM instance. The root node_modules pins react@18
// (for the Next.js web app), but this app needs react@19 (Expo SDK 54). Hoisted
// deps like expo-router would otherwise resolve the root's react@18 and crash on
// `React.use` (web target). Redirect all react / react-dom requests to this
// app's local copies.
// expo-sqlite's web backend imports a .wasm asset (wa-sqlite). Register the
// extension so the web bundle can resolve it.
config.resolver.assetExts.push('wasm');

const reactPath = path.resolve(projectRoot, 'node_modules/react');
const reactDomPath = path.resolve(projectRoot, 'node_modules/react-dom');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return context.resolveRequest(context, reactPath + moduleName.slice('react'.length), platform);
  }
  if (moduleName === 'react-dom' || moduleName.startsWith('react-dom/')) {
    return context.resolveRequest(context, reactDomPath + moduleName.slice('react-dom'.length), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
