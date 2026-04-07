#!/usr/bin/env python3
"""Add AchievementHighlight to two-col layout and the default fallback."""

FILE = "frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx"

with open(FILE, "r") as f:
    code = f.read()

changes = 0

# two-col: the structure after header is:
# </div>  (end of header)
# <div className="flex">  (start of two-col body)
# We need to find this within the two-col block

twocol_idx = code.find("config.layout === 'two-col'")
if twocol_idx >= 0:
    # Find the header closing </div> followed by <div className="flex">
    search_region = code[twocol_idx:twocol_idx + 3000]
    # Find the exact pattern
    pattern = '          </div>\n          <div className="flex">'
    local_idx = search_region.find(pattern)
    if local_idx >= 0:
        global_idx = twocol_idx + local_idx
        new_text = '          </div>\n          <AchievementHighlight />\n          <div className="flex">'
        code = code[:global_idx] + new_text + code[global_idx + len(pattern):]
        changes += 1
        print("  + two-col: added AchievementHighlight")
    else:
        print("  ! two-col: exact pattern not found")
        # Debug
        for line in search_region.split('\n')[:30]:
            if 'flex"' in line and 'className' in line:
                print(f"    Found: {line.strip()[:80]}")
else:
    print("  ! two-col: layout not found")

# Also add to the default fallback layout (last return in renderTemplate)
fallback_pattern = """        <div className="px-8 py-6">
          {visibleSections.map((s, i) => renderSection(s, i, 'underline', 'tags'))}
        </div>"""

new_fallback = """        <AchievementHighlight />
        <div className="px-8 py-6">
          {visibleSections.map((s, i) => renderSection(s, i, 'underline', 'tags'))}
        </div>"""

# Make sure this is the fallback (comes after two-col)
fallback_idx = code.find(fallback_pattern, twocol_idx)
if fallback_idx >= 0:
    code = code[:fallback_idx] + new_fallback + code[fallback_idx + len(fallback_pattern):]
    changes += 1
    print("  + fallback: added AchievementHighlight")
else:
    print("  ! fallback: pattern not found")

with open(FILE, "w") as f:
    f.write(code)

print(f"\nDone: {changes} layouts updated")
