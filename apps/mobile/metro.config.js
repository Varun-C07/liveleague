// Metro config for the Expo app inside the npm-workspaces monorepo.
// Lets Metro watch + resolve the shared workspace package (@liveleagues/core),
// which ships TypeScript source (Metro transpiles it). See:
// https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo (so changes in packages/core hot-reload).
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from both the app's and the workspace root's node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. @liveleagues/core uses package.json "exports" subpaths → enable them.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
