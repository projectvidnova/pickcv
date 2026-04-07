"""Phase 1.4: Wire up font, rhythm, and bold tokens into renderers.

Changes:
1. Move static types/constants (FONT_REGISTRY, RHYTHM, TEMPLATE_LAYOUTS) to module level
2. Inside component: compute activeConfig, resolvedFont, rhythm, boldTarget
3. Update renderTemplate to use resolvedFont instead of font-based lookup
4. Apply rhythm via CSS custom properties on layout containers
5. Update section blocks to use rhythm sectionGap via CSS var
6. Add boldTarget logic for company/skills/metrics bolding in experience blocks
"""
import re

filepath = 'frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx'

with open(filepath, 'r') as f:
    lines = f.readlines()

content = ''.join(lines)

# ─────────────────────────────────────────────
# STEP 1: Move static block to module level
# ─────────────────────────────────────────────

# Find the static block (from "/* ═══...Layout Configuration System..." to end of TEMPLATE_LAYOUTS "  };")
static_start_marker = "  /* " + "═" * 44 + "\n     Layout Configuration System"
static_start = content.find(static_start_marker)
if static_start < 0:
    # Try alternative
    static_start = content.find("Layout Configuration System")
    if static_start < 0:
        print("FATAL: Cannot find Layout Configuration System comment")
        exit(1)
    # Go to start of line
    static_start = content.rfind('\n', 0, static_start) + 1

# Find the end: "  };\n" after the last template entry (v10-narrative)
template_end_marker = "    'v10-narrative':"
te_pos = content.find(template_end_marker) 
if te_pos < 0:
    print("FATAL: Cannot find v10-narrative entry")
    exit(1)
# Find the closing "};" after it
close_pos = content.find("  };\n", te_pos)
if close_pos < 0:
    print("FATAL: Cannot find closing }; after TEMPLATE_LAYOUTS")
    exit(1)
static_end = close_pos + len("  };\n")

static_block_raw = content[static_start:static_end]
print(f"Found static block: {len(static_block_raw)} chars")

# Remove the static block from its current position
content = content[:static_start] + content[static_end:]

# Prepare module-level version (remove 2-space indentation since it'll be at top level)
# Also change 'type' to 'type' (already correct at module level)
module_block_lines = []
for line in static_block_raw.split('\n'):
    # Remove exactly 2 spaces of indentation
    if line.startswith('  '):
        module_block_lines.append(line[2:])
    else:
        module_block_lines.append(line)
module_block = '\n'.join(module_block_lines)

# Insert before the component function
component_marker = "export default function InlineResumeEditor({"
comp_pos = content.find(component_marker)
if comp_pos < 0:
    print("FATAL: Cannot find component function")
    exit(1)

module_block_to_insert = "\n" + module_block + "\n\n"
content = content[:comp_pos] + module_block_to_insert + content[comp_pos:]

print("STEP 1 DONE: Moved static block to module level")

# ─────────────────────────────────────────────
# STEP 2: Add config resolution inside component
# ─────────────────────────────────────────────

# Find a good insertion point after the hooks but before section blocks
# Insert after the ContactRow component (which ends with "  );\n" before SummaryBlock)
contact_row_end = content.find("  const SummaryBlock")
if contact_row_end < 0:
    print("FATAL: Cannot find SummaryBlock")
    exit(1)

config_resolution = """
  /* ─── Flavor Tokens (resolved from config) ─── */
  const activeConfig = TEMPLATE_LAYOUTS[templateId] || TEMPLATE_LAYOUTS['v1-stack-first'];
  const resolvedFont = activeConfig.fontFamily ? FONT_REGISTRY[activeConfig.fontFamily] : (activeConfig.font === 'serif' ? FONT_SERIF : FONT_SANS);
  const rhythm = RHYTHM[activeConfig.verticalRhythm || 'standard'];
  const boldTarget = activeConfig.boldTarget || 'none';

"""

content = content[:contact_row_end] + config_resolution + content[contact_row_end:]
print("STEP 2 DONE: Added config resolution")

# ─────────────────────────────────────────────
# STEP 3: Update section blocks to use rhythm
# ─────────────────────────────────────────────

# Replace mb-5 in section blocks with dynamic margin using rhythm
# SummaryBlock, ExperienceBlock, SkillsBlock, EducationBlock all have: className="mb-5" data-resume-section
# Also the NoHeading variants

# Replace section block margins — use style prop for dynamic margin
# Pattern: className="mb-5" data-resume-section="XXX"
# Replace with: style={{ marginBottom: rhythm.sectionGap }} data-resume-section="XXX"
content = content.replace(
    'className="mb-5" data-resume-section=',
    'style={{ marginBottom: rhythm.sectionGap }} data-resume-section='
)
print(f"STEP 3 DONE: Updated section block margins")

# ─────────────────────────────────────────────
# STEP 4: Update renderTemplate font resolution
# ─────────────────────────────────────────────

# Old line inside renderTemplate:
old_font_line = "    const fontFamily = config.font === 'serif' ? FONT_SERIF : FONT_SANS;"
new_font_line = "    const fontFamily = resolvedFont;"

content = content.replace(old_font_line, new_font_line)
print("STEP 4 DONE: Updated font resolution in renderTemplate")

# ─────────────────────────────────────────────
# STEP 5: Add CSS custom properties to layout root divs
# ─────────────────────────────────────────────

# Each layout has: style={{ fontFamily }}> on the root div
# Add rhythm CSS custom properties alongside fontFamily
# NOTE: TypeScript requires 'as React.CSSProperties' or we just inline it

old_root_style = "style={{ fontFamily }}>"
new_root_style = "style={{ fontFamily, '--section-gap': rhythm.sectionGap, '--bullet-gap': rhythm.bulletGap, '--header-pad': rhythm.headerPad } as React.CSSProperties}>"
content = content.replace(old_root_style, new_root_style)

# Also update the fallback at the bottom
old_fallback_style = "style={{ fontFamily: FONT_SANS }}>"
new_fallback_style = "style={{ fontFamily: FONT_SANS, '--section-gap': rhythm.sectionGap, '--bullet-gap': rhythm.bulletGap, '--header-pad': rhythm.headerPad } as React.CSSProperties}>"
content = content.replace(old_fallback_style, new_fallback_style, 1)

print("STEP 5 DONE: Added CSS custom properties to layout roots")

# ─────────────────────────────────────────────
# STEP 6: Add boldTarget logic to experience blocks
# ─────────────────────────────────────────────

# In ExperienceBlock, make company name bold when boldTarget === 'company'
# Current: className="font-semibold" style={{ color: theme.bulletColor }}  for company
# Add font-bold when boldTarget is 'company'
# We'll do this by replacing the company EditableText className

# For the main ExperienceBlock (not timeline variant):
old_company = """className="font-semibold" style={{ color: theme.bulletColor }} placeholder="Company" """
new_company = """className={boldTarget === 'company' ? 'font-bold' : 'font-semibold'} style={{ color: theme.bulletColor }} placeholder="Company" """
content = content.replace(old_company, new_company)

# For skills tags, add bold when boldTarget === 'skills' or 'stack'
# Current skill tags: className="text-[10px]" placeholder="Skill"
# Make font-bold conditionally
old_skill_tag = 'className="text-[10px]" placeholder="Skill"'
new_skill_tag = "className={`text-[10px] ${boldTarget === 'skills' || boldTarget === 'stack' ? 'font-bold' : ''}`} placeholder=\"Skill\""
content = content.replace(old_skill_tag, new_skill_tag)

print("STEP 6 DONE: Added boldTarget logic")

# ─────────────────────────────────────────────
# STEP 7: Update experience bullet spacing with rhythm
# ─────────────────────────────────────────────

# Experience entries use space-y-4 between jobs
old_exp_spacing = 'className="space-y-4 mt-1"'
new_exp_spacing = 'className="mt-1" style={{ display: "flex", flexDirection: "column", gap: rhythm.sectionGap }}'
content = content.replace(old_exp_spacing, new_exp_spacing)

# Bullet spacing uses space-y-1
old_bullet_spacing = 'className="mt-1.5 space-y-1">'
new_bullet_spacing = 'className="mt-1.5" style={{ display: "flex", flexDirection: "column", gap: rhythm.bulletGap }}>'
content = content.replace(old_bullet_spacing, new_bullet_spacing)

print("STEP 7 DONE: Updated experience spacing with rhythm")

# Write the result
with open(filepath, 'w') as f:
    f.write(content)

print(f"\n✅ Phase 1.4 complete! File updated: {filepath}")
print(f"   Total size: {len(content)} chars, {content.count(chr(10))+1} lines")
