import { create } from 'zustand';
import { FormConfig, ThemeTokens, SavedDesign } from './types';

const defaultTheme: ThemeTokens = {
  colors: {
    primary: '#6d28d9',      // Purple
    secondary: '#1f2937',    // Gray 800
    accent: '#10b981',       // Emerald
    background: '#030712',   // Gray 950
    surface: '#111827',      // Gray 900
    border: '#374151',       // Gray 700
    input: '#1f2937',        // Gray 800
    error: '#ef4444',        // Red 500
    success: '#10b981',      // Emerald 500
    textPrimary: '#f9fafb',  // Gray 50
    textSecondary: '#9ca3af', // Gray 400
    placeholder: '#6b7280',   // Gray 500
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    headingFontFamily: '"Space Grotesk", sans-serif',
  },
  background: {
    type: 'gradient',
    baseColor: '#030712',
    gradient: 'radial-gradient(circle at 10% 20%, rgb(90, 92, 106) 0%, rgb(32, 45, 58) 81.3%)',
    imageUrl: '',
    videoUrl: 'https://cdn.pixabay.com/video/2021/08/04/83866-583569421_large.mp4',
    overlayColor: '#000000',
    overlayOpacity: 0.3,
    noiseOpacity: 0.05,
    blur: 0,
  },
  effects: {
    glassmorphism: true,
    inputStyle: 'outline',
    cardRadius: '0.75rem',
    buttonRadius: '0.375rem',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
};

const defaultForm: FormConfig = {
  id: 'default-form',
  title: 'My Custom Event',
  hero: {
    enabled: true,
    title: 'GLITCH Esports Tournament',
    description: 'Register your team for the upcoming season. Win exclusive prizes and prove your dominance.',
    logoUrl: '',
    alignment: 'center',
    height: 'large',
  },
  questions: [
    {
      id: 'q1',
      type: 'shortText',
      title: 'Team Name',
      placeholder: 'Enter your team name',
      required: true,
    },
    {
      id: 'q2',
      type: 'singleChoice',
      title: 'Game Category',
      required: true,
      options: ['FPS', 'MOBA', 'Fighting', 'Sports'],
    },
     {
      id: 'q3',
      type: 'url',
      title: 'Team Twitter / X Profile',
      description: 'Used for announcements and coverage.',
      placeholder: 'https://x.com/yourteam',
      required: false,
    }
  ],
  settings: {
    submitLabel: 'Register Now',
    successMessage: 'Thank you for registering!',
    removeBranding: false,
  },
  theme: defaultTheme,
};

type AppState = {
  plan: 'free' | 'pro';
  usage: {
    forms: number;
    responses: number;
    storageMb: number;
  };
  formConfig: FormConfig;
  savedDesigns: SavedDesign[];
  setPlan: (plan: 'free' | 'pro') => void;
  updateTheme: (fn: (theme: ThemeTokens) => ThemeTokens) => void;
  updateHero: (hero: Partial<FormConfig['hero']>) => void;
  updateSettings: (settings: Partial<FormConfig['settings']>) => void;
  updateQuestions: (questions: FormConfig['questions']) => void;
  saveCurrentDesign: (name: string) => void;
  loadDesign: (id: string) => void;
  deleteDesign: (id: string) => void;
  setFormId: (id: string) => void;
  updateSpreadsheetInfo: (url?: string, email?: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  plan: 'free',
  usage: {
    forms: 1,
    responses: 42,
    storageMb: 12.5,
  },
  formConfig: defaultForm,
  savedDesigns: [
    {
      id: 'template-default',
      name: 'Default Dark',
      theme: defaultTheme,
      updatedAt: new Date().toISOString()
    }
  ],
  setPlan: (plan) => set({ plan }),
  updateTheme: (fn) =>
    set((state) => ({
      formConfig: { ...state.formConfig, theme: fn(state.formConfig.theme) },
    })),
  updateHero: (hero) =>
    set((state) => ({
      formConfig: { ...state.formConfig, hero: { ...state.formConfig.hero, ...hero } },
    })),
  updateSettings: (settings) =>
    set((state) => ({
      formConfig: { ...state.formConfig, settings: { ...state.formConfig.settings, ...settings } },
    })),
  updateQuestions: (questions) =>
    set((state) => ({
      formConfig: { ...state.formConfig, questions },
    })),
  saveCurrentDesign: (name) =>
    set((state) => ({
      savedDesigns: [
        ...state.savedDesigns,
        {
          id: Date.now().toString(),
          name,
          theme: state.formConfig.theme,
          updatedAt: new Date().toISOString(),
        },
      ],
    })),
  loadDesign: (id) =>
    set((state) => {
      const design = state.savedDesigns.find((d) => d.id === id);
      if (!design) return state;
      return {
        formConfig: { ...state.formConfig, theme: design.theme },
      };
    }),
  deleteDesign: (id) =>
    set((state) => ({
      savedDesigns: state.savedDesigns.filter((d) => d.id !== id),
    })),
  setFormId: (id) =>
    set((state) => ({
      formConfig: { ...state.formConfig, id },
    })),
  updateSpreadsheetInfo: (url, email) =>
    set((state) => ({
      formConfig: { ...state.formConfig, spreadsheetUrl: url, googleConnectedEmail: email },
    })),
}));
