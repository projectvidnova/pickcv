#!/usr/bin/env python3
"""Add DynamicTemplateConfig types to types.ts"""

FILE = "frontend/src/pages/optimized-resume/types.ts"

ADDITION = '''

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
'''

with open(FILE, 'r') as f:
    src = f.read()

if 'DynamicTemplateConfig' in src:
    print("Already has DynamicTemplateConfig, skipping")
else:
    src = src.rstrip() + '\n' + ADDITION
    with open(FILE, 'w') as f:
        f.write(src)
    print("OK: DynamicTemplateConfig types added to types.ts")
