#!/usr/bin/env python3
"""
Phase 2b: Add dynamic template rendering to InlineResumeEditor.tsx
- Add activeDynamicConfig prop
- Add renderDynamicTemplate function
- Wire dynamic config into renderTemplate dispatch
"""
import re

FILE = "frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx"

with open(FILE, "r") as f:
    src = f.read()

original = src
changes = 0

# ═══════════════════════════════════════════════════
# 1. Add DynamicTemplateConfig import
# ═══════════════════════════════════════════════════
old_import = "import { ResumeData, SectionId, ResumeSection, ColorTheme, TemplateId } from '../types';"
new_import = "import { ResumeData, SectionId, ResumeSection, ColorTheme, TemplateId, DynamicTemplateConfig } from '../types';"
if old_import in src:
    src = src.replace(old_import, new_import, 1)
    print("1. Import: patched ✅")
    changes += 1
else:
    print("1. Import: NOT FOUND ✗")

# ═══════════════════════════════════════════════════
# 2. Add activeDynamicConfig to component props
# ═══════════════════════════════════════════════════
old_props = """  onPageCountChange,
}: {
  data: ResumeData;
  onDataChange: (d: ResumeData) => void;
  initialTemplateId?: TemplateId;
  variantId?: string;
  variantRationale?: string;
  onPageCountChange?: (pages: number) => void;
})"""
new_props = """  onPageCountChange,
  activeDynamicConfig,
}: {
  data: ResumeData;
  onDataChange: (d: ResumeData) => void;
  initialTemplateId?: TemplateId;
  variantId?: string;
  variantRationale?: string;
  onPageCountChange?: (pages: number) => void;
  activeDynamicConfig?: DynamicTemplateConfig;
})"""
if old_props in src:
    src = src.replace(old_props, new_props, 1)
    print("2. Props: patched ✅")
    changes += 1
else:
    print("2. Props: NOT FOUND ✗")

# ═══════════════════════════════════════════════════
# 3. Add the renderDynamicTemplate function and wire it into renderTemplate
# ═══════════════════════════════════════════════════

# The renderDynamicTemplate function will be inserted right before renderTemplate
# It reuses existing blocks (ContactRow, SummaryBlock, etc.) but with dynamic config

DYNAMIC_RENDERER = r'''
  /* ═══════════════════════════════════════════════════════════════
     Dynamic Template Renderer — LLM-generated, person-specific config
     Uses same building blocks but driven by DynamicTemplateConfig
     ═══════════════════════════════════════════════════════════════ */
  const renderDynamicTemplate = (dynConfig: DynamicTemplateConfig) => {
    // Build a theme-like object from dynamic color scheme
    const dynTheme = {
      ...theme,
      primary: dynConfig.colorScheme.primary,
      primaryLight: dynConfig.colorScheme.primary + '15',
      primaryText: dynConfig.colorScheme.primary,
      headerBg: dynConfig.colorScheme.headerBg,
      headerText: dynConfig.colorScheme.headerText,
      sectionLine: dynConfig.colorScheme.sectionLine,
      bulletColor: dynConfig.colorScheme.bulletColor,
      skillBg: dynConfig.colorScheme.skillBg,
      skillText: dynConfig.colorScheme.skillText,
    };

    // Resolve font family
    const dynFontFamily = FONT_REGISTRY[dynConfig.fontFamily as keyof typeof FONT_REGISTRY] || FONT_REGISTRY['sans-modern'];
    const dynRhythm = RHYTHM[dynConfig.verticalRhythm as keyof typeof RHYTHM] || RHYTHM['standard'];
    const dynBoldTarget = dynConfig.boldTarget || 'metrics';

    // Apply bullet curation: filter bullets per role based on LLM's selection
    const getCuratedBullets = (roleIndex: number, bullets: string[]): string[] => {
      const strategy = dynConfig.bulletStrategy?.find(bs => bs.roleIndex === roleIndex);
      if (!strategy || !strategy.selectedBullets?.length) return bullets;
      const selected = strategy.selectedBullets
        .filter(i => i >= 0 && i < bullets.length)
        .map(i => bullets[i]);
      return selected.length > 0 ? selected : bullets;
    };

    // Dynamic section title resolver
    const getSectionTitle = (sectionId: SectionId): string => {
      return dynConfig.sectionTitles?.[sectionId] || 
        { summary: 'Summary', experience: 'Experience', skills: 'Skills', education: 'Education' }[sectionId];
    };

    // Dynamic skill grouping
    const DynamicSkillsBlock = () => {
      if (dynConfig.skillsLayout === 'grouped' && dynConfig.skillGroups?.length) {
        return (
          <div style={{ marginBottom: dynRhythm.sectionGap }} data-resume-section="skills">
            <SectionHeading label={getSectionTitle('skills')} icon="ri-tools-line" color={dynTheme.sectionLine} borderColor={dynTheme.sectionLine} style={dynConfig.headingStyle as any} />
            <div className="mt-1.5">
              {dynConfig.skillGroups.map((group, gi) => (
                <div key={gi} className="mb-2">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-50">{group.label}</span>
                  <div className="flex flex-wrap gap-x-1 gap-y-0.5 mt-0.5">
                    {group.skills.map((skill, si) => (
                      <span key={si} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: dynTheme.skillBg, color: dynTheme.skillText }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      return <SkillsBlock headingStyle={dynConfig.headingStyle as any} layout={dynConfig.skillsLayout === 'list' ? 'list' : 'tags'} />;
    };

    // Dynamic achievement bar
    const DynamicAchievementBar = () => {
      if (!dynConfig.showAchievementBar || !dynConfig.achievementBarMetrics?.length) return null;
      return (
        <div className="flex items-center justify-center gap-6 py-2.5 px-6" style={{ backgroundColor: `${dynTheme.primary}08`, borderBottom: `2px solid ${dynTheme.primary}15` }}>
          {dynConfig.achievementBarMetrics.slice(0, 4).map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[13px] font-bold leading-tight" style={{ color: dynTheme.primary }}>{m.value}</span>
              <span className="text-[8px] uppercase tracking-wider font-medium text-gray-400 mt-0.5">{m.label}</span>
            </div>
          ))}
        </div>
      );
    };

    // Dynamic experience block with curated bullets
    const DynamicExperienceBlock = () => (
      <div style={{ marginBottom: dynRhythm.sectionGap }} data-resume-section="experience">
        <SectionHeading label={getSectionTitle('experience')} icon="ri-briefcase-line" color={dynTheme.sectionLine} borderColor={dynTheme.sectionLine} style={dynConfig.headingStyle as any} />
        {data.experience.map((exp, i) => {
          const curatedBullets = getCuratedBullets(i, exp.bullets);
          return (
            <div key={i} data-resume-entry className="relative group/exp" style={{ marginBottom: i < data.experience.length - 1 ? dynRhythm.sectionGap : '0' }}>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <EditableText value={exp.role} onChange={(v) => updateExp(i, 'role', v)} tag="h4" className="text-[12px] font-bold text-gray-900" placeholder="Job Title" />
                  <span className="text-[10px] text-gray-400">at</span>
                  <EditableText value={exp.company} onChange={(v) => updateExp(i, 'company', v)} className={dynBoldTarget === 'company' ? 'text-[12px] font-bold' : 'text-[12px] font-semibold'} style={{ color: dynTheme.bulletColor }} placeholder="Company" />
                </div>
                <EditableText value={exp.period} onChange={(v) => updateExp(i, 'period', v)} className="text-[10px] text-gray-400 whitespace-nowrap ml-3 flex-shrink-0" placeholder="Period" />
              </div>
              <ul className="mt-1.5" style={{ display: "flex", flexDirection: "column", gap: dynRhythm.bulletGap }}>
                {curatedBullets.map((b, j) => (
                  <li key={j} data-resume-bullet className="flex items-start gap-1.5 text-[11px] text-gray-600">
                    <span className="mt-[5px] flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: dynTheme.bulletColor }} />
                    <EditableText value={b} onChange={(v) => updateBullet(i, j, v)} className="flex-1" placeholder="Achievement..." multiline />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );

    // Dynamic summary (optionally rewritten)
    const DynamicSummaryBlock = () => {
      const summaryText = dynConfig.summaryRewrite || data.summary;
      return (
        <div style={{ marginBottom: dynRhythm.sectionGap }} data-resume-section="summary">
          <SectionHeading label={getSectionTitle('summary')} icon="ri-user-line" color={dynTheme.sectionLine} borderColor={dynTheme.sectionLine} style={dynConfig.headingStyle as any} />
          <EditableText value={summaryText} onChange={(v) => update('summary', v)} tag="p" className="text-[11px] leading-[1.65] text-gray-600" placeholder="Write a compelling summary..." multiline />
        </div>
      );
    };

    const DynamicEducationBlock = () => (
      <div style={{ marginBottom: dynRhythm.sectionGap }} data-resume-section="education">
        <SectionHeading label={getSectionTitle('education')} icon="ri-graduation-cap-line" color={dynTheme.sectionLine} borderColor={dynTheme.sectionLine} style={dynConfig.headingStyle as any} />
        <div className="mt-1" style={{ display: "flex", flexDirection: "column", gap: dynRhythm.bulletGap }}>
          {data.education.map((edu, i) => (
            <div key={i} data-resume-entry className="group/edu">
              <div className="flex items-baseline justify-between">
                <EditableText value={edu.degree} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], degree: v }; update('education', ed); }} className="text-[11px] font-semibold text-gray-800" placeholder="Degree" />
                <EditableText value={edu.period} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], period: v }; update('education', ed); }} className="text-[10px] text-gray-400" placeholder="Year" />
              </div>
              <EditableText value={edu.school} onChange={(v) => { const ed = [...data.education]; ed[i] = { ...ed[i], school: v }; update('education', ed); }} className="text-[10px] text-gray-500" placeholder="Institution" />
            </div>
          ))}
        </div>
      </div>
    );

    // Section renderer dispatcher
    const renderDynSection = (sectionId: SectionId) => {
      switch (sectionId) {
        case 'summary': return <DynamicSummaryBlock key="summary" />;
        case 'experience': return <DynamicExperienceBlock key="experience" />;
        case 'skills': return <DynamicSkillsBlock key="skills" />;
        case 'education': return <DynamicEducationBlock key="education" />;
        default: return null;
      }
    };

    const sectionOrder = dynConfig.sectionOrder || ['summary', 'experience', 'skills', 'education'];

    // ─── Layout dispatch based on dynConfig.layout ───
    if (dynConfig.layout === 'sidebar-left') {
      const sidebarIds: SectionId[] = ['skills', 'education'];
      const mainIds = sectionOrder.filter(s => !sidebarIds.includes(s));
      const sideIds = sectionOrder.filter(s => sidebarIds.includes(s));
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden flex" style={{ fontFamily: dynFontFamily }}>
          <div className="w-[190px] flex-shrink-0 px-5 py-6" style={{ backgroundColor: dynTheme.headerBg }}>
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-lg font-bold mb-0.5 leading-tight" style={{ color: dynTheme.headerText }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[10px] font-medium mb-4 opacity-80" style={{ color: dynTheme.headerText }} placeholder="Title" />
            <div className="flex flex-col gap-1.5 text-[9px] mb-5" style={{ color: `${dynTheme.headerText}cc` }}>
              {data.email && <span><i className="ri-mail-line mr-1" />{data.email}</span>}
              {data.phone && <span><i className="ri-phone-line mr-1" />{data.phone}</span>}
              {data.linkedin && <span><i className="ri-linkedin-box-line mr-1" />{data.linkedin}</span>}
              {data.location && <span><i className="ri-map-pin-line mr-1" />{data.location}</span>}
            </div>
            {sideIds.map(s => renderDynSection(s))}
          </div>
          <div className="flex-1 px-6 py-6">
            <DynamicAchievementBar />
            {mainIds.map(s => renderDynSection(s))}
          </div>
        </div>
      );
    }

    if (dynConfig.layout === 'sidebar-right') {
      const sidebarIds: SectionId[] = ['skills', 'education'];
      const mainIds = sectionOrder.filter(s => !sidebarIds.includes(s));
      const sideIds = sectionOrder.filter(s => sidebarIds.includes(s));
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: dynFontFamily }}>
          <div className="px-8 py-5" style={{ backgroundColor: dynTheme.headerBg }}>
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-bold mb-0.5" style={{ color: dynTheme.headerText }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-sm font-medium mb-3 opacity-85" style={{ color: dynTheme.headerText }} placeholder="Title" />
            <ContactRow color={`${dynTheme.headerText}cc`} />
          </div>
          <DynamicAchievementBar />
          <div className="flex">
            <div className="flex-1 px-6 py-6">{mainIds.map(s => renderDynSection(s))}</div>
            <div className="w-[180px] flex-shrink-0 px-4 py-6 border-l" style={{ borderColor: `${dynTheme.primary}15`, backgroundColor: `${dynTheme.primary}04` }}>
              {sideIds.map(s => renderDynSection(s))}
            </div>
          </div>
        </div>
      );
    }

    if (dynConfig.layout === 'centered') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: dynFontFamily }}>
          <div className="h-2" style={{ backgroundColor: dynTheme.primary }} />
          <div className="px-10 pt-6 pb-2 text-center">
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-bold mb-0.5 text-gray-900" placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[11px] text-gray-500 mb-3" placeholder="Title" />
            <ContactRow color="#6b7280" />
          </div>
          <DynamicAchievementBar />
          <div className="px-10 py-5">{sectionOrder.map(s => renderDynSection(s))}</div>
        </div>
      );
    }

    if (dynConfig.layout === 'minimal') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: dynFontFamily }}>
          <div className="px-10 pt-8 pb-3">
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-lg font-bold text-gray-900 mb-0.5" placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[11px] text-gray-500 mb-3" placeholder="Title" />
            <ContactRow color="#6b7280" />
          </div>
          <DynamicAchievementBar />
          <div className="px-10 py-5">{sectionOrder.map(s => renderDynSection(s))}</div>
        </div>
      );
    }

    if (dynConfig.layout === 'bold-bars') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: dynFontFamily }}>
          <div className="px-8 py-5" style={{ backgroundColor: dynTheme.headerBg }}>
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-bold mb-0.5" style={{ color: dynTheme.headerText }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-sm font-medium mb-3 opacity-85" style={{ color: dynTheme.headerText }} placeholder="Title" />
            <ContactRow color={`${dynTheme.headerText}cc`} />
          </div>
          <DynamicAchievementBar />
          <div className="py-5">{sectionOrder.map(s => renderDynSection(s))}</div>
        </div>
      );
    }

    if (dynConfig.layout === 'timeline') {
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: dynFontFamily }}>
          <div className="px-8 py-5" style={{ backgroundColor: dynTheme.headerBg }}>
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-bold mb-0.5" style={{ color: dynTheme.headerText }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-sm font-medium mb-3 opacity-85" style={{ color: dynTheme.headerText }} placeholder="Title" />
            <ContactRow color={`${dynTheme.headerText}cc`} />
          </div>
          <DynamicAchievementBar />
          <div className="px-8 py-6">
            <div className="border-l-2 pl-5 ml-2" style={{ borderColor: `${dynTheme.primary}30` }}>
              {sectionOrder.map(s => renderDynSection(s))}
            </div>
          </div>
        </div>
      );
    }

    if (dynConfig.layout === 'two-col') {
      const leftIds = sectionOrder.filter(s => s === 'experience' || s === 'summary');
      const rightIds = sectionOrder.filter(s => s === 'skills' || s === 'education');
      return (
        <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: dynFontFamily }}>
          <div className="px-6 py-4" style={{ backgroundColor: dynTheme.headerBg }}>
            <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-lg font-bold mb-0.5" style={{ color: dynTheme.headerText }} placeholder="Your Name" />
            <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-[10px] font-medium opacity-85 mb-2" style={{ color: dynTheme.headerText }} placeholder="Title" />
            <ContactRow color={`${dynTheme.headerText}cc`} />
          </div>
          <DynamicAchievementBar />
          <div className="flex">
            <div className="flex-1 px-5 py-5">{leftIds.map(s => renderDynSection(s))}</div>
            <div className="w-[210px] flex-shrink-0 px-4 py-5 border-l" style={{ borderColor: `${dynTheme.primary}10` }}>
              {rightIds.map(s => renderDynSection(s))}
            </div>
          </div>
        </div>
      );
    }

    // Default: header-single layout
    return (
      <div ref={resumeRef} className="w-[612px] bg-white shadow-2xl rounded-sm overflow-hidden" style={{ fontFamily: dynFontFamily, '--section-gap': dynRhythm.sectionGap, '--bullet-gap': dynRhythm.bulletGap, '--header-pad': dynRhythm.headerPad } as React.CSSProperties}>
        <div className="px-8 py-5" style={{ backgroundColor: dynTheme.headerBg }}>
          <EditableText value={data.name} onChange={(v) => update('name', v)} tag="h1" className="text-xl font-bold mb-0.5" style={{ color: dynTheme.headerText }} placeholder="Your Name" />
          <EditableText value={data.title} onChange={(v) => update('title', v)} tag="p" className="text-sm font-medium mb-3 opacity-85" style={{ color: dynTheme.headerText }} placeholder="Title" />
          <ContactRow color={`${dynTheme.headerText}cc`} />
        </div>
        <DynamicAchievementBar />
        <div className="px-8 py-6">{sectionOrder.map(s => renderDynSection(s))}</div>
      </div>
    );
  };

'''

# Insert renderDynamicTemplate right before renderTemplate
marker = "  const renderTemplate = () => {"
if marker in src:
    src = src.replace(marker, DYNAMIC_RENDERER + marker, 1)
    print("3. renderDynamicTemplate: inserted ✅")
    changes += 1
else:
    print("3. renderDynamicTemplate: MARKER NOT FOUND ✗")

# ═══════════════════════════════════════════════════
# 4. Wire dynamic config into the render call site
# ═══════════════════════════════════════════════════
old_render_call = "            {renderTemplate()}"
new_render_call = "            {activeDynamicConfig ? renderDynamicTemplate(activeDynamicConfig) : renderTemplate()}"
if old_render_call in src:
    src = src.replace(old_render_call, new_render_call, 1)
    print("4. Render call site: patched ✅")
    changes += 1
else:
    print("4. Render call site: NOT FOUND ✗")

# ═══════════════════════════════════════════════════
# Write
# ═══════════════════════════════════════════════════
if changes > 0:
    with open(FILE, "w") as f:
        f.write(src)
    print(f"\nDone: {changes} changes applied")
else:
    print("\n!! No changes made")
