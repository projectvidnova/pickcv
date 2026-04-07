#!/usr/bin/env python3
"""Phase B: Fix page count messaging — don't pressure users to fit on 1 page."""

FILE = "frontend/src/pages/optimized-resume/components/InlineResumeEditor.tsx"

with open(FILE, "r") as f:
    code = f.read()

# Replace the page count indicator to be neutral about multi-page resumes
old = """        {/* Page count indicator */}
        <div className={`mt-4 text-center text-xs font-medium ${
          totalPages > 1 ? 'text-amber-600' : 'text-emerald-600'
        }`}>
          {totalPages === 1
            ? <span className="flex items-center justify-center gap-1"><i className="ri-checkbox-circle-line" />Fits on 1 page</span>
            : <span className="flex items-center justify-center gap-1"><i className="ri-file-copy-2-line" />{totalPages} pages — consider condensing to fit on 1 page</span>
          }
        </div>"""

new = """        {/* Page count indicator */}
        <div className="mt-4 text-center text-xs font-medium text-slate-500">
          <span className="flex items-center justify-center gap-1">
            <i className={totalPages === 1 ? 'ri-file-line' : 'ri-file-copy-2-line'} />
            {totalPages} {totalPages === 1 ? 'page' : 'pages'}
          </span>
        </div>"""

assert old in code, "Could not find old page count indicator"
code = code.replace(old, new)

with open(FILE, "w") as f:
    f.write(code)

print("OK: Page count indicator is now neutral (no pressure to condense)")
