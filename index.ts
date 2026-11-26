import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';
import App from './src/app/ShoppingApp';
import React from 'react';
import { LanguageProvider } from './src/i18n/LanguageProvider';
import { StoreAreaProvider } from './src/app/StoreAreaProvider';

function Root() {
  return React.createElement(LanguageProvider, null, React.createElement(StoreAreaProvider, null, React.createElement(App)));
}

registerRootComponent(Root);
