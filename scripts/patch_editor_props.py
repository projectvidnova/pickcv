#!/usr/bin/env python3
"""
Patch InlineResumeEditor to accept dynamicConfigs, dynamicLoading, onDynamicTemplateSelect props.
These are forwarded to TemplatePicker for rendering dynamic template cards.
"""

FILE = "frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx"

with open(FILE, "r") as f:
    src = f.read()

changes = 0

# 1. Add new props to destructuring
old = """  onPageCountChange,
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

new = """  onPageCountChange,
  activeDynamicConfig,
  dynamicConfigs,
  dynamicLoading,
  onDynamicTemplateSelect,
}: {
  data: ResumeData;
  onDataChange: (d: ResumeData) => void;
  initialTemplateId?: TemplateId;
  variantId?: string;
  variantRationale?: string;
  onPageCountChange?: (pages: number) => void;
  activeDynamicConfig?: DynamicTemplateConfig;
  dynamicConfigs?: Record<string, DynamicTemplateConfig>;
  dynamicLoading?: Record<string, boolean>;
  onDynamicTemplateSelect?: (configKey: string | undefined) => void;
})"""

if old in src:
    src = src.replace(old, new, 1)
    print("1. Props expanded: patched ✅")
    changes += 1
else:
    print("1. Props expanded: NOT FOUND ✗")

# 2. Pass dynamic props to TemplatePicker
# Find the TemplatePicker JSX
old_picker = "variantRationale={variantRationale} />"
# Let's be more precise
import re
# Search for the full TemplatePicker tag
picker_pattern = r'(<TemplatePicker\s+activeTemplateId=\{templateId\}[^/]*variantRationale=\{variantRationale\}\s*/>)'
match = re.search(picker_pattern, src, re.DOTALL)
if match:
    old_picker_full = match.group(1)
    new_picker_full = old_picker_full.replace(
        'variantRationale={variantRationale} />',
        'variantRationale={variantRationale} dynamicConfigs={dynamicConfigs} dynamicLoading={dynamicLoading} onDynamicTemplateSelect={onDynamicTemplateSelect} />'
    )
    src = src.replace(old_picker_full, new_picker_full, 1)
    print("2. TemplatePicker props: patched ✅")
    changes += 1
else:
    print("2. TemplatePicker props: NOT FOUND ✗")
    # Try simpler approach
    if 'variantRationale={variantRationale} />' in src:
        src = src.replace(
            'variantRationale={variantRationale} />',
            'variantRationale={variantRationale} dynamicConfigs={dynamicConfigs} dynamicLoading={dynamicLoading} onDynamicTemplateSelect={onDynamicTemplateSelect} />',
            1
        )
        print("2b. TemplatePicker props (simple): patched ✅")
        changes += 1

if changes > 0:
    with open(FILE, "w") as f:
        f.write(src)
    print(f"\nDone: {changes} changes applied")
else:
    print("\n!! No changes applied")
