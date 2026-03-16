import { ColorTheme, ResumeTemplate } from '../types';

/* ─────────────────────────────────────────────
   ATS-friendly color palettes
   Kept muted / high-contrast for print & scan
   ───────────────────────────────────────────── */

const NAVY: ColorTheme = {
  id: 'navy',
  name: 'Navy',
  primary: '#1e3a5f',
  primaryLight: '#eef3f9',
  primaryText: '#1e3a5f',
  headerBg: '#1e3a5f',
  headerText: '#ffffff',
  sectionLine: '#1e3a5f',
  bulletColor: '#2c5282',
  skillBg: '#eef3f9',
  skillText: '#1e3a5f',
};

const CHARCOAL: ColorTheme = {
  id: 'charcoal',
  name: 'Charcoal',
  primary: '#2d3748',
  primaryLight: '#f0f1f3',
  primaryText: '#2d3748',
  headerBg: '#2d3748',
  headerText: '#ffffff',
  sectionLine: '#2d3748',
  bulletColor: '#4a5568',
  skillBg: '#f0f1f3',
  skillText: '#2d3748',
};

const SLATE: ColorTheme = {
  id: 'slate',
  name: 'Slate',
  primary: '#475569',
  primaryLight: '#f1f5f9',
  primaryText: '#334155',
  headerBg: '#334155',
  headerText: '#ffffff',
  sectionLine: '#475569',
  bulletColor: '#64748b',
  skillBg: '#f1f5f9',
  skillText: '#334155',
};

const DARK_TEAL: ColorTheme = {
  id: 'dark-teal',
  name: 'Teal',
  primary: '#115e59',
  primaryLight: '#edf7f6',
  primaryText: '#115e59',
  headerBg: '#115e59',
  headerText: '#ffffff',
  sectionLine: '#115e59',
  bulletColor: '#0f766e',
  skillBg: '#edf7f6',
  skillText: '#115e59',
};

const STEEL: ColorTheme = {
  id: 'steel',
  name: 'Steel',
  primary: '#374151',
  primaryLight: '#f3f4f6',
  primaryText: '#1f2937',
  headerBg: '#1f2937',
  headerText: '#ffffff',
  sectionLine: '#374151',
  bulletColor: '#4b5563',
  skillBg: '#f3f4f6',
  skillText: '#1f2937',
};

const WINE: ColorTheme = {
  id: 'wine',
  name: 'Wine',
  primary: '#6b2139',
  primaryLight: '#f9eff2',
  primaryText: '#6b2139',
  headerBg: '#6b2139',
  headerText: '#ffffff',
  sectionLine: '#6b2139',
  bulletColor: '#8b3a55',
  skillBg: '#f9eff2',
  skillText: '#6b2139',
};

const FOREST: ColorTheme = {
  id: 'forest',
  name: 'Forest',
  primary: '#1a4731',
  primaryLight: '#edf5f0',
  primaryText: '#1a4731',
  headerBg: '#1a4731',
  headerText: '#ffffff',
  sectionLine: '#1a4731',
  bulletColor: '#276749',
  skillBg: '#edf5f0',
  skillText: '#1a4731',
};

const BLACK: ColorTheme = {
  id: 'black',
  name: 'Black',
  primary: '#111827',
  primaryLight: '#f3f4f6',
  primaryText: '#111827',
  headerBg: '#111827',
  headerText: '#ffffff',
  sectionLine: '#111827',
  bulletColor: '#374151',
  skillBg: '#f3f4f6',
  skillText: '#111827',
};

/* ─────────────────────────────────────────────
   Resume Templates
   Each has a unique layout + curated colors
   ───────────────────────────────────────────── */

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional top-header layout. Clean lines, maximum ATS compatibility.',
    icon: 'ri-file-text-line',
    atsScore: 5,
    colors: [NAVY, CHARCOAL, SLATE, FOREST],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Left sidebar with contact details. Balanced, contemporary look.',
    icon: 'ri-layout-left-line',
    atsScore: 4,
    colors: [DARK_TEAL, NAVY, CHARCOAL, WINE],
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Bold centered header with accent border. Ideal for senior roles.',
    icon: 'ri-award-line',
    atsScore: 5,
    colors: [CHARCOAL, WINE, NAVY, BLACK],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'No background colors. Ultra-clean black & white with subtle accents.',
    icon: 'ri-subtract-line',
    atsScore: 5,
    colors: [BLACK, SLATE, CHARCOAL, NAVY],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Compact two-column body. Skills sidebar with full experience section.',
    icon: 'ri-layout-right-line',
    atsScore: 4,
    colors: [STEEL, DARK_TEAL, FOREST, WINE],
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Refined serif typography with tasteful accents. Perfect for creative professionals.',
    icon: 'ri-quill-pen-line',
    atsScore: 5,
    colors: [WINE, CHARCOAL, NAVY, FOREST],
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense two-column layout. Fit more content without sacrificing readability.',
    icon: 'ri-layout-grid-line',
    atsScore: 4,
    colors: [CHARCOAL, STEEL, SLATE, DARK_TEAL],
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong typography with oversized name header. Makes a powerful first impression.',
    icon: 'ri-bold',
    atsScore: 5,
    colors: [BLACK, NAVY, CHARCOAL, WINE],
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Visual timeline for experience. Clean dotted connectors show career progression.',
    icon: 'ri-git-commit-line',
    atsScore: 5,
    colors: [DARK_TEAL, NAVY, FOREST, STEEL],
  },
  {
    id: 'clean',
    name: 'Clean',
    description: 'Airy whitespace-driven design. Subtle color accents, ultra-modern feel.',
    icon: 'ri-sparkle-line',
    atsScore: 5,
    colors: [SLATE, CHARCOAL, DARK_TEAL, NAVY],
  },
];

/* Helper: get default theme for a template */
export function getDefaultTheme(templateId: string): ColorTheme {
  const tpl = RESUME_TEMPLATES.find((t) => t.id === templateId);
  return tpl?.colors[0] ?? NAVY;
}

/* Backwards compat export */
export const COLOR_THEMES = [NAVY, CHARCOAL, SLATE, DARK_TEAL, STEEL, WINE, FOREST, BLACK];
