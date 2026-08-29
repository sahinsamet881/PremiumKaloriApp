import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { ALTIN, ALTIN_COK_SOLUK, ALTIN_SOLUK, SIYAH } from '@/constants/luxTheme';

const FAB_IPUCU_ANAHTARI = '@minimalist_kalori/fab_ipucu_goruldu';
const TAB_BAR_YUKSEKLIGI = 74;

function AiLensButonu({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const secili = accessibilityState?.selected;
  return (
    <Pressable
      onPress={onPress}
      style={styles.aiLensDisKapsayici}
      accessibilityRole="button"
      accessibilityLabel="Yemeğini fotoğrafla, kalori hesaplat"
      accessibilityHint="AI Lens kamerasını açar">
      <View style={[styles.aiLensIcKapsayici, secili ? styles.aiLensIcKapsayiciSecili : null]}>
        <MaterialCommunityIcons name="camera-iris" size={30} color={SIYAH} />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [ipucuGoster, setIpucuGoster] = useState(false);

  useEffect(() => {
    let zamanlayici: ReturnType<typeof setTimeout> | undefined;
    AsyncStorage.getItem(FAB_IPUCU_ANAHTARI).then((deger) => {
      if (!deger) {
        zamanlayici = setTimeout(() => setIpucuGoster(true), 900);
      }
    });
    return () => clearTimeout(zamanlayici);
  }, []);

  useEffect(() => {
    if (!ipucuGoster) {
      return;
    }
    const zamanlayici = setTimeout(() => {
      setIpucuGoster(false);
      AsyncStorage.setItem(FAB_IPUCU_ANAHTARI, 'true');
    }, 5000);
    return () => clearTimeout(zamanlayici);
  }, [ipucuGoster]);

  const ipucuKapat = () => {
    setIpucuGoster(false);
    AsyncStorage.setItem(FAB_IPUCU_ANAHTARI, 'true');
  };

  return (
    <View style={styles.kok}>
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
            tabBarAccessibilityLabel: 'Bugün, ana ekran',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="home-variant" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analysis"
          options={{
            title: 'Analiz',
            tabBarAccessibilityLabel: 'Analiz',
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
            tabBarAccessibilityLabel: 'AI Koç, yapay zeka diyet koçu',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="robot-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="history" options={{ href: null }} />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ayarlar',
            tabBarAccessibilityLabel: 'Ayarlar',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cog-outline" size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {ipucuGoster ? (
        <View
          style={[styles.ipucuKatmani, { bottom: TAB_BAR_YUKSEKLIGI + insets.bottom + 26 }]}
          pointerEvents="box-none">
          <Pressable
            onPress={ipucuKapat}
            style={styles.ipucuBalonu}
            accessibilityRole="button"
            accessibilityLabel="İpucunu kapat">
            <Text style={styles.ipucuYazisi}>Yemeğini fotoğrafla, biz hesaplayalım</Text>
          </Pressable>
          <View style={styles.ipucuOk} pointerEvents="none" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kok: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  tabBar: {
    backgroundColor: SIYAH,
    borderTopColor: ALTIN_COK_SOLUK,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: TAB_BAR_YUKSEKLIGI,
    paddingTop: 8,
  },
  tabBarEtiketi: {
    fontSize: 10,
    fontWeight: '300',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  aiLensDisKapsayici: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLensIcKapsayici: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -24,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: SIYAH,
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 10,
  },
  aiLensIcKapsayiciSecili: {
    borderColor: ALTIN,
  },
  ipucuKatmani: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ipucuBalonu: {
    maxWidth: 280,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SIYAH,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  ipucuYazisi: {
    color: ALTIN,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  ipucuOk: {
    width: 12,
    height: 12,
    backgroundColor: SIYAH,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: ALTIN,
    transform: [{ rotate: '45deg' }],
    marginTop: -6,
  },
});
