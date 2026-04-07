#!/usr/bin/env python3
"""Patch InlineResumeEditor.tsx:
1. Redesign page breaks → stacked paper pages with shadow gap (PDF viewer style)
2. Redesign KPI Ribbon → clean metrics bar (not random snippet text)
"""

import re

FILE = "frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx"

with open(FILE, "r") as f:
    code = f.read()

# ────────────────────────────────────────────────────────────
# FIX 1: Redesign page break overlays
# Replace the gray strip + "Page 2" badge with a clean gap that looks like
# stacked paper pages (shadow on bottom of page N, gap, shadow on top of page N+1)
# ────────────────────────────────────────────────────────────

old_page_break = '''            {/* Page-break gap overlays: solid strips that visually separate pages */}
            {pageBreakPositions.map((y, idx) => (
              <div
                key={`gap-${idx}`}
                className="absolute z-20 pointer-events-none"
                style={{
                  left: totalPages > 1 ? -20 : -16,
                  right: totalPages > 1 ? -20 : -16,
                  top: y - PAGE_GAP / 2,
                  height: PAGE_GAP,
                }}
              >
                {/* Top shadow: bottom edge of current page */}
                <div
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)',
                    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12)',
                  }}
                />
                {/* Gap area */}
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: totalPages > 1 ? '#cbd5e1' : '#e2e8f0' }}
                >
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/90 rounded-full shadow-sm border border-slate-300/60">
                    <i className="ri-file-line text-[10px] text-slate-400" />
                    <span className="text-[10px] font-semibold text-slate-500">
                      Page {idx + 2}
                    </span>
                  </div>
                </div>
                {/* Bottom shadow: top edge of next page */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2"
                  style={{
                    background: 'linear-gradient(to top, rgba(255,255,255,0.9), transparent)',
                    boxShadow: '0 -4px 12px -2px rgba(0,0,0,0.12)',
                  }}
                />
              </div>
            ))}'''

new_page_break = '''            {/* Page-break overlays: clean gap between stacked pages (PDF viewer style) */}
            {pageBreakPositions.map((y, idx) => (
              <div
                key={`gap-${idx}`}
                className="absolute z-20 pointer-events-none"
                style={{
                  left: -4,
                  right: -4,
                  top: y - PAGE_GAP / 2,
                  height: PAGE_GAP,
                }}
              >
                {/* Bottom edge shadow of current page */}
                <div
                  className="absolute top-0 left-1 right-1 h-[6px]"
                  style={{
                    boxShadow: '0 4px 8px -1px rgba(0,0,0,0.15), 0 2px 4px -2px rgba(0,0,0,0.1)',
                    borderRadius: '0 0 2px 2px',
                    background: 'white',
                  }}
                />
                {/* Visible gap — shows the gray background between pages */}
                <div className="w-full h-full" style={{ backgroundColor: '#e5e7eb' }} />
                {/* Top edge shadow of next page */}
                <div
                  className="absolute bottom-0 left-1 right-1 h-[6px]"
                  style={{
                    boxShadow: '0 -4px 8px -1px rgba(0,0,0,0.15), 0 -2px 4px -2px rgba(0,0,0,0.1)',
                    borderRadius: '2px 2px 0 0',
                    background: 'white',
                  }}
                />
              </div>
            ))}'''

assert old_page_break in code, "Could not find old page break block"
code = code.replace(old_page_break, new_page_break)

# ────────────────────────────────────────────────────────────
# FIX 1b: Remove the "Page 1" label at top-right 
# ────────────────────────────────────────────────────────────

old_page1_label = '''          {/* "Page 1" label at top-right when multi-page */}
          {totalPages > 1 && (
            <div className="absolute top-7 right-7 pointer-events-none select-none">
              <span className="text-[10px] font-medium text-slate-400 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/60 shadow-sm">
                Page 1
              </span>
            </div>
          )}'''

new_page1_label = ''  # Remove entirely

assert old_page1_label in code, "Could not find Page 1 label block"
code = code.replace(old_page1_label, new_page1_label)

# ────────────────────────────────────────────────────────────
# FIX 1c: Update the multi-page container — remove rounded-xl, adjust padding
# Make it look like a simple gray surface pages sit on
# ────────────────────────────────────────────────────────────

old_container = '''        {/* Multi-page container: gray surface behind page cards */}
        <div
          className={`relative ${
            totalPages > 1
              ? 'bg-slate-200/70 rounded-xl p-5'
              : ''
          }`}
          style={{ width: totalPages > 1 ? 652 : 612 }}
        >'''

new_container = '''        {/* Multi-page container: gray surface pages sit on (PDF viewer style) */}
        <div
          className={`relative ${
            totalPages > 1
              ? 'bg-gray-200 rounded-sm p-4 pt-4 pb-4'
              : ''
          }`}
          style={{ width: totalPages > 1 ? 644 : 612 }}
        >'''

assert old_container in code, "Could not find multi-page container block"
code = code.replace(old_container, new_container)

# ────────────────────────────────────────────────────────────
# FIX 1d: Remove per-page number watermarks (the small "1/2" text)
# ────────────────────────────────────────────────────────────

old_watermarks = '''            {/* Per-page number watermarks (overlaid on content) */}
            {totalPages > 1 && pageRanges.map((range, idx) => (
              <div
                key={`pn-${idx}`}
                className="absolute right-4 z-10 pointer-events-none select-none"
                style={{ top: range.startY + range.height - 24 }}
              >
                <span className="text-[9px] font-medium text-gray-300">
                  {idx + 1} / {totalPages}
                </span>
              </div>
            ))}'''

new_watermarks = ''  # Remove entirely

assert old_watermarks in code, "Could not find page number watermarks block"
code = code.replace(old_watermarks, new_watermarks)

# ────────────────────────────────────────────────────────────
# FIX 2: Redesign KPI Ribbon
# Instead of extracting random snippets with "..." ellipsis,
# show clean metric values with labels
# ────────────────────────────────────────────────────────────

old_kpi = '''  const KpiRibbon = () => {
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
  };'''

new_kpi = '''  const KpiRibbon = () => {
    const metrics: { value: string; label: string }[] = [];
    const metricPattern = /(?:\\$[\\d,.]+[MBKmk]?|\\d+(?:\\.\\d+)?[%xX]|\\d+\\+)/;
    for (const exp of data.experience) {
      for (const bullet of exp.bullets) {
        const match = bullet.match(metricPattern);
        if (match && metrics.length < 4) {
          // Extract a clean label: take a few words after the metric for context
          const afterMetric = bullet.slice(bullet.indexOf(match[0]) + match[0].length).trim();
          const labelWords = afterMetric.replace(/^[,;:\\s]+/, '').split(/\\s+/).slice(0, 3).join(' ').replace(/[.,;:]+$/, '');
          metrics.push({ value: match[0], label: labelWords || 'Impact' });
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
  };'''

assert old_kpi in code, "Could not find old KPI Ribbon block"
code = code.replace(old_kpi, new_kpi)

with open(FILE, "w") as f:
    f.write(code)

print("✅ Patch applied successfully")
print("  - Page breaks: stacked paper style (no gray bar, no 'Page 2' badge)")
print("  - KPI Ribbon: clean metric values with labels (no '...' snippets)")
