/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    icon: '#687076',
    tabIconDefault: '#687076',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
  },
};

export const AKSAN_PALETLERI = {
  mavi: { acik: '#8ecae6', orta: '#0a7ea4', koyu: '#075a78' },
  kirmizi: { acik: '#ff9b9b', orta: '#e63946', koyu: '#a4222c' },
  turuncu: { acik: '#ffc38b', orta: '#f4863a', koyu: '#c25f1f' },
  yesil: { acik: '#95d5a8', orta: '#2fa866', koyu: '#1c7a49' },
} as const;

export type AksanRengiAdi = keyof typeof AKSAN_PALETLERI;

export const VARSAYILAN_AKSAN_RENGI: AksanRengiAdi = 'mavi';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
