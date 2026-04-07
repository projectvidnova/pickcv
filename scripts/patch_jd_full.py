#!/usr/bin/env python3
"""
Patch generate_dynamic_template to:
1. Accept job_description parameter
2. Include JD summary in the Gemini prompt
"""

FILE = "backend/services/resume_os_orchestrator.py"

with open(FILE, "r") as f:
    src = f.read()

changes = 0

# 1. Add job_description to method signature
old_sig = """        job_title: str = "",
        static_template_config: Optional[Dict] = None,"""

new_sig = """        job_title: str = "",
        job_description: str = "",
        static_template_config: Optional[Dict] = None,"""

if old_sig in src:
    src = src.replace(old_sig, new_sig, 1)
    print("1. Method signature: patched ✅")
    changes += 1
else:
    print("1. Method signature: NOT FOUND ✗")

# 2. Enhance the JD context block to include the full job description
old_jd_block = '''        jd_block = ""
        if jd_context_parts:
            jd_block = "\\nTARGET JOB CONTEXT:\\n" + "\\n".join(f"- {p}" for p in jd_context_parts)'''

new_jd_block = '''        # Include truncated JD text for rich context (max 800 chars to stay within prompt budget)
        if job_description:
            jd_summary = job_description[:800].strip()
            if len(job_description) > 800:
                jd_summary += "..."
            jd_context_parts.append(f"Job Description (excerpt):\\n{jd_summary}")

        jd_block = ""
        if jd_context_parts:
            jd_block = "\\nTARGET JOB CONTEXT:\\n" + "\\n".join(f"- {p}" for p in jd_context_parts)'''

if old_jd_block in src:
    src = src.replace(old_jd_block, new_jd_block, 1)
    print("2. JD text in prompt: patched ✅")
    changes += 1
else:
    print("2. JD text in prompt: NOT FOUND ✗")

if changes > 0:
    with open(FILE, "w") as f:
        f.write(src)
    print(f"\nDone: {changes} changes applied")
else:
    print("\n!! No changes made")
