import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';
import App from './src/app/ShoppingApp';
import React from 'react';
import { LanguageProvider } from './src/i18n/LanguageProvider';

function Root() {
  return React.createElement(LanguageProvider, null, React.createElement(App));
}

registerRootComponent(Root);
