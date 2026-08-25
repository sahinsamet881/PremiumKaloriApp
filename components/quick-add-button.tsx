import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAksanRenk } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function QuickAddButton() {
  const colorScheme = useColorScheme() ?? 'light';
  const { aksanTonlari } = useAksanRenk();
  const artiRengi = colorScheme === 'light' ? '#fff' : '#000';

  return (
    <Pressable
      onPress={() => router.push('/modal')}
      style={({ pressed }) => [
        styles.buton,
        { backgroundColor: pressed ? aksanTonlari.koyu : aksanTonlari.orta },
      ]}>
      <Text style={[styles.arti, { color: artiRengi }]}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 24,
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  arti: {
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 40,
  },
});
