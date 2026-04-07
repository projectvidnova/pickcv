"""Phase 1.3: Update all 50 TEMPLATE_LAYOUTS with fontFamily, verticalRhythm, boldTarget per spec."""
filepath = 'frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Find and replace the entire TEMPLATE_LAYOUTS block
old_start = "  const TEMPLATE_LAYOUTS: Record<string, LayoutConfig> = {"
old_end_marker = "  };\n"

start_idx = content.find(old_start)
if start_idx < 0:
    print("FATAL: TEMPLATE_LAYOUTS not found")
    exit(1)

# Find the closing brace of the object (next `  };` after start)
search_from = start_idx + len(old_start)
end_idx = content.find(old_end_marker, search_from)
if end_idx < 0:
    print("FATAL: Could not find end of TEMPLATE_LAYOUTS")
    exit(1)
end_idx += len(old_end_marker)

old_block = content[start_idx:end_idx]
print(f"Found TEMPLATE_LAYOUTS block: {len(old_block)} chars, lines ~{content[:start_idx].count(chr(10))+1} to ~{content[:end_idx].count(chr(10))+1}")

new_block = """  const TEMPLATE_LAYOUTS: Record<string, LayoutConfig> = {
    // ═══ V1: Signal Stack (Tech) — "Technical Blueprint" aesthetic ═══
    // Tight rhythm, monospaced for skills, bold tech stack names
    'v1-stack-first':  { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'tight', boldTarget: 'stack' },
    'v1-dev-card':     { layout: 'minimal', headingStyle: 'side', skillLayout: 'tags', font: 'sans', fontFamily: 'tech-mono', verticalRhythm: 'tight', boldTarget: 'stack' },
    'v1-tech-grid':    { layout: 'two-col', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'tight', boldTarget: 'stack' },
    'v1-system-arch':  { layout: 'sidebar-left', headingStyle: 'side', skillLayout: 'list', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'tight', boldTarget: 'stack', sidebarSections: ['skills', 'education'] },
    'v1-terminal':     { layout: 'minimal', headingStyle: 'caps', skillLayout: 'tags', font: 'sans', fontFamily: 'tech-mono', verticalRhythm: 'tight', boldTarget: 'none' },

    // ═══ V2: Outcome Ledger (Business) — "Financial Audit" aesthetic ═══
    // Standard rhythm, bold metrics/percentages, high-contrast sans
    'v2-metric-hero':  { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'metrics' },
    'v2-impact-first': { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'metrics' },
    'v2-results-dash': { layout: 'two-col', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'metrics' },
    'v2-board-ready':  { layout: 'sidebar-right', headingStyle: 'caps', skillLayout: 'list', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'standard', boldTarget: 'metrics', sidebarSections: ['skills', 'education'] },
    'v2-numbers-lead': { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'metrics', sidebarSections: ['skills', 'education'] },

    // ═══ V3: Authority Frame (Enterprise) — "White Paper" aesthetic ═══
    // Generous rhythm, prestigious serif, bold company names (Pedigree Heuristic)
    'v3-corporate':    { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'generous', boldTarget: 'company' },
    'v3-governance':   { layout: 'bold-bars', headingStyle: 'pill', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'generous', boldTarget: 'company' },
    'v3-enterprise':   { layout: 'header-single', headingStyle: 'caps', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'generous', boldTarget: 'company' },
    'v3-process':      { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'generous', boldTarget: 'company', sidebarSections: ['skills', 'education'] },
    'v3-compliance':   { layout: 'minimal', headingStyle: 'underline', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'generous', boldTarget: 'company' },

    // ═══ V4: Leadership Thesis (Senior) — "Strategic Brief" aesthetic ═══
    // Very generous rhythm (>=30% whitespace), executive serif, bold scale markers
    'v4-exec-brief':   { layout: 'centered', headingStyle: 'caps', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-executive', verticalRhythm: 'very-generous', boldTarget: 'scale' },
    'v4-leadership':   { layout: 'bold-bars', headingStyle: 'pill', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-executive', verticalRhythm: 'very-generous', boldTarget: 'scale' },
    'v4-csuite':       { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'serif', fontFamily: 'serif-executive', verticalRhythm: 'very-generous', boldTarget: 'scale', sidebarSections: ['skills', 'education'] },
    'v4-strategy':     { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-executive', verticalRhythm: 'very-generous', boldTarget: 'scale' },
    'v4-board-deck':   { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-executive', verticalRhythm: 'very-generous', boldTarget: 'scale' },

    // ═══ V5: Proof Sheet (Research) — "Scientific Journal" aesthetic ═══
    // Standard rhythm, serif (academic), bold metrics/evidence
    'v5-academic':     { layout: 'centered', headingStyle: 'caps', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'standard', boldTarget: 'metrics' },
    'v5-method':       { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'metrics' },
    'v5-paper':        { layout: 'header-single', headingStyle: 'caps', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'standard', boldTarget: 'metrics' },
    'v5-lab':          { layout: 'sidebar-left', headingStyle: 'side', skillLayout: 'list', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'metrics', sidebarSections: ['skills', 'education'] },
    'v5-scholar':      { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'standard', boldTarget: 'metrics' },

    // ═══ V6: Problem-Solver (Ops) — "Process Rigor" aesthetic ═══
    // Standard rhythm, clean sans, bold metrics (efficiency deltas)
    'v6-case-study':   { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'metrics', sidebarSections: ['skills', 'education'] },
    'v6-consultant':   { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'metrics' },
    'v6-matrix':       { layout: 'bold-bars', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'metrics' },
    'v6-sar':          { layout: 'header-single', headingStyle: 'side', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'metrics' },
    'v6-process-flow': { layout: 'timeline', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'metrics' },

    // ═══ V7: Portfolio Lead (Design) — "Design Gallery" aesthetic ═══
    // Very generous rhythm (>=30% whitespace), Montserrat display, bold skills
    'v7-portfolio-hero':  { layout: 'centered', headingStyle: 'caps', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-display', verticalRhythm: 'very-generous', boldTarget: 'skills' },
    'v7-case-gallery':    { layout: 'header-single', headingStyle: 'pill', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-display', verticalRhythm: 'very-generous', boldTarget: 'skills' },
    'v7-design-process':  { layout: 'sidebar-left', headingStyle: 'side', skillLayout: 'list', font: 'sans', fontFamily: 'sans-display', verticalRhythm: 'very-generous', boldTarget: 'skills', sidebarSections: ['skills', 'education'] },
    'v7-creative-min':    { layout: 'minimal', headingStyle: 'caps', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-display', verticalRhythm: 'very-generous', boldTarget: 'none' },
    'v7-studio':          { layout: 'header-single', headingStyle: 'side', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-display', verticalRhythm: 'generous', boldTarget: 'skills' },

    // ═══ V8: Versatility Map (Generalist) — "Adaptable Ownership" aesthetic ═══
    // Standard rhythm, clean sans, bold skills (breadth emphasis)
    'v8-flexi-grid':   { layout: 'sidebar-left', headingStyle: 'side', skillLayout: 'list', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'skills', sidebarSections: ['skills', 'education'] },
    'v8-cross-func':   { layout: 'two-col', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'skills' },
    'v8-adaptive':     { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'skills' },
    'v8-breadth':      { layout: 'bold-bars', headingStyle: 'pill', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'skills' },
    'v8-hybrid':       { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'skills', sidebarSections: ['skills', 'education'] },

    // ═══ V9: Domain Expert (Specialist) — "Deep Authority" aesthetic ═══
    // Standard rhythm, sans (high-contrast), bold company names (institutional trust)
    'v9-authority':    { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'company' },
    'v9-specialist':   { layout: 'header-single', headingStyle: 'caps', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'company' },
    'v9-credential':   { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'company' },
    'v9-industry':     { layout: 'header-single', headingStyle: 'caps', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'standard', boldTarget: 'company' },
    'v9-expert':       { layout: 'sidebar-left', headingStyle: 'side', skillLayout: 'list', font: 'sans', fontFamily: 'sans-modern', verticalRhythm: 'standard', boldTarget: 'company', sidebarSections: ['skills', 'education'] },

    // ═══ V10: Transition Narrative — "Transferable Narrative" aesthetic ═══
    // Standard rhythm, approachable sans, bold skills (transferable emphasis)
    'v10-pivot-bridge': { layout: 'centered', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'skills' },
    'v10-new-chapter':  { layout: 'header-single', headingStyle: 'underline', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'skills' },
    'v10-transfer':     { layout: 'sidebar-right', headingStyle: 'side', skillLayout: 'list', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'skills', sidebarSections: ['skills', 'education'] },
    'v10-fresh-start':  { layout: 'minimal', headingStyle: 'side', skillLayout: 'tags', font: 'sans', fontFamily: 'sans-clean', verticalRhythm: 'standard', boldTarget: 'skills' },
    'v10-narrative':    { layout: 'timeline', headingStyle: 'caps', skillLayout: 'tags', font: 'serif', fontFamily: 'serif-prestigious', verticalRhythm: 'standard', boldTarget: 'skills' },
  };
"""

content = content[:start_idx] + new_block + content[end_idx:]

with open(filepath, 'w') as f:
    f.write(content)

print(f"SUCCESS: Updated all 50 TEMPLATE_LAYOUTS with fontFamily, verticalRhythm, boldTarget")
