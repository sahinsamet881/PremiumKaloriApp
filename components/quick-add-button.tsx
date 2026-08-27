import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ALTIN, SIYAH } from '@/constants/luxTheme';

export function QuickAddButton() {
  return (
    <Pressable
      onPress={() => router.push('/modal')}
      style={({ pressed }) => [styles.buton, pressed && styles.butonBasili]}>
      <Text style={styles.arti}>+</Text>
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
    backgroundColor: ALTIN,
    shadowColor: ALTIN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  butonBasili: {
    opacity: 0.85,
  },
  arti: {
    color: SIYAH,
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 40,
  },
});
