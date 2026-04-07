#!/usr/bin/env python3
"""Fix KpiRibbon label extraction — take words BEFORE the metric, not after."""

FILE = "frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx"

with open(FILE, "r") as f:
    code = f.read()

old = r'''        if (match && metrics.length < 4) {
          // Extract a clean label: take a few words after the metric for context
          const afterMetric = bullet.slice(bullet.indexOf(match[0]) + match[0].length).trim();
          const labelWords = afterMetric.replace(/^[,;\:\s]+/, '').split(/\s+/).slice(0, 3).join(' ').replace(/[.,;:]+$/, '');
          metrics.push({ value: match[0], label: labelWords || 'Impact' });
        }'''

new = r'''        if (match && metrics.length < 4) {
          // Extract label from words BEFORE the metric (they describe what it measures)
          const beforeMetric = bullet.slice(0, bullet.indexOf(match[0])).replace(/^[\s\u2022\-\u2013]+/, '').trim();
          const words = beforeMetric.split(/\s+/).filter(w => w.length > 1);
          // Take the last 2-3 meaningful words before the number (e.g. "close-cycle time by" → "Cycle Time")
          const labelRaw = words.slice(-3).join(' ').replace(/\b(by|to|of|in|a|an|the|with|and|for)\s*$/i, '').trim();
          const label = labelRaw.split(/\s+/).slice(-2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          metrics.push({ value: match[0], label: label || 'Impact' });
        }'''

assert old in code, f"Could not find old KPI label code"
code = code.replace(old, new)

with open(FILE, "w") as f:
    f.write(code)

print("✅ KPI Ribbon label extraction fixed — now uses words before the metric")
