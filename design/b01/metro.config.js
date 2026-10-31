const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const appRoot = path.resolve(__dirname, '../..');
config.watchFolders = [appRoot];
config.resolver.nodeModulesPaths = [path.join(appRoot, 'node_modules')];
module.exports = config;
