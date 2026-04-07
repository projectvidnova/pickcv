#!/usr/bin/env python3
"""Fix KpiRibbon: extract label from words BEFORE the metric, not after."""

FILE = "frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx"

with open(FILE, "r") as f:
    code = f.read()

old = (
    "          // Extract a clean label: take a few words after the metric for context\n"
    "          const afterMetric = bullet.slice(bullet.indexOf(match[0]) + match[0].length).trim();\n"
    "          const labelWords = afterMetric.replace(/^[,;:\\s]+/, '').split(/\\s+/).slice(0, 3).join(' ').replace(/[.,;:]+$/, '');\n"
    "          metrics.push({ value: match[0], label: labelWords || 'Impact' });"
)

new = (
    "          // Extract label from words BEFORE the metric (they describe what it measures)\n"
    "          const beforeMetric = bullet.slice(0, bullet.indexOf(match[0])).replace(/^[\\s\\u2022\\-\\u2013]+/, '').trim();\n"
    "          const words = beforeMetric.split(/\\s+/).filter(w => w.length > 1);\n"
    "          const labelRaw = words.slice(-3).join(' ').replace(/\\b(by|to|of|in|a|an|the|with|and|for)\\s*$/i, '').trim();\n"
    "          const label = labelRaw.split(/\\s+/).slice(-2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');\n"
    "          metrics.push({ value: match[0], label: label || 'Impact' });"
)

if old not in code:
    print("ERROR: Could not find old KPI label code")
    # Debug: print what's actually on those lines
    lines = code.split('\n')
    for i, line in enumerate(lines):
        if 'afterMetric' in line or 'labelWords' in line or 'clean label' in line:
            print(f"  Line {i+1}: {line!r}")
    raise SystemExit(1)

code = code.replace(old, new)

with open(FILE, "w") as f:
    f.write(code)

print("OK: KPI Ribbon label extraction fixed")
