// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
<<<<<<< HEAD
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
// eslint-disable-next-line no-undef
=======

const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */

>>>>>>> 5115cf2 (Initial commit)
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
