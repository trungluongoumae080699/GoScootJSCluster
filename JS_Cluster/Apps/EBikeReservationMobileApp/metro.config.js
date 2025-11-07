// Apps/EBikeReservationMobileApp/metro.config.js
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const appRoot = __dirname;                    // .../Apps/EBikeReservationMobileApp
const workspaceRoot = path.resolve(appRoot, '../..'); // .../JS_Cluster
const modulesRoot = path.resolve(workspaceRoot, 'Packages'); // .../JS_Cluster/modules

const defaultConfig = getDefaultConfig(appRoot);

module.exports = mergeConfig(defaultConfig, {
  projectRoot: appRoot,
  watchFolders: [
    workspaceRoot,   // watch monorepo root (for hoisted deps)
    modulesRoot,     // watch shared code
  ],
  resolver: {
    nodeModulesPaths: [
      path.resolve(appRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    // map "modules/..." imports to your shared folder
    extraNodeModules: {
      modules: modulesRoot,
      'react-native': path.resolve(appRoot, 'node_modules/react-native'),
    },
    // If you still get duplicate RN issues, you can later add a regex blockList here.
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: { experimentalImportSupport: false, inlineRequires: true },
    }),
  },
});