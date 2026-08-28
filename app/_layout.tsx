import { DarkTheme, DefaultTheme, ThemeProvider as NavigasyonTemasi } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { DataProvider as VeriSaglayici } from '@/context/DataContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontlarYuklendi] = useFonts({
    StoriesGrand: require('../assets/images/fonts/StoriesGrand.ttf'),
  });

  useEffect(() => {
    if (fontlarYuklendi) {
      SplashScreen.hideAsync();
    }
  }, [fontlarYuklendi]);

  if (!fontlarYuklendi) {
    return null;
  }

  return (
    <VeriSaglayici>
      <NavigasyonTemasi value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack>
        <StatusBar style="auto" />
      </NavigasyonTemasi>
    </VeriSaglayici>
  );
}
