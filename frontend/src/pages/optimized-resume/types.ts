
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

export type TemplateId = 'classic' | 'modern' | 'executive' | 'minimal' | 'professional' | 'elegant' | 'compact' | 'bold' | 'timeline' | 'clean';

export interface ResumeTemplate {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  atsScore: number;       /* 1-5 ATS friendliness rating */
  colors: ColorTheme[];   /* available color palettes for this template */
}
