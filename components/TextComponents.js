// Font integration utility for all screens
// This file provides common text components with Gilroy fonts pre-applied

import React from 'react';
import { Text } from 'react-native';
import { typography, colors } from '../components/colors';

// Pre-styled text components
export const GilroyText = ({ style, children, ...props }) => (
  <Text style={[{ fontFamily: typography.fontFamily.regular }, style]} {...props}>
    {children}
  </Text>
);

export const GilroyMediumText = ({ style, children, ...props }) => (
  <Text style={[{ fontFamily: typography.fontFamily.medium }, style]} {...props}>
    {children}
  </Text>
);

export const GilroyBoldText = ({ style, children, ...props }) => (
  <Text style={[{ fontFamily: typography.fontFamily.bold }, style]} {...props}>
    {children}
  </Text>
);

// Predefined text styles for common use cases
export const textStyles = {
  // Headers
  h1: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['4xl'],
    lineHeight: typography.lineHeight['4xl'],
    color: colors.neutrals.dark,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.lineHeight['3xl'],
    color: colors.neutrals.dark,
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.lineHeight['2xl'],
    color: colors.neutrals.dark,
    letterSpacing: typography.letterSpacing.tight,
  },
  h4: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.xl,
    color: colors.neutrals.dark,
  },
  h5: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    color: colors.neutrals.dark,
  },
  h6: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    color: colors.neutrals.dark,
  },

  // Body text
  body1: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    color: colors.neutrals.dark,
  },
  body2: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    color: colors.neutrals.dark,
  },
  body3: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: colors.neutrals.gray,
  },

  // Captions and small text
  caption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: colors.neutrals.gray,
  },
  overline: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    color: colors.neutrals.gray,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },

  // Interactive elements
  button: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    color: 'white',
  },
  buttonLarge: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    color: 'white',
  },
  link: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    color: colors.primary.yellow2,
  },

  // Input fields
  input: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    color: colors.neutrals.dark,
  },
  inputLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: colors.neutrals.gray,
  },

  // Special cases
  price: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.xl,
    color: colors.neutrals.dark,
    letterSpacing: typography.letterSpacing.tight,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    color: colors.neutrals.gray,
  },
  error: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: '#FF6B6B',
  },
  success: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: '#4CAF50',
  },
};
