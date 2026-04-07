#!/usr/bin/env python3
"""Add AchievementHighlight to sidebar-left, sidebar-right, timeline, and two-col layouts."""

FILE = "frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx"

with open(FILE, "r") as f:
    code = f.read()

changes = 0

# ──────────────────────────────────────────────
# sidebar-left: Add after the header div, before the flex container
# The structure is: <div ref={resumeRef}> <div sidebar> ... </div> <div main>
# We want to add it at the top of the "main body" div
# ──────────────────────────────────────────────

# sidebar-left main body section
old_sidebar_left_main = """          {/* Main body */}
          <div className="flex-1 px-6 py-6">
            {mainSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
          </div>
        </div>
      );
    }"""

new_sidebar_left_main = """          {/* Main body */}
          <div className="flex-1 px-6 py-6">
            <AchievementHighlight />
            {mainSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
          </div>
        </div>
      );
    }"""

if old_sidebar_left_main in code:
    code = code.replace(old_sidebar_left_main, new_sidebar_left_main, 1)
    changes += 1
    print("  + sidebar-left: added AchievementHighlight")
else:
    print("  ! sidebar-left: pattern not found")

# ──────────────────────────────────────────────
# sidebar-right: Add after the header, before the flex body
# Structure: <div ref> <div header> ... </div> <div flex> <div main> ... </div> <div sidebar> ... </div> </div></div>
# ──────────────────────────────────────────────

old_sidebar_right_main = """          <div className="flex">
            <div className="flex-1 px-6 py-5 border-r border-gray-100">
              {mainSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
            </div>"""

new_sidebar_right_main = """          <div className="flex">
            <div className="flex-1 px-6 py-5 border-r border-gray-100">
              <AchievementHighlight />
              {mainSections.map((s, i) => renderSection(s, i, config.headingStyle, config.skillLayout))}
            </div>"""

if old_sidebar_right_main in code:
    code = code.replace(old_sidebar_right_main, new_sidebar_right_main, 1)
    changes += 1
    print("  + sidebar-right: added AchievementHighlight")
else:
    print("  ! sidebar-right: pattern not found")

# ──────────────────────────────────────────────
# timeline: Add right after ContactRow, before the sections
# ──────────────────────────────────────────────

# In timeline layout, find the <ContactRow> then the next <div> (content area)
old_timeline_content = """            <ContactRow color="#6b7280" />
          </div>
          <div className="px-8 py-4">"""

new_timeline_content = """            <ContactRow color="#6b7280" />
          </div>
          <AchievementHighlight />
          <div className="px-8 py-4">"""

# Make sure we only match within the timeline layout
timeline_idx = code.find("config.layout === 'timeline'")
if timeline_idx >= 0:
    # Search for the pattern starting from timeline layout
    pattern_idx = code.find(old_timeline_content, timeline_idx)
    if pattern_idx >= 0:
        code = code[:pattern_idx] + new_timeline_content + code[pattern_idx + len(old_timeline_content):]
        changes += 1
        print("  + timeline: added AchievementHighlight")
    else:
        print("  ! timeline: content pattern not found")
else:
    print("  ! timeline: layout not found")

# ──────────────────────────────────────────────
# two-col: Add after the header, before the body flex
# ──────────────────────────────────────────────

# Find the two-col layout
twocol_idx = code.find("config.layout === 'two-col'")
if twocol_idx >= 0:
    # Find the flex body that starts the two columns
    # It looks for: <div className="flex ..."> after the header section
    # The header ends, then there's the two-col body
    # Let's find: </div>\n          <div className="flex">
    # Actually, in two-col, the body is: <div className="flex gap-
    flex_body_pattern = '<div className="flex gap-'
    flex_body_idx = code.find(flex_body_pattern, twocol_idx)
    if flex_body_idx >= 0 and flex_body_idx < twocol_idx + 3000:
        # Insert AchievementHighlight before the flex body
        insert_text = "          <AchievementHighlight />\n          "
        code = code[:flex_body_idx] + insert_text + code[flex_body_idx:]
        changes += 1
        print("  + two-col: added AchievementHighlight")
    else:
        # Try alternative pattern
        print(f"  ! two-col: flex body not found at expected location")
else:
    print("  ! two-col: layout not found")

with open(FILE, "w") as f:
    f.write(code)

print(f"\nDone: {changes} layouts updated")
