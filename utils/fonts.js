import * as Font from 'expo-font';

export const FontFamily = {
  GilroyRegular: 'Gilroy-Regular',
  GilroyMedium: 'Gilroy-Medium',
  GilroyBold: 'Gilroy-Bold',
};

export const loadFonts = async () => {
  await Font.loadAsync({
    [FontFamily.GilroyRegular]: require('../assets/fonts/Gilroy-Regular.ttf'),
    [FontFamily.GilroyMedium]: require('../assets/fonts/Gilroy-Medium.ttf'),
    [FontFamily.GilroyBold]: require('../assets/fonts/Gilroy-Bold.ttf'),
  });
};

// Font weight mapping for easier usage
export const getFontFamily = (weight = 'regular') => {
  switch (weight) {
    case 'bold':
    case '700':
    case '600':
      return FontFamily.GilroyBold;
    case 'medium':
    case '500':
      return FontFamily.GilroyMedium;
    case 'regular':
    case 'normal':
    case '400':
    default:
      return FontFamily.GilroyRegular;
  }
};

// Common font styles
export const fontStyles = {
  h1: {
    fontFamily: FontFamily.GilroyBold,
    fontSize: 28,
    lineHeight: 34,
  },
  h2: {
    fontFamily: FontFamily.GilroyBold,
    fontSize: 24,
    lineHeight: 30,
  },
  h3: {
    fontFamily: FontFamily.GilroyBold,
    fontSize: 20,
    lineHeight: 26,
  },
  h4: {
    fontFamily: FontFamily.GilroyMedium,
    fontSize: 18,
    lineHeight: 24,
  },
  h5: {
    fontFamily: FontFamily.GilroyMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  h6: {
    fontFamily: FontFamily.GilroyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  body1: {
    fontFamily: FontFamily.GilroyRegular,
    fontSize: 16,
    lineHeight: 22,
  },
  body2: {
    fontFamily: FontFamily.GilroyRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: FontFamily.GilroyRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: FontFamily.GilroyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
};
