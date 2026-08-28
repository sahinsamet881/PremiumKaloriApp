import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { ALTIN, ALTIN_COK_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';

function AiLensButonu({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const secili = accessibilityState?.selected;
  return (
    <Pressable onPress={onPress} style={styles.aiLensDisKapsayici}>
      <View style={[styles.aiLensIcKapsayici, secili ? styles.aiLensIcKapsayiciSecili : null]}>
        <MaterialCommunityIcons name="camera-iris" size={30} color={SIYAH} />
      </View>
    </Pressable>
  );
}

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
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-variant" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analiz',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-donut" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          tabBarButton: AiLensButonu,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'AI Koç',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="robot-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog-outline" size={24} color={color} />
          ),
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
    height: 68,
    paddingTop: 8,
  },
  tabBarEtiketi: {
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  aiLensDisKapsayici: {
    top: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLensIcKapsayici: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: SIYAH,
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  aiLensIcKapsayiciSecili: {
    borderColor: ALTIN,
  },
});
