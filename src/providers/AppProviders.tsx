import React from 'react';
import { Provider as PaperProvider, MD3LightTheme, Portal } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../theme';

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...theme.colors,
  },
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <Portal.Host>
          <NavigationContainer>
            {children}
          </NavigationContainer>
        </Portal.Host>
      </PaperProvider>
    </SafeAreaProvider>
  );
} 