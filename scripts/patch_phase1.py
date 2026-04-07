import sys

filepath = 'frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old = '''  interface LayoutConfig {
    layout: LayoutType;
    headingStyle: HeadingStyle;
    skillLayout: SkillLayout;
    font: 'sans' | 'serif';
    sidebarSections?: SectionId[];
  }

  const FONT_SANS = "'Inter', 'Segoe UI', system-ui, sans-serif";
  const FONT_SERIF = "'Georgia', 'Times New Roman', serif";'''

new = '''  type FontFamily = 'sans-modern' | 'sans-clean' | 'serif-prestigious' | 'serif-executive' | 'tech-mono' | 'sans-display';
  type VerticalRhythm = 'tight' | 'standard' | 'generous' | 'very-generous';
  type BoldTarget = 'stack' | 'metrics' | 'company' | 'scale' | 'skills' | 'none';

  interface LayoutConfig {
    layout: LayoutType;
    headingStyle: HeadingStyle;
    skillLayout: SkillLayout;
    font: 'sans' | 'serif';
    fontFamily?: FontFamily;
    verticalRhythm?: VerticalRhythm;
    boldTarget?: BoldTarget;
    sidebarSections?: SectionId[];
  }

  /* -- Font Registry (Spec Table 2: Typographic Personas) -- */
  const FONT_REGISTRY: Record<FontFamily, string> = {
    'sans-modern':       "'Inter', 'Segoe UI', system-ui, sans-serif",
    'sans-clean':        "'Lato', 'Segoe UI', system-ui, sans-serif",
    'serif-prestigious': "'Merriweather', 'Georgia', 'Times New Roman', serif",
    'serif-executive':   "'Playfair Display', 'Georgia', serif",
    'tech-mono':         "'Source Code Pro', 'Consolas', 'Monaco', monospace",
    'sans-display':      "'Montserrat', 'Inter', system-ui, sans-serif",
  };
  const FONT_SANS = FONT_REGISTRY['sans-modern'];
  const FONT_SERIF = FONT_REGISTRY['serif-prestigious'];

  /* -- Vertical Rhythm Tokens (section gap) -- */
  const RHYTHM: Record<VerticalRhythm, { sectionGap: string; bulletGap: string; headerPad: string }> = {
    'tight':         { sectionGap: '12px', bulletGap: '2px', headerPad: '16px' },
    'standard':      { sectionGap: '16px', bulletGap: '4px', headerPad: '20px' },
    'generous':      { sectionGap: '22px', bulletGap: '6px', headerPad: '24px' },
    'very-generous': { sectionGap: '28px', bulletGap: '8px', headerPad: '28px' },
  };'''

if old in content:
    content = content.replace(old, new, 1)
    with open(filepath, 'w') as f:
        f.write(content)
    print("SUCCESS: LayoutConfig + fonts replaced")
else:
    print("FAILED: old string not found")
    idx = content.find('interface LayoutConfig')
    if idx >= 0:
        print(f"Found at char {idx}")
        print(repr(content[idx:idx+300]))
    else:
        print("interface LayoutConfig not in file!")
