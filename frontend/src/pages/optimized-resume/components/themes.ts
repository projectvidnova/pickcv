import { ColorTheme, ResumeTemplate, VariantMeta, VariantId } from '../types';

/* ─────────────────────────────────────────────
   ATS-friendly color palettes
   ───────────────────────────────────────────── */

const NAVY: ColorTheme = { id: 'navy', name: 'Navy', primary: '#1e3a5f', primaryLight: '#eef3f9', primaryText: '#1e3a5f', headerBg: '#1e3a5f', headerText: '#ffffff', sectionLine: '#1e3a5f', bulletColor: '#2c5282', skillBg: '#eef3f9', skillText: '#1e3a5f' };
const CHARCOAL: ColorTheme = { id: 'charcoal', name: 'Charcoal', primary: '#2d3748', primaryLight: '#f0f1f3', primaryText: '#2d3748', headerBg: '#2d3748', headerText: '#ffffff', sectionLine: '#2d3748', bulletColor: '#4a5568', skillBg: '#f0f1f3', skillText: '#2d3748' };
const SLATE: ColorTheme = { id: 'slate', name: 'Slate', primary: '#475569', primaryLight: '#f1f5f9', primaryText: '#334155', headerBg: '#334155', headerText: '#ffffff', sectionLine: '#475569', bulletColor: '#64748b', skillBg: '#f1f5f9', skillText: '#334155' };
const DARK_TEAL: ColorTheme = { id: 'dark-teal', name: 'Teal', primary: '#115e59', primaryLight: '#edf7f6', primaryText: '#115e59', headerBg: '#115e59', headerText: '#ffffff', sectionLine: '#115e59', bulletColor: '#0f766e', skillBg: '#edf7f6', skillText: '#115e59' };
const STEEL: ColorTheme = { id: 'steel', name: 'Steel', primary: '#374151', primaryLight: '#f3f4f6', primaryText: '#1f2937', headerBg: '#1f2937', headerText: '#ffffff', sectionLine: '#374151', bulletColor: '#4b5563', skillBg: '#f3f4f6', skillText: '#1f2937' };
const WINE: ColorTheme = { id: 'wine', name: 'Wine', primary: '#6b2139', primaryLight: '#f9eff2', primaryText: '#6b2139', headerBg: '#6b2139', headerText: '#ffffff', sectionLine: '#6b2139', bulletColor: '#8b3a55', skillBg: '#f9eff2', skillText: '#6b2139' };
const FOREST: ColorTheme = { id: 'forest', name: 'Forest', primary: '#1a4731', primaryLight: '#edf5f0', primaryText: '#1a4731', headerBg: '#1a4731', headerText: '#ffffff', sectionLine: '#1a4731', bulletColor: '#276749', skillBg: '#edf5f0', skillText: '#1a4731' };
const BLACK: ColorTheme = { id: 'black', name: 'Black', primary: '#111827', primaryLight: '#f3f4f6', primaryText: '#111827', headerBg: '#111827', headerText: '#ffffff', sectionLine: '#111827', bulletColor: '#374151', skillBg: '#f3f4f6', skillText: '#111827' };
const COPPER: ColorTheme = { id: 'copper', name: 'Copper', primary: '#7c4a1e', primaryLight: '#fdf4ed', primaryText: '#7c4a1e', headerBg: '#7c4a1e', headerText: '#ffffff', sectionLine: '#7c4a1e', bulletColor: '#a16232', skillBg: '#fdf4ed', skillText: '#7c4a1e' };

/* ──────────────────────────────────────────────────────────
   VARIANT TEMPLATE REGISTRY
   Each variant gets 5 unique visual templates tailored to
   its signal emphasis and audience expectations.
   ────────────────────────────────────────────────────────── */

export const VARIANT_REGISTRY: Record<VariantId, VariantMeta> = {

  /* ─── V1: Signal Stack — Tech Depth ─── */
  V1: {
    id: 'V1', name: 'The Signal Stack', focus: 'tech_depth',
    tagline: 'Optimized for technical roles — skills & tools front and center',
    templates: [
      { id: 'v1-stack-first', name: 'Stack First', description: 'Skills grid header with prominent tech stack, experience below', icon: 'ri-stack-line', atsScore: 5, colors: [DARK_TEAL, NAVY, CHARCOAL] },
      { id: 'v1-dev-card', name: 'Dev Card', description: 'Developer-style layout with monospace accents and code-block skills', icon: 'ri-terminal-box-line', atsScore: 5, colors: [CHARCOAL, SLATE, BLACK] },
      { id: 'v1-tech-grid', name: 'Tech Grid', description: 'Three-column skills matrix at top, compact experience below', icon: 'ri-grid-line', atsScore: 4, colors: [NAVY, DARK_TEAL, STEEL] },
      { id: 'v1-system-arch', name: 'System Arch', description: 'Left tech sidebar with tool tags, right experience body', icon: 'ri-layout-left-line', atsScore: 4, colors: [SLATE, CHARCOAL, DARK_TEAL] },
      { id: 'v1-terminal', name: 'Terminal Pro', description: 'Clean monospace-inspired layout, arrow bullets, tech precision', icon: 'ri-code-s-slash-line', atsScore: 5, colors: [BLACK, CHARCOAL, NAVY] },
    ],
  },

  /* ─── V2: Outcome Ledger — Business Outcomes ─── */
  V2: {
    id: 'V2', name: 'The Outcome Ledger', focus: 'business_outcomes',
    tagline: 'Optimized for results-driven roles — metrics & impact highlighted',
    templates: [
      { id: 'v2-metric-hero', name: 'Metric Hero', description: 'Large metric callouts in header, numbers in bold throughout', icon: 'ri-bar-chart-2-line', atsScore: 5, colors: [NAVY, CHARCOAL, DARK_TEAL] },
      { id: 'v2-impact-first', name: 'Impact First', description: 'Summary with embedded KPIs, numbered achievements highlighted', icon: 'ri-funds-line', atsScore: 5, colors: [DARK_TEAL, WINE, NAVY] },
      { id: 'v2-results-dash', name: 'Results Dash', description: 'Dashboard-style metrics row at top, clean experience below', icon: 'ri-dashboard-line', atsScore: 5, colors: [CHARCOAL, STEEL, SLATE] },
      { id: 'v2-board-ready', name: 'Board Ready', description: 'Executive summary with key metrics, formal serif layout', icon: 'ri-presentation-line', atsScore: 5, colors: [WINE, CHARCOAL, NAVY] },
      { id: 'v2-numbers-lead', name: 'Numbers Lead', description: 'Numbers pulled as aside annotations next to each role', icon: 'ri-number-1', atsScore: 5, colors: [STEEL, DARK_TEAL, CHARCOAL] },
    ],
  },

  /* ─── V3: Authority Frame — Enterprise Process ─── */
  V3: {
    id: 'V3', name: 'The Authority Frame', focus: 'enterprise_process',
    tagline: 'Optimized for enterprise roles — formal structure & certifications prominent',
    templates: [
      { id: 'v3-corporate', name: 'Corporate Classic', description: 'Formal gray header, structured sections, certification badges', icon: 'ri-building-2-line', atsScore: 5, colors: [CHARCOAL, SLATE, NAVY] },
      { id: 'v3-governance', name: 'Governance Pro', description: 'Official look with heavy borders, certs & tools prominent', icon: 'ri-shield-check-line', atsScore: 5, colors: [NAVY, CHARCOAL, STEEL] },
      { id: 'v3-enterprise', name: 'Enterprise Std', description: 'Conservative single-column with strong section separators', icon: 'ri-file-list-3-line', atsScore: 5, colors: [STEEL, CHARCOAL, SLATE] },
      { id: 'v3-process', name: 'Process Frame', description: 'Structured layout with process indicators, formal serif', icon: 'ri-flow-chart', atsScore: 5, colors: [SLATE, NAVY, FOREST] },
      { id: 'v3-compliance', name: 'ATS Maximum', description: 'Ultra-ATS-safe layout, zero graphics, maximum parsability', icon: 'ri-robot-line', atsScore: 5, colors: [BLACK, CHARCOAL, SLATE] },
    ],
  },

  /* ─── V4: Leadership Thesis — Senior Leadership ─── */
  V4: {
    id: 'V4', name: 'The Leadership Thesis', focus: 'senior_leadership',
    tagline: 'Optimized for leadership roles — executive presence & strategic impact',
    templates: [
      { id: 'v4-exec-brief', name: 'Executive Brief', description: 'Bold executive summary with team/revenue markers', icon: 'ri-user-star-line', atsScore: 5, colors: [CHARCOAL, NAVY, BLACK] },
      { id: 'v4-leadership', name: 'Leadership First', description: 'Oversized name, strategic summary, impact metrics prominent', icon: 'ri-team-line', atsScore: 5, colors: [NAVY, WINE, CHARCOAL] },
      { id: 'v4-csuite', name: 'C-Suite Pro', description: 'Dark formal header, competencies grid, filtered experience', icon: 'ri-briefcase-4-line', atsScore: 5, colors: [BLACK, CHARCOAL, WINE] },
      { id: 'v4-strategy', name: 'Strategy Map', description: 'Summary with strategic pillars, org-level impact experience', icon: 'ri-mind-map', atsScore: 5, colors: [WINE, NAVY, CHARCOAL] },
      { id: 'v4-board-deck', name: 'Board Deck', description: 'Presentation-style, large typography, achievement cards', icon: 'ri-slideshow-line', atsScore: 5, colors: [SLATE, CHARCOAL, NAVY] },
    ],
  },

  /* ─── V5: Proof Sheet — Research / Academic ─── */
  V5: {
    id: 'V5', name: 'The Proof Sheet', focus: 'research_proof',
    tagline: 'Optimized for research & academic roles — evidence & methodology first',
    templates: [
      { id: 'v5-academic', name: 'Academic Pro', description: 'Research interests header, publications section, clean serif', icon: 'ri-book-open-line', atsScore: 5, colors: [NAVY, CHARCOAL, FOREST] },
      { id: 'v5-method', name: 'Method First', description: 'Methodology highlighted, baseline→result bullet formatting', icon: 'ri-flask-line', atsScore: 5, colors: [DARK_TEAL, NAVY, SLATE] },
      { id: 'v5-paper', name: 'Paper Trail', description: 'Publication-focused with citation styling, clean academic feel', icon: 'ri-article-line', atsScore: 5, colors: [CHARCOAL, SLATE, NAVY] },
      { id: 'v5-lab', name: 'Lab Notebook', description: 'Data-first layout with experiment-style bullet formatting', icon: 'ri-test-tube-line', atsScore: 5, colors: [SLATE, DARK_TEAL, CHARCOAL] },
      { id: 'v5-scholar', name: 'Scholar View', description: 'Education prominent, publications list, research focus', icon: 'ri-graduation-cap-line', atsScore: 5, colors: [FOREST, NAVY, CHARCOAL] },
    ],
  },

  /* ─── V6: Problem-Solver — Ops / Consulting ─── */
  V6: {
    id: 'V6', name: 'The Problem-Solver', focus: 'ops_consulting',
    tagline: 'Optimized for operations & consulting — structured problem→solution→result',
    templates: [
      { id: 'v6-case-study', name: 'Case Study', description: 'SAR-formatted experience with competency matrix sidebar', icon: 'ri-survey-line', atsScore: 5, colors: [NAVY, CHARCOAL, STEEL] },
      { id: 'v6-consultant', name: 'Consultant Deck', description: 'Clean modern with problem/solution pairs highlighted', icon: 'ri-lightbulb-line', atsScore: 5, colors: [CHARCOAL, DARK_TEAL, NAVY] },
      { id: 'v6-matrix', name: 'Matrix Pro', description: 'Competency grid at top, problem-solving experience below', icon: 'ri-table-line', atsScore: 5, colors: [STEEL, SLATE, CHARCOAL] },
      { id: 'v6-sar', name: 'SAR Layout', description: 'Explicit Situation/Action/Result structured bullet sections', icon: 'ri-list-ordered', atsScore: 5, colors: [DARK_TEAL, NAVY, CHARCOAL] },
      { id: 'v6-process-flow', name: 'Process Flow', description: 'Timeline connectors between sections, clean structure', icon: 'ri-git-commit-line', atsScore: 5, colors: [SLATE, CHARCOAL, DARK_TEAL] },
    ],
  },

  /* ─── V7: Portfolio Lead — Design ─── */
  V7: {
    id: 'V7', name: 'The Portfolio Lead', focus: 'design_portfolio',
    tagline: 'Optimized for design roles — portfolio prominent, process-led layout',
    templates: [
      { id: 'v7-portfolio-hero', name: 'Portfolio Hero', description: 'Large portfolio URL at top, case study cards, creative spacing', icon: 'ri-palette-line', atsScore: 4, colors: [SLATE, CHARCOAL, COPPER] },
      { id: 'v7-case-gallery', name: 'Case Gallery', description: 'Case study format with before/after framing, clean modern', icon: 'ri-gallery-line', atsScore: 4, colors: [CHARCOAL, NAVY, SLATE] },
      { id: 'v7-design-process', name: 'Design Process', description: 'Process-driven layout with tool icons and visual hierarchy', icon: 'ri-pencil-ruler-2-line', atsScore: 4, colors: [DARK_TEAL, CHARCOAL, WINE] },
      { id: 'v7-creative-min', name: 'Creative Minimal', description: 'Generous whitespace, refined typography, subtle accents', icon: 'ri-contrast-2-line', atsScore: 5, colors: [BLACK, SLATE, CHARCOAL] },
      { id: 'v7-studio', name: 'Studio Clean', description: 'Art-directed minimal, portfolio link prominent, tool pills', icon: 'ri-brush-line', atsScore: 5, colors: [COPPER, CHARCOAL, NAVY] },
    ],
  },

  /* ─── V8: Versatility Map — Generalist ─── */
  V8: {
    id: 'V8', name: 'The Versatility Map', focus: 'generalist_breadth',
    tagline: 'Optimized for generalist roles — cross-functional breadth & adaptability',
    templates: [
      { id: 'v8-flexi-grid', name: 'Flexi Grid', description: 'Multi-column skills showcase, diverse experience categories', icon: 'ri-layout-grid-line', atsScore: 4, colors: [CHARCOAL, DARK_TEAL, NAVY] },
      { id: 'v8-cross-func', name: 'Cross Func', description: 'Skills mapped to functions, breadth markers in experience', icon: 'ri-swap-line', atsScore: 5, colors: [NAVY, STEEL, CHARCOAL] },
      { id: 'v8-adaptive', name: 'Adaptive Layout', description: 'Clean equal-weight sections, balanced skills and experience', icon: 'ri-equalizer-line', atsScore: 5, colors: [STEEL, CHARCOAL, DARK_TEAL] },
      { id: 'v8-breadth', name: 'Breadth First', description: 'Skills categories at top, compact varied experience below', icon: 'ri-apps-2-line', atsScore: 5, colors: [DARK_TEAL, NAVY, SLATE] },
      { id: 'v8-hybrid', name: 'Hybrid Clean', description: 'Balanced two-column with skills and experience side by side', icon: 'ri-layout-right-line', atsScore: 4, colors: [SLATE, CHARCOAL, FOREST] },
    ],
  },

  /* ─── V9: Domain Expert — Deep Specialist ─── */
  V9: {
    id: 'V9', name: 'The Domain Expert', focus: 'deep_specialist',
    tagline: 'Optimized for specialist roles — domain authority & deep credentials',
    templates: [
      { id: 'v9-authority', name: 'Authority Brief', description: 'Domain summary header, credentials prominent, deep experience', icon: 'ri-award-line', atsScore: 5, colors: [NAVY, CHARCOAL, WINE] },
      { id: 'v9-specialist', name: 'Specialist View', description: 'Single-domain focused, sequential depth of experience', icon: 'ri-focus-3-line', atsScore: 5, colors: [CHARCOAL, NAVY, STEEL] },
      { id: 'v9-credential', name: 'Credential First', description: 'Certifications/credentials hero, followed by experience', icon: 'ri-medal-line', atsScore: 5, colors: [WINE, CHARCOAL, NAVY] },
      { id: 'v9-industry', name: 'Industry Standard', description: 'Conservative domain-specific layout, formal structure', icon: 'ri-building-line', atsScore: 5, colors: [STEEL, SLATE, CHARCOAL] },
      { id: 'v9-expert', name: 'Expert Profile', description: 'Profile-style with domain expertise sidebar, experience depth', icon: 'ri-user-settings-line', atsScore: 4, colors: [FOREST, NAVY, CHARCOAL] },
    ],
  },

  /* ─── V10: Transition Narrative — Career Change ─── */
  V10: {
    id: 'V10', name: 'The Transition Narrative', focus: 'career_transition',
    tagline: 'Optimized for career changers — forward-looking with transferable skills bridge',
    templates: [
      { id: 'v10-pivot-bridge', name: 'Pivot Bridge', description: 'Transition summary hero, transferable skills prominently bridged', icon: 'ri-route-line', atsScore: 5, colors: [DARK_TEAL, NAVY, CHARCOAL] },
      { id: 'v10-new-chapter', name: 'New Chapter', description: 'Forward-looking header, relevant experience grouped, skills mapped', icon: 'ri-book-mark-line', atsScore: 5, colors: [NAVY, CHARCOAL, DARK_TEAL] },
      { id: 'v10-transfer', name: 'Transfer Map', description: 'Skills mapping with relevant projects highlighted prominently', icon: 'ri-arrow-left-right-line', atsScore: 5, colors: [CHARCOAL, STEEL, NAVY] },
      { id: 'v10-fresh-start', name: 'Fresh Start', description: 'Clean modern, de-emphasized dates, skills-first approach', icon: 'ri-seedling-line', atsScore: 5, colors: [FOREST, DARK_TEAL, CHARCOAL] },
      { id: 'v10-narrative', name: 'Narrative Flow', description: 'Story-driven layout, forward focus, career arc emphasis', icon: 'ri-quill-pen-line', atsScore: 5, colors: [SLATE, NAVY, CHARCOAL] },
    ],
  },
};

/* ── Helpers ── */
export function getVariantTemplates(variantId: string): ResumeTemplate[] {
  const v = VARIANT_REGISTRY[variantId as VariantId];
  return v?.templates ?? VARIANT_REGISTRY.V1.templates;
}

export function getVariantMeta(variantId: string): VariantMeta {
  return VARIANT_REGISTRY[variantId as VariantId] ?? VARIANT_REGISTRY.V1;
}

export function getDefaultTheme(templateId: string): ColorTheme {
  for (const variant of Object.values(VARIANT_REGISTRY)) {
    const tpl = variant.templates.find((t) => t.id === templateId);
    if (tpl) return tpl.colors[0];
  }
  return NAVY;
}

export const RESUME_TEMPLATES: ResumeTemplate[] = Object.values(VARIANT_REGISTRY).flatMap((v) => v.templates);
export const COLOR_THEMES = [NAVY, CHARCOAL, SLATE, DARK_TEAL, STEEL, WINE, FOREST, BLACK, COPPER];
