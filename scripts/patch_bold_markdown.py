#!/usr/bin/env python3
"""
Patch InlineResumeEditor.tsx:
1. Fix EditableText to render **bold** as actual <strong> bold text
2. Fix extractTopMetrics to strip ** before parsing metrics
"""
import re

FILE = "frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx"

with open(FILE, "r") as f:
    src = f.read()

original = src

# ─── FIX 1: EditableText – render **bold** as actual bold ───
# Current code:
#   useEffect(() => {
#     if (ref.current && !editing) ref.current.textContent = value;
#   }, [value, editing]);
# Change to: escape HTML, parse **bold** -> <strong>, set innerHTML

old_editable_effect = "useEffect(() => {\n    if (ref.current && !editing) ref.current.textContent = value;\n  }, [value, editing]);"
new_editable_effect = """useEffect(() => {
    if (ref.current && !editing) {
      // Escape HTML entities, then parse **bold** markers into <strong> tags
      const escaped = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const html = escaped.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
      if (html !== escaped || value.includes('**')) {
        ref.current.innerHTML = html;
      } else {
        ref.current.textContent = value;
      }
    }
  }, [value, editing]);"""

if old_editable_effect in src:
    src = src.replace(old_editable_effect, new_editable_effect, 1)
    print("EditableText useEffect: patched ✅")
else:
    print("EditableText useEffect: pattern NOT FOUND ✗")
    # Try to find it with different whitespace
    alt = re.search(r'useEffect\(\(\)\s*=>\s*\{\s*if\s*\(ref\.current\s*&&\s*!editing\)\s*ref\.current\.textContent\s*=\s*value;\s*\},\s*\[value,\s*editing\]\);', src)
    if alt:
        src = src[:alt.start()] + new_editable_effect + src[alt.end():]
        print("EditableText useEffect: patched via regex ✅")
    else:
        print("!! Could not find EditableText useEffect pattern")

# Fix the onBlur handler to compare stripped text
# Current:  if (text !== value) onChange(text || '');
# Change to: compare against value with ** stripped
old_blur = "const text = multiline ? e.target.innerText : e.target.textContent;\n        if (text !== value) onChange(text || '');"
new_blur = """const text = multiline ? e.target.innerText : e.target.textContent;
        const cleanValue = value.replace(/\\*\\*/g, '');
        if (text !== cleanValue) onChange(text || '');"""

if old_blur in src:
    src = src.replace(old_blur, new_blur, 1)
    print("EditableText onBlur: patched ✅")
else:
    print("EditableText onBlur: pattern NOT FOUND ✗")

# ─── FIX 2: extractTopMetrics – strip ** from bullets before parsing ───
old_extract = "for (const bullet of exp.bullets) {\n        let match;"
new_extract = "for (const rawBullet of exp.bullets) {\n        const bullet = rawBullet.replace(/\\*\\*/g, '');\n        let match;"

if old_extract in src:
    src = src.replace(old_extract, new_extract, 1)
    print("extractTopMetrics: patched ✅")
else:
    print("extractTopMetrics: pattern NOT FOUND ✗")

if src != original:
    with open(FILE, "w") as f:
        f.write(src)
    print("\nDone: File updated successfully")
else:
    print("\n!! No changes made")
