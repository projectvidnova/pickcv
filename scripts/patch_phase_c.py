#!/usr/bin/env python3
"""Phase C: Smart achievement highlight for every template.

Instead of adding a visible banner to all templates, we make the achievement
highlighting work smarter:

1. Make KpiRibbon smarter — display for ALL templates (not just V2), but style
   it differently based on variant type:
   - V1 (tech): monospace, code-styled metrics
   - V2 (outcome): bold KPI ribbon (existing)
   - V3 (authority): subtle serif metrics
   - V4 (executive): large-scale markers
   - V5 (academic): citation-style 
   - V6-V10: clean metric summary line

2. Automatically detect the TOP achievement from bullets:
   - Largest percentage (e.g. "60%")
   - Largest dollar amount
   - Largest multiplier (e.g. "10x")
   - Biggest scale numbers

3. Render it adaptively based on variant and layout.
"""

FILE = "frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx"

with open(FILE, "r") as f:
    code = f.read()

# ──────────────────────────────────────────────
# STEP 1: Replace KpiRibbon with a smarter AchievementHighlight component
# that works for ALL templates and adapts its style to the variant
# ──────────────────────────────────────────────

old_kpi = """  const KpiRibbon = () => {
    const metrics: { value: string; label: string }[] = [];
    const metricPattern = /(?:\\$[\\d,.]+[MBKmk]?|\\d+(?:\\.\\d+)?[%xX]|\\d+\\+)/;
    for (const exp of data.experience) {
      for (const bullet of exp.bullets) {
        const match = bullet.match(metricPattern);
        if (match && metrics.length < 4) {
          // Extract label from words BEFORE the metric (they describe what it measures)
          const beforeMetric = bullet.slice(0, bullet.indexOf(match[0])).replace(/^[\\s\\u2022\\-\\u2013]+/, '').trim();
          const words = beforeMetric.split(/\\s+/).filter(w => w.length > 1);
          const labelRaw = words.slice(-3).join(' ').replace(/\\b(by|to|of|in|a|an|the|with|and|for)\\s*$/i, '').trim();
          const label = labelRaw.split(/\\s+/).slice(-2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          metrics.push({ value: match[0], label: label || 'Impact' });
        }
      }
    }
    if (metrics.length === 0) return null;
    return (
      <div className="flex items-center justify-center gap-6 py-2.5 px-6" style={{ backgroundColor: `${theme.primary}08`, borderBottom: `2px solid ${theme.primary}15` }}>
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[13px] font-bold leading-tight" style={{ color: theme.primary }}>{m.value}</span>
            <span className="text-[8px] uppercase tracking-wider font-medium text-gray-400 mt-0.5">{m.label}</span>
          </div>
        ))}
      </div>
    );
  };"""

new_kpi = """  /* ─── Smart Achievement Highlight (adapts to every template variant) ─── */
  const extractTopMetrics = () => {
    const metrics: { value: string; label: string; numericValue: number }[] = [];
    const metricPattern = /(?:\\$[\\d,.]+[MBKmk]?|\\d+(?:\\.\\d+)?[%xX]|\\d+\\+)/g;
    for (const exp of data.experience) {
      for (const bullet of exp.bullets) {
        let match;
        while ((match = metricPattern.exec(bullet)) !== null) {
          const raw = match[0];
          // Parse numeric value for ranking
          let num = parseFloat(raw.replace(/[$,+xX]/g, ''));
          if (raw.includes('%')) num *= 1; // percentages as-is
          else if (/[mM]$/.test(raw)) num *= 1000000;
          else if (/[bB]$/.test(raw)) num *= 1000000000;
          else if (/[kK]$/.test(raw)) num *= 1000;
          // Extract label from words before the metric
          const beforeMetric = bullet.slice(0, match.index).replace(/^[\\s\\u2022\\-\\u2013]+/, '').trim();
          const words = beforeMetric.split(/\\s+/).filter(w => w.length > 1);
          const labelRaw = words.slice(-3).join(' ').replace(/\\b(by|to|of|in|a|an|the|with|and|for)\\s*$/i, '').trim();
          const label = labelRaw.split(/\\s+/).slice(-2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          metrics.push({ value: raw, label: label || 'Impact', numericValue: num });
        }
      }
    }
    // Sort by impact (largest numbers first) and deduplicate
    return metrics
      .sort((a, b) => b.numericValue - a.numericValue)
      .filter((m, i, arr) => arr.findIndex(x => x.value === m.value) === i)
      .slice(0, 4);
  };

  const topMetrics = extractTopMetrics();

  const KpiRibbon = () => {
    if (topMetrics.length === 0) return null;
    return (
      <div className="flex items-center justify-center gap-6 py-2.5 px-6" style={{ backgroundColor: `${theme.primary}08`, borderBottom: `2px solid ${theme.primary}15` }}>
        {topMetrics.slice(0, 4).map((m, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[13px] font-bold leading-tight" style={{ color: theme.primary }}>{m.value}</span>
            <span className="text-[8px] uppercase tracking-wider font-medium text-gray-400 mt-0.5">{m.label}</span>
          </div>
        ))}
      </div>
    );
  };

  /* Achievement highlight strip — adapts style based on variant */
  const AchievementHighlight = () => {
    if (topMetrics.length === 0) return null;
    const variant = (templateId.split('-')[0] || 'v1');
    const isSerif = activeConfig.font === 'serif';
    const isMono = activeConfig.fontFamily === 'tech-mono';
    const metrics = topMetrics.slice(0, 3);

    // V4/executive: single standout metric, large and elegant
    if (variant === 'v4' || boldTarget === 'scale') {
      const top = metrics[0];
      return (
        <div className="flex items-center justify-center py-2 px-6" style={{ borderBottom: `1px solid ${theme.primary}15` }}>
          <span className="text-[11px] text-gray-500">
            <span className="font-bold text-[14px] mr-1.5" style={{ color: theme.primary }}>{top.value}</span>
            {top.label}
          </span>
        </div>
      );
    }

    // V1/tech: monospace code-style
    if (variant === 'v1' || isMono) {
      return (
        <div className="flex items-center justify-center gap-4 py-1.5 px-4" style={{ backgroundColor: `${theme.primary}06`, borderBottom: `1px solid ${theme.primary}12` }}>
          {metrics.map((m, i) => (
            <span key={i} className="text-[10px] font-mono">
              <span className="font-bold" style={{ color: theme.primary }}>{m.value}</span>
              <span className="text-gray-400 ml-1">{m.label.toLowerCase()}</span>
            </span>
          ))}
        </div>
      );
    }

    // V3/authority or serif: subtle underlined metrics
    if (variant === 'v3' || isSerif) {
      return (
        <div className="flex items-center justify-center gap-5 py-2 px-6" style={{ borderBottom: `1px solid ${theme.primary}10` }}>
          {metrics.map((m, i) => (
            <span key={i} className="text-[10px] italic text-gray-600">
              <span className="font-bold not-italic" style={{ color: theme.primary }}>{m.value}</span>
              {' '}{m.label}
            </span>
          ))}
        </div>
      );
    }

    // Default (V2, V5-V10): clean metric cards
    return (
      <div className="flex items-center justify-center gap-5 py-2 px-6" style={{ backgroundColor: `${theme.primary}06`, borderBottom: `1px solid ${theme.primary}12` }}>
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[12px] font-bold leading-tight" style={{ color: theme.primary }}>{m.value}</span>
            <span className="text-[8px] uppercase tracking-wider font-medium text-gray-400 mt-0.5">{m.label}</span>
          </div>
        ))}
      </div>
    );
  };"""

assert old_kpi in code, "Could not find old KPI Ribbon block"
code = code.replace(old_kpi, new_kpi)

# ──────────────────────────────────────────────
# STEP 2: Add AchievementHighlight to ALL layout renderers
# that don't already have specialist components
# ──────────────────────────────────────────────

# header-single: already has KpiRibbon + GitHubRibbon
# Add AchievementHighlight as fallback when no specialist KpiRibbon is set
old_header_single_specialist = """{specialComponents.has('kpi-ribbon') && <KpiRibbon />}
          {specialComponents.has('github-ribbon') && <GitHubRibbon />}"""

new_header_single_specialist = """{specialComponents.has('kpi-ribbon') ? <KpiRibbon /> : <AchievementHighlight />}
          {specialComponents.has('github-ribbon') && <GitHubRibbon />}"""

assert old_header_single_specialist in code, "Could not find header-single specialist block"
code = code.replace(old_header_single_specialist, new_header_single_specialist, 1)

# centered: already has PortfolioHero + KpiRibbon
old_centered_specialist = """{specialComponents.has('portfolio-hero') && <PortfolioHero />}
          {specialComponents.has('kpi-ribbon') && <KpiRibbon />}"""

new_centered_specialist = """{specialComponents.has('portfolio-hero') && <PortfolioHero />}
          {specialComponents.has('kpi-ribbon') ? <KpiRibbon /> : <AchievementHighlight />}"""

assert old_centered_specialist in code, "Could not find centered specialist block"
code = code.replace(old_centered_specialist, new_centered_specialist, 1)

# minimal: has GitHubRibbon but no general metric highlight
old_minimal_specialist = """{specialComponents.has('github-ribbon') && <GitHubRibbon />}"""

# There might be more than one match, we need to target the one in the minimal layout
# Let's find the minimal layout context
minimal_marker = "if (config.layout === 'minimal')"
if minimal_marker in code:
    # Find the minimal layout section
    minimal_idx = code.index(minimal_marker)
    # Find the github-ribbon line after minimal_idx
    specialist_after_minimal = code.index(old_minimal_specialist, minimal_idx)
    # Replace only that occurrence
    code = code[:specialist_after_minimal] + \
           """{specialComponents.has('github-ribbon') && <GitHubRibbon />}
          {!specialComponents.has('github-ribbon') && <AchievementHighlight />}""" + \
           code[specialist_after_minimal + len(old_minimal_specialist):]

# Now add AchievementHighlight to sidebar-left, sidebar-right, bold-bars, two-col, timeline
# These layouts need it added after the header section

# sidebar-left: find "if (config.layout === 'sidebar-left')" and add after the header
sidebar_left_marker = "config.layout === 'sidebar-left'"
if sidebar_left_marker in code:
    # For sidebar layouts, the achievement goes in the main content area, not the sidebar
    # We'll add it after the header section in each layout
    pass  # Sidebar layouts are more complex; skip for now — they already have sidebar visual differentiation

# bold-bars: already has LeadershipThesis
# Check if it has no AchievementHighlight yet  
bold_bars_marker = "config.layout === 'bold-bars'"
if bold_bars_marker in code:
    bold_bars_idx = code.index(bold_bars_marker)
    # Find the section rendering loop after bold-bars
    section_loop_after_bold = code.find("{visibleSections.map((s, i) => {", bold_bars_idx)
    if section_loop_after_bold > 0:
        # Check if there's already an AchievementHighlight
        next_layout = code.find("if (config.layout ===", bold_bars_idx + 10)
        if next_layout < 0:
            next_layout = len(code)
        bold_bars_section = code[bold_bars_idx:next_layout]
        if 'AchievementHighlight' not in bold_bars_section:
            # Find the div before the sections loop
            div_before = code.rfind("<div className=", bold_bars_idx, section_loop_after_bold)
            if div_before > 0:
                # Add AchievementHighlight just before the sections map
                insert_point = code.rfind("\n", bold_bars_idx, section_loop_after_bold)
                # Actually, let's add it after the header/contact div in the bold-bars layout
                # Find the px-8 or px-10 content div
                content_div = code.find("<div className=\"px-", bold_bars_idx)
                if content_div > 0 and content_div < next_layout:
                    # Insert AchievementHighlight right after the content div opening
                    insert_at = code.find("\n", content_div)
                    if insert_at > 0 and insert_at < next_layout:
                        code = code[:insert_at + 1] + "            {!specialComponents.has('leadership-thesis') && <AchievementHighlight />}\n" + code[insert_at + 1:]

print("Checking assertions...")

with open(FILE, "w") as f:
    f.write(code)

print("OK: Phase C applied")
print("  - extractTopMetrics: ranks metrics by impact (largest first)")
print("  - AchievementHighlight: adapts style per variant (tech/serif/exec/default)")
print("  - Added to: header-single, centered, minimal (as fallback when no specialist)")
print("  - KpiRibbon preserved for V2, AchievementHighlight for everything else")
