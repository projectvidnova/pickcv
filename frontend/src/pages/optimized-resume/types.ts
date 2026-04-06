
export interface ExperienceItem {
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface EducationItem {
  degree: string;
  school: string;
  period: string;
}

export interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  summary: string;
  experience: ExperienceItem[];
  skills: string[];
  education: EducationItem[];
}

export type SectionId = 'summary' | 'experience' | 'skills' | 'education';

export interface ResumeSection {
  id: SectionId;
  label: string;
  icon: string;
  visible: boolean;
}

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;       /* main accent — headers, section lines */
  primaryLight: string;   /* lighter tint — skill badges bg, subtle bg */
  primaryText: string;    /* text on primaryLight bg */
  headerBg: string;       /* header background */
  headerText: string;     /* header text color */
  sectionLine: string;    /* section heading underline */
  bulletColor: string;    /* bullet dots / timeline */
  skillBg: string;        /* skill tag background */
  skillText: string;      /* skill tag text */
}

export type TemplateId = string;

export type VariantId = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8' | 'V9' | 'V10';

export interface ResumeTemplate {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  atsScore: number;       /* 1-5 ATS friendliness rating */
  colors: ColorTheme[];   /* available color palettes for this template */
}

export interface VariantMeta {
  id: VariantId;
  name: string;
  focus: string;
  tagline: string;           /* short human-readable reason for choosing this variant */
  templates: ResumeTemplate[];  /* 5 visual templates designed for this variant */
}


/* ── Dynamic Template Configuration (LLM-generated, person-specific) ── */
export type LayoutType = 'header-single' | 'sidebar-left' | 'sidebar-right' | 'centered' | 'minimal' | 'bold-bars' | 'timeline' | 'two-col';
export type HeadingStyle = 'underline' | 'pill' | 'side' | 'caps';
export type FontFamily = 'sans-modern' | 'sans-clean' | 'serif-prestigious' | 'serif-executive' | 'tech-mono' | 'sans-display';
export type VerticalRhythm = 'tight' | 'standard' | 'generous' | 'very-generous';
export type BoldTarget = 'stack' | 'metrics' | 'company' | 'scale' | 'skills' | 'none';
export type SkillsLayoutType = 'tags' | 'list' | 'grouped';
export type PersonaAngle = 'depth' | 'impact' | 'narrative' | 'breadth';

export interface DynamicColorScheme {
  primary: string;
  accent: string;
  headerBg: string;
  headerText: string;
  sectionLine: string;
  bulletColor: string;
  skillBg: string;
  skillText: string;
}

export interface BulletStrategyItem {
  roleIndex: number;
  selectedBullets: number[];
  maxBullets: number;
}

export interface SkillGroup {
  label: string;
  skills: string[];
}

export interface AchievementBarMetric {
  value: string;
  label: string;
}

export interface DynamicTemplateConfig {
  templateName: string;
  templateTagline: string;
  layout: LayoutType;
  headingStyle: HeadingStyle;
  fontFamily: FontFamily;
  verticalRhythm: VerticalRhythm;
  boldTarget: BoldTarget;
  colorScheme: DynamicColorScheme;
  sectionOrder: SectionId[];
  sectionTitles: Record<SectionId, string>;
  highlightedMetrics: string[];
  bulletStrategy: BulletStrategyItem[];
  summaryRewrite: string | null;
  skillsLayout: SkillsLayoutType;
  skillGroups: SkillGroup[] | null;
  showAchievementBar: boolean;
  achievementBarMetrics: AchievementBarMetric[];
  _meta?: {
    slot: number;
    persona: string;
    variant: string;
    dynamic: boolean;
    fallback?: boolean;
  };
}
