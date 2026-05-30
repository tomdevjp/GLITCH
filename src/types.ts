export type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  input: string;
  error: string;
  success: string;
  textPrimary: string;
  textSecondary: string;
  placeholder: string;
};

export type ThemeTypography = {
  fontFamily: string;
  headingFontFamily: string;
};

export type ThemeBackground = {
  type: 'color' | 'gradient' | 'image' | 'video';
  baseColor: string;
  gradient: string;
  imageUrl: string;
  videoUrl: string;
  overlayColor: string;
  overlayOpacity: number;
  noiseOpacity: number;
  blur: number;
};

export type ThemeEffects = {
  glassmorphism: boolean;
  inputStyle: 'solid' | 'outline' | 'underlined' | 'glass';
  cardRadius: string;
  buttonRadius: string;
  shadow: string;
};

export type ThemeTokens = {
  colors: ThemeColors;
  typography: ThemeTypography;
  background: ThemeBackground;
  effects: ThemeEffects;
};

export type QuestionType = 'shortText' | 'longText' | 'singleChoice' | 'multipleChoice' | 'dropdown' | 'url';

export type Question = {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
};

export type HeroConfig = {
  enabled: boolean;
  title: string;
  description: string;
  logoUrl: string;
  alignment: 'left' | 'center' | 'right';
  height: 'auto' | 'screen' | 'large';
};

export type FormConfig = {
  id: string;
  title: string;
  hero: HeroConfig;
  questions: Question[];
  settings: {
    submitLabel: string;
    successMessage: string;
    removeBranding: boolean;
  };
  theme: ThemeTokens;
  spreadsheetUrl?: string;
  googleConnectedEmail?: string;
};

export type SavedDesign = {
  id: string;
  name: string;
  theme: ThemeTokens;
  updatedAt: string;
};
