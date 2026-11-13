/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Palette = {
  navy: '#2D3C59',
  white: '#FFFFFF',
  green: '#66AE44',
  orange: '#D1855C',
  lightGray: '#F2F4F7', // Slightly gray background seen in mockups
  gray: '#C4C4C4',
  darkGray: '#666666',
};

const tintColorLight = Palette.green;
const tintColorDark = Palette.white;

export const Colors = {
  light: {
    text: Palette.navy,
    background: Palette.lightGray,
    card: Palette.white,
    tint: tintColorLight,
    icon: Palette.darkGray,
    tabIconDefault: Palette.gray,
    tabIconSelected: tintColorLight,
    primary: Palette.green,
    secondary: Palette.orange,
  },
  dark: {
    text: Palette.white,
    background: Palette.navy,
    card: '#3D4C69',
    tint: tintColorDark,
    icon: Palette.gray,
    tabIconDefault: Palette.gray,
    tabIconSelected: tintColorDark,
    primary: Palette.green,
    secondary: Palette.orange,
  },
};

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
