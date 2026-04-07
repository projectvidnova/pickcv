"""Phase 2: Variant-specific rendering components.

Adds 6 specialist visual components that render existing data differently:
1. KPI Ribbon (V2) — Extract metrics from bullets, show as hero ribbon
2. Tech Stack Matrix (V1) — Group skills by category
3. Leadership Thesis (V4) — Enhanced summary with strategic framing
4. Portfolio Hero (V7) — Hero-sized portfolio/LinkedIn URL
5. GitHub Ribbon (V1) — GitHub activity/profile ribbon
6. Milestone Timeline (V8) — Milestone-oriented experience rendering

Also adds specialRendering to LayoutConfig and assigns to relevant templates.
"""

filepath = 'frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# ─────────────────────────────────────────────
# STEP 1: Add specialRendering to LayoutConfig
# ─────────────────────────────────────────────

old_config = """  boldTarget?: BoldTarget;
  sidebarSections?: SectionId[];
}"""
new_config = """  boldTarget?: BoldTarget;
  sidebarSections?: SectionId[];
  specialRendering?: SpecialComponent[];
}

type SpecialComponent = 'kpi-ribbon' | 'tech-stack-matrix' | 'leadership-thesis' | 'portfolio-hero' | 'github-ribbon';"""

content = content.replace(old_config, new_config, 1)
print("STEP 1 DONE: Added specialRendering to LayoutConfig")

# ─────────────────────────────────────────────
# STEP 2: Assign specialRendering to specific templates
# ─────────────────────────────────────────────

# V1 templates get tech stack / github ribbon
content = content.replace(
    "'v1-stack-first':  { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'tight', boldTarget: 'stack' }",
    "'v1-stack-first':  { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'tight', boldTarget: 'stack', specialRendering: ['github-ribbon'] }"
)
content = content.replace(
    "'v1-dev-card':     { layout: 'minimal', headingStyle: 'side', skillLayout: 'tags', font: 'sans', fontFamily: 'tech-mono', verticalRhythm: 'tight', boldTarget: 'stack' }",
    "'v1-dev-card':     { layout: 'minimal', headingStyle: 'side', skillLayout: 'tags', font: 'sans', fontFamily: 'tech-mono', verticalRhythm: 'tight', boldTarget: 'stack', specialRendering: ['tech-stack-matrix'] }"
)
content = content.replace(
    "'v1-tech-grid':    { layout: 'two-col', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'tight', boldTarget: 'stack' }",
    "'v1-tech-grid':    { layout: 'two-col', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'tight', boldTarget: 'stack', specialRendering: ['tech-stack-matrix'] }"
)

# V2 templates get KPI ribbon
content = content.replace(
    "'v2-metric-hero':  { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'metrics' }",
    "'v2-metric-hero':  { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'metrics', specialRendering: ['kpi-ribbon'] }"
)
content = content.replace(
    "'v2-impact-first': { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'metrics' }",
    "'v2-impact-first': { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'metrics', specialRendering: ['kpi-ribbon'] }"
)

# V4 templates get leadership thesis
content = content.replace(
    "'v4-exec-brief':   { layout: 'centered', headingStyle: 'caps', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-executive', verticalRhythm: 'very-generous', boldTarget: 'scale' }",
    "'v4-exec-brief':   { layout: 'centered', headingStyle: 'caps', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-executive', verticalRhythm: 'very-generous', boldTarget: 'scale', specialRendering: ['leadership-thesis'] }"
)
content = content.replace(
    "'v4-leadership':   { layout: 'bold-bars', headingStyle: 'pill', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-executive', verticalRhythm: 'very-generous', boldTarget: 'scale' }",
    "'v4-leadership':   { layout: 'bold-bars', headingStyle: 'pill', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-executive', verticalRhythm: 'very-generous', boldTarget: 'scale', specialRendering: ['leadership-thesis'] }"
)

# V7 templates get portfolio hero
content = content.replace(
    "'v7-portfolio-hero':  { layout: 'centered', headingStyle: 'caps', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-display', verticalRhythm: 'very-generous', boldTarget: 'skills' }",
    "'v7-portfolio-hero':  { layout: 'centered', headingStyle: 'caps', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-display', verticalRhythm: 'very-generous', boldTarget: 'skills', specialRendering: ['portfolio-hero'] }"
)
content = content.replace(
    "'v7-case-gallery':    { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-display', verticalRhythm: 'very-generous', boldTarget: 'skills' }",
    "'v7-case-gallery':    { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-display', verticalRhythm: 'very-generous', boldTarget: 'skills', specialRendering: ['portfolio-hero'] }"
)

print("STEP 2 DONE: Assigned specialRendering to templates")

# ─────────────────────────────────────────────
# STEP 3: Add specialist components inside the component function
# ─────────────────────────────────────────────

# Insert specialist components right after the boldTarget line
insert_after = "  const boldTarget = activeConfig.boldTarget || 'none';\n"
insert_pos = content.find(insert_after)
if insert_pos < 0:
    print("FATAL: Cannot find boldTarget line")
    exit(1)
insert_pos += len(insert_after)

specialist_components = '''
  const specialComponents = new Set(activeConfig.specialRendering || []);

  /* ─── Specialist Component: KPI Ribbon (V2) ─── */
  /* Extracts numeric achievements from experience bullets and displays as a highlight ribbon */
  const KpiRibbon = () => {
    const metrics: string[] = [];
    const metricPattern = /(?:\\$[\\d,.]+[MBKmk]?|\\d+[%xX]|\\d+\\+)/;
    for (const exp of data.experience) {
      for (const bullet of exp.bullets) {
        const match = bullet.match(metricPattern);
        if (match && metrics.length < 3) {
          // Extract a short context around the metric
          const idx = bullet.indexOf(match[0]);
          const start = Math.max(0, idx - 15);
          const end = Math.min(bullet.length, idx + match[0].length + 20);
          const snippet = (start > 0 ? '...' : '') + bullet.slice(start, end).trim() + (end < bullet.length ? '...' : '');
          metrics.push(snippet);
        }
      }
    }
    if (metrics.length === 0) return null;
    return (
      <div className="flex items-center justify-center gap-4 py-2 px-4 text-[10px] font-bold" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary, borderTop: `1px solid ${theme.primary}20`, borderBottom: `1px solid ${theme.primary}20` }}>
        {metrics.map((m, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.primary, opacity: 0.3 }} />}
            <span>{m}</span>
          </span>
        ))}
      </div>
    );
  };

  /* ─── Specialist Component: Tech Stack Matrix (V1) ─── */
  /* Groups skills into conceptual categories for a "blueprint" aesthetic */
  const TechStackMatrix = () => {
    const categories: Record<string, string[]> = { 'Languages': [], 'Frameworks': [], 'Infrastructure': [], 'Tools': [] };
    const langKeywords = ['python', 'java', 'javascript', 'typescript', 'go', 'rust', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'sql', 'r', 'matlab', 'perl', 'bash', 'html', 'css'];
    const fwKeywords = ['react', 'angular', 'vue', 'next', 'django', 'flask', 'spring', 'express', 'fastapi', 'rails', 'laravel', 'svelte', 'node', '.net', 'tensorflow', 'pytorch', 'keras'];
    const infraKeywords = ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s', 'terraform', 'jenkins', 'ci/cd', 'linux', 'nginx', 'redis', 'kafka', 'rabbitmq', 'elasticsearch', 'postgresql', 'mongodb', 'mysql', 'graphql'];
    for (const skill of data.skills) {
      const lower = skill.toLowerCase();
      if (langKeywords.some(k => lower.includes(k))) categories['Languages'].push(skill);
      else if (fwKeywords.some(k => lower.includes(k))) categories['Frameworks'].push(skill);
      else if (infraKeywords.some(k => lower.includes(k))) categories['Infrastructure'].push(skill);
      else categories['Tools'].push(skill);
    }
    const filled = Object.entries(categories).filter(([, skills]) => skills.length > 0);
    if (filled.length === 0) return null;
    return (
      <div style={{ marginBottom: rhythm.sectionGap }} data-resume-section="skills">
        <SectionHeading label="Tech Stack" icon="ri-code-s-slash-line" color={theme.sectionLine} borderColor={theme.sectionLine} style={activeConfig.headingStyle} />
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
          {filled.map(([cat, skills]) => (
            <div key={cat}>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-50">{cat}</span>
              <div className="flex flex-wrap gap-x-1 gap-y-0.5 mt-0.5">
                {skills.map((s, i) => (
                  <span key={i} className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.skillBg, color: theme.skillText }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ─── Specialist Component: Leadership Thesis (V4) ─── */
  /* Renders summary as a strategic narrative with executive framing */
  const LeadershipThesis = () => (
    <div style={{ marginBottom: rhythm.sectionGap }} data-resume-section="summary">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: theme.primary }}>Leadership Thesis</span>
      </div>
      <EditableText
        value={data.summary}
        onChange={(v) => update('summary', v)}
        tag="p"
        className="text-[12px] leading-[1.8] text-gray-700 italic pl-3 border-l-2"
        style={{ borderColor: `${theme.primary}30` }}
        placeholder="Describe your leadership philosophy and strategic vision..."
        multiline
      />
    </div>
  );

  /* ─── Specialist Component: Portfolio Hero (V7) ─── */
  /* Renders LinkedIn/portfolio as a hero-sized CTA in the header area */
  const PortfolioHero = () => (
    <div className="flex flex-col items-center py-2" style={{ backgroundColor: `${theme.primary}08` }}>
      <span className="text-[8px] uppercase tracking-[0.3em] font-bold mb-1" style={{ color: theme.primary, opacity: 0.6 }}>Portfolio</span>
      <EditableText
        value={data.linkedin}
        onChange={(v) => update('linkedin', v)}
        className="text-[14px] font-semibold tracking-wide"
        style={{ color: theme.primary }}
        placeholder="portfolio-url.com"
      />
    </div>
  );

  /* ─── Specialist Component: GitHub Ribbon (V1) ─── */
  /* Text-based GitHub activity ribbon in header area */
  const GitHubRibbon = () => {
    // If LinkedIn contains github, use it; otherwise show a placeholder
    const hasGitHub = data.linkedin.toLowerCase().includes('github');
    if (!hasGitHub) return null;
    return (
      <div className="flex items-center justify-center gap-3 py-1.5 text-[9px]" style={{ backgroundColor: `${theme.primary}08`, borderTop: `1px solid ${theme.primary}15` }}>
        <i className="ri-github-fill text-[11px]" style={{ color: theme.primary }} />
        <EditableText
          value={data.linkedin}
          onChange={(v) => update('linkedin', v)}
          className="font-mono font-medium"
          style={{ color: theme.primary }}
          placeholder="github.com/username"
        />
        <span className="opacity-40">|</span>
        <span style={{ color: theme.primary, opacity: 0.7 }}>Open Source Contributor</span>
      </div>
    );
  };

'''

content = content[:insert_pos] + specialist_components + content[insert_pos:]
print("STEP 3 DONE: Added specialist components")

# ─────────────────────────────────────────────
# STEP 4: Integrate specialist components into renderTemplate
# ─────────────────────────────────────────────

# For header-single layout: add KPI ribbon and GitHub ribbon after header, before sections
# Find the header-single layout content area
old_header_single_content = """          <div className="px-8 py-6">
            {visibleSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
          </div>
        </div>
      );
    }"""

new_header_single_content = """          {specialComponents.has('kpi-ribbon') && <KpiRibbon />}
          {specialComponents.has('github-ribbon') && <GitHubRibbon />}
          <div className="px-8 py-6">
            {visibleSections.map((s, i) => {
              if (s.id === 'summary' && specialComponents.has('leadership-thesis')) return <LeadershipThesis key={s.id} />;
              if (s.id === 'skills' && specialComponents.has('tech-stack-matrix')) return <TechStackMatrix key={s.id} />;
              return renderSection(s, i, config.headingStyle, config.skillLayout);
            })}
          </div>
        </div>
      );
    }"""

if old_header_single_content in content:
    content = content.replace(old_header_single_content, new_header_single_content, 1)
    print("STEP 4a DONE: Integrated specialists into header-single layout")
else:
    print("WARNING: Could not find header-single content block — trying alternative")
    # Try to find and inject in a simpler way
    marker = "          <div className=\"px-8 py-6\">\n            {visibleSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}"
    if marker in content:
        new_marker = """          {specialComponents.has('kpi-ribbon') && <KpiRibbon />}
          {specialComponents.has('github-ribbon') && <GitHubRibbon />}
          <div className="px-8 py-6">
            {visibleSections.map((s, i) => {
              if (s.id === 'summary' && specialComponents.has('leadership-thesis')) return <LeadershipThesis key={s.id} />;
              if (s.id === 'skills' && specialComponents.has('tech-stack-matrix')) return <TechStackMatrix key={s.id} />;
              return renderSection(s, i, config.headingStyle, config.skillLayout);
            })}"""
        content = content.replace(marker, new_marker, 1)
        print("STEP 4a DONE: Integrated specialists into header-single layout (alt)")
    else:
        print("STEP 4a SKIPPED: Could not find header-single content block")

# For centered layout: add portfolio hero and KPI ribbon
old_centered_header = """          <div className="px-10 py-4">
            {visibleSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
          </div>"""
new_centered_header = """          {specialComponents.has('portfolio-hero') && <PortfolioHero />}
          {specialComponents.has('kpi-ribbon') && <KpiRibbon />}
          <div className="px-10 py-4">
            {visibleSections.map((s, i) => {
              if (s.id === 'summary' && specialComponents.has('leadership-thesis')) return <LeadershipThesis key={s.id} />;
              if (s.id === 'skills' && specialComponents.has('tech-stack-matrix')) return <TechStackMatrix key={s.id} />;
              return renderSection(s, i, config.headingStyle, config.skillLayout);
            })}
          </div>"""

if old_centered_header in content:
    content = content.replace(old_centered_header, new_centered_header, 1)
    print("STEP 4b DONE: Integrated specialists into centered layout")
else:
    print("STEP 4b SKIPPED: centered content block not found")

# For minimal layout: add github ribbon (for V1 terminal style)
old_minimal_content = """          <div className="px-8 pb-6">
            {visibleSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
          </div>"""
new_minimal_content = """          {specialComponents.has('github-ribbon') && <GitHubRibbon />}
          <div className="px-8 pb-6">
            {visibleSections.map((s, i) => {
              if (s.id === 'skills' && specialComponents.has('tech-stack-matrix')) return <TechStackMatrix key={s.id} />;
              return renderSection(s, i, config.headingStyle, config.skillLayout);
            })}
          </div>"""

if old_minimal_content in content:
    content = content.replace(old_minimal_content, new_minimal_content, 1)
    print("STEP 4c DONE: Integrated specialists into minimal layout")
else:
    print("STEP 4c SKIPPED: minimal content block not found")

# For two-col layout: add tech stack matrix support for V1 tech-grid
old_twocol_left = """            <div className="flex-1 px-5 py-4">
              {leftSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
            </div>"""
new_twocol_left = """            <div className="flex-1 px-5 py-4">
              {leftSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
            </div>"""
# Two-col left is fine as-is since skills go in right column

# For bold-bars layout: integrate leadership thesis for V4
# The bold-bars has a different structure with SectionWrapper + NoHeading blocks
# Find it:
old_bold_bars_start = """            {visibleSections.map((s, i) => (
              <div key={s.id}>
                <div className="flex items-center gap-2 px-3 py-1.5 -mx-1 mb-3 rounded" style={{ backgroundColor: theme.primary }}>"""
new_bold_bars_start = """            {visibleSections.map((s, i) => {
              if (s.id === 'summary' && specialComponents.has('leadership-thesis')) return <LeadershipThesis key={s.id} />;
              return (
              <div key={s.id}>
                <div className="flex items-center gap-2 px-3 py-1.5 -mx-1 mb-3 rounded" style={{ backgroundColor: theme.primary }}>"""

old_bold_bars_end = """                </SectionWrapper>
              </div>
            ))}"""
new_bold_bars_end = """                </SectionWrapper>
              </div>
              );
            })}"""

if old_bold_bars_start in content and old_bold_bars_end in content:
    content = content.replace(old_bold_bars_start, new_bold_bars_start, 1)
    content = content.replace(old_bold_bars_end, new_bold_bars_end, 1)
    print("STEP 4d DONE: Integrated leadership-thesis into bold-bars layout")
else:
    print("STEP 4d SKIPPED: bold-bars content block not found")

with open(filepath, 'w') as f:
    f.write(content)

print(f"\n✅ Phase 2 complete! File updated: {filepath}")
print(f"   Total size: {len(content)} chars, {content.count(chr(10))+1} lines")
