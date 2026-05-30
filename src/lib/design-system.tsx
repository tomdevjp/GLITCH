import React, { useMemo } from 'react';
import { ThemeTokens } from '../types';

/**
 * Utility to map ThemeTokens to standard CSS variables.
 * These CSS variables can be consumed by Tailwind if configured, 
 * or used directly via inline styles / class manipulations.
 */
export function useThemeStyles(theme: ThemeTokens): React.CSSProperties {
  return useMemo(() => {
    return {
      '--color-primary': theme.colors.primary,
      '--color-secondary': theme.colors.secondary,
      '--color-accent': theme.colors.accent,
      '--color-background': theme.colors.background,
      '--color-surface': theme.colors.surface,
      '--color-border': theme.colors.border,
      '--color-input': theme.colors.input,
      '--color-error': theme.colors.error,
      '--color-success': theme.colors.success,
      '--color-text-primary': theme.colors.textPrimary,
      '--color-text-secondary': theme.colors.textSecondary,
      '--color-placeholder': theme.colors.placeholder,
      '--font-family': theme.typography.fontFamily,
      '--font-family-heading': theme.typography.headingFontFamily,
      '--bg-base-color': theme.background.baseColor,
      '--bg-gradient': theme.background.gradient,
      '--bg-image': theme.background.imageUrl ? `url(${theme.background.imageUrl})` : 'none',
      '--bg-overlay-color': theme.background.overlayColor,
      '--bg-overlay-opacity': theme.background.overlayOpacity.toString(),
      '--bg-noise-opacity': theme.background.noiseOpacity.toString(),
      '--bg-blur': `${theme.background.blur}px`,
      '--radius-card': theme.effects.cardRadius,
      '--radius-button': theme.effects.buttonRadius,
      '--shadow-effect': theme.effects.shadow,
    } as React.CSSProperties;
  }, [theme]);
}

export const NoiseOverlay = ({ opacity }: { opacity: number }) => {
  if (opacity <= 0) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-[var(--bg-noise-opacity)]"
      style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.5%22/%3E%3C/svg%3E")',
      }}
    />
  );
};
