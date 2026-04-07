#!/usr/bin/env python3
"""
Patch generate_dynamic_template() to use job description context.
1. Add job_title parameter
2. Build JD context from role_dna + job_title
3. Inject JOB CONTEXT section into the Gemini prompt
4. Update RULES to reference JD alignment
"""

FILE = "backend/services/resume_os_orchestrator.py"

with open(FILE, "r") as f:
    src = f.read()

changes = 0

# 1. Add job_title parameter to method signature
old_sig = """    async def generate_dynamic_template(
        self,
        *,
        resume_data: Dict,
        variant_id: str,
        persona_angle: str,
        slot_index: int,
        role_dna: Dict,
        static_template_config: Optional[Dict] = None,
    ) -> Dict:"""

new_sig = """    async def generate_dynamic_template(
        self,
        *,
        resume_data: Dict,
        variant_id: str,
        persona_angle: str,
        slot_index: int,
        role_dna: Dict,
        job_title: str = "",
        static_template_config: Optional[Dict] = None,
    ) -> Dict:"""

if old_sig in src:
    src = src.replace(old_sig, new_sig, 1)
    print("1. Method signature: patched ✅")
    changes += 1
else:
    print("1. Method signature: NOT FOUND ✗")

# 2. After "density = ..." line, inject JD context builder
old_density = '''        density = "dense" if total_bullets > 15 else "moderate" if total_bullets > 8 else "sparse"'''

new_density = '''        density = "dense" if total_bullets > 15 else "moderate" if total_bullets > 8 else "sparse"

        # ── Build job description context ──
        jd_context_parts = []
        if job_title:
            jd_context_parts.append(f"Target Job Title: {job_title}")
        if isinstance(role_dna, dict):
            if role_dna.get("function"):
                jd_context_parts.append(f"Role Function: {role_dna['function']}")
            if role_dna.get("level"):
                jd_context_parts.append(f"Seniority Level: {role_dna['level']}")
            if role_dna.get("environment"):
                jd_context_parts.append(f"Work Environment: {role_dna['environment']}")
            if role_dna.get("cluster_name"):
                jd_context_parts.append(f"Industry Cluster: {role_dna['cluster_name']}")
        jd_block = ""
        if jd_context_parts:
            jd_block = "\\nTARGET JOB CONTEXT:\\n" + "\\n".join(f"- {p}" for p in jd_context_parts)'''

if old_density in src:
    src = src.replace(old_density, new_density, 1)
    print("2. JD context builder: patched ✅")
    changes += 1
else:
    print("2. JD context builder: NOT FOUND ✗")

# 3. Inject jd_block into the prompt after PERSON'S PROFILE section
# Find the SKILLS LIST section and inject before DESIGN BRIEF
old_design_brief = '''DESIGN BRIEF:
- Variant voice: {voice}'''

new_design_brief = '''{jd_block}

DESIGN BRIEF:
- Variant voice: {voice}'''

if old_design_brief in src:
    src = src.replace(old_design_brief, new_design_brief, 1)
    print("3. JD block in prompt: patched ✅")
    changes += 1
else:
    print("3. JD block in prompt: NOT FOUND ✗")

# 4. Update RULES to reference JD alignment
old_rule3 = '''3. Set sectionOrder to put the person's STRONGEST content first based on the angle'''

new_rule3 = '''3. Set sectionOrder to put the person's STRONGEST content first based on the angle AND the target job requirements. If targeting a technical role, lead with skills/experience. If targeting a leadership role, lead with impact/summary.
4. Tailor sectionTitles, bullet selection, and skill grouping to EMPHASIZE alignment with the target job. For example, if the target is "Senior Data Engineer", title the skills section "Data Engineering Stack" and prioritize data-related bullets.'''

# The old rule 4 was "Write creative sectionTitles..." which we want to keep but renumber
old_rule4 = '''4. Write creative sectionTitles that match the narrative (e.g. "Engineering Impact" not just "Experience")'''
new_rule4 = '''5. Write creative sectionTitles that match the narrative AND target role (e.g. "Engineering Impact at Scale" not just "Experience")'''

if old_rule3 in src:
    src = src.replace(old_rule3, new_rule3, 1)
    print("4a. Rule 3 (JD alignment): patched ✅")
    changes += 1
else:
    print("4a. Rule 3: NOT FOUND ✗")

if old_rule4 in src:
    src = src.replace(old_rule4, new_rule4, 1)
    print("4b. Rule 4 renumbered to 5: patched ✅")
    changes += 1
else:
    print("4b. Rule 4: NOT FOUND ✗")

# 5. Renumber rules 5-10 to 6-11
renumber_map = [
    ('5. Select 2-3 most compelling metrics', '6. Select 2-3 most compelling metrics'),
    ('6. For bulletStrategy:', '7. For bulletStrategy:'),
    ('7. If the person has 8+ skills,', '8. If the person has 8+ skills,'),
    ('8. Optionally rewrite the summary', '9. Optionally rewrite the summary'),
    ('9. Choose colors that feel professional.', '10. Choose colors that feel professional.'),
    ('10. NEVER fabricate data.', '11. NEVER fabricate data.'),
]
for old_num, new_num in renumber_map:
    if old_num in src:
        src = src.replace(old_num, new_num, 1)
        print(f"   Renumbered: {old_num[:30]}... ✅")

if changes > 0:
    with open(FILE, "w") as f:
        f.write(src)
    print(f"\nDone: {changes} major changes applied")
else:
    print("\n!! No changes made")
