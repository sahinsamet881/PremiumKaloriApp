import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ALTIN, ALTIN_COK_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: ALTIN,
        tabBarInactiveTintColor: ALTIN_SOLUK,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarEtiketi,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bugün',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Geçmiş',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: SIYAH,
    borderTopColor: ALTIN_COK_SOLUK,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarEtiketi: {
    fontWeight: '300',
    letterSpacing: 0.5,
  },
});
