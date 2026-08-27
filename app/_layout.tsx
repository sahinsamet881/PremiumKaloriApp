import { DarkTheme, DefaultTheme, ThemeProvider as NavigasyonTemasi } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { DataProvider as VeriSaglayici } from '@/context/DataContext';
import { ThemeProvider as AksanSaglayici } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AksanSaglayici>
      <VeriSaglayici>
        <NavigasyonTemasi value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen name="search" options={{ headerShown: false }} />
            <Stack.Screen
              name="onboarding"
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </Stack>
          <StatusBar style="auto" />
        </NavigasyonTemasi>
      </VeriSaglayici>
    </AksanSaglayici>
  );
}
