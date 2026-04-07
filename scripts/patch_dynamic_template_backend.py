#!/usr/bin/env python3
"""Add generate_dynamic_template method to resume_os_orchestrator.py"""

FILE = "backend/services/resume_os_orchestrator.py"

with open(FILE, "r") as f:
    src = f.read()

# Insert the method right before compress_variant
MARKER = "    def compress_variant(\n        self,\n        *,\n        variant_data: Dict,"

NEW_METHOD = '''    # ── Dynamic Template Generation ──
    # Per-person LLM-designed template configs that adapt to the individual's content

    PERSONA_ANGLES = {
        "depth": {
            "instruction": "Focus on the person's deepest expertise. Lead with technical skills. Dense layout, tight spacing. Prioritize depth over breadth.",
            "preferred_layouts": ["sidebar-left", "two-col", "minimal"],
            "preferred_sections_first": ["skills", "experience"],
        },
        "impact": {
            "instruction": "Focus on measurable business outcomes. Lead with biggest numbers and achievements. Bold metrics. Business-friendly layout.",
            "preferred_layouts": ["header-single", "bold-bars", "centered"],
            "preferred_sections_first": ["experience", "summary"],
        },
        "narrative": {
            "instruction": "Tell a career story. Lead with a compelling summary. Generous spacing, elegant typography. Emphasize progression and growth.",
            "preferred_layouts": ["centered", "timeline", "header-single"],
            "preferred_sections_first": ["summary", "experience"],
        },
        "breadth": {
            "instruction": "Show versatility and range. Balanced sections. Group skills by domain. Use layout that gives equal weight to all sections.",
            "preferred_layouts": ["two-col", "sidebar-right", "bold-bars"],
            "preferred_sections_first": ["summary", "skills"],
        },
    }

    VARIANT_VOICE_MAP = {
        "V1": "technical — use precise engineering language, emphasize systems and tools",
        "V2": "business-outcome — focus on ROI, revenue, growth metrics",
        "V3": "enterprise-institutional — formal, process-oriented, governance language",
        "V4": "executive-visionary — strategic, leadership, organizational transformation",
        "V5": "research-analytical — evidence-based, methodological, data-driven",
        "V6": "operational-consulting — problem-diagnosis, optimization, efficiency",
        "V7": "creative-design — portfolio-oriented, user-centered, craft-focused",
        "V8": "generalist-versatile — balanced, adaptable, cross-functional",
        "V9": "specialist-expert — domain authority, deep knowledge, mentorship",
        "V10": "transition-adaptive — transferable skills, learning agility, pivoting",
    }

    async def generate_dynamic_template(
        self,
        *,
        resume_data: Dict,
        variant_id: str,
        persona_angle: str,
        slot_index: int,
        role_dna: Dict,
        static_template_config: Optional[Dict] = None,
    ) -> Dict:
        """Generate a unique, person-specific template configuration using LLM.

        Each call produces a DynamicTemplateConfig tailored to the individual's
        resume content, variant voice, and persona angle. No two calls produce
        the same result.
        """
        from services.gemini_service import gemini_service, _robust_parse_json, JSON_CONFIG

        angle_info = self.PERSONA_ANGLES.get(persona_angle, self.PERSONA_ANGLES["impact"])
        voice = self.VARIANT_VOICE_MAP.get(variant_id, self.VARIANT_VOICE_MAP["V1"])

        # ── Analyze the person's content for the prompt ──
        experience = resume_data.get("experience", [])
        skills = resume_data.get("skills", [])
        education = resume_data.get("education", [])
        summary = resume_data.get("summary", "")

        n_roles = len(experience)
        total_bullets = sum(len(exp.get("bullets", [])) for exp in experience)
        n_skills = len(skills)

        # Extract metrics from bullets for LLM context
        import re as _re
        all_bullets = []
        bullet_index_map = []  # (role_idx, bullet_idx, text)
        for ri, exp in enumerate(experience):
            for bi, bullet in enumerate(exp.get("bullets", [])):
                all_bullets.append(bullet)
                bullet_index_map.append({"role": ri, "bullet": bi, "text": bullet[:120]})

        metric_bullets = [b for b in all_bullets if _re.search(r'\\d+[%xX$+]|\\$[\\d,]+', b)]
        density = "dense" if total_bullets > 15 else "moderate" if total_bullets > 8 else "sparse"

        # Build role summaries for LLM
        role_summaries = []
        for i, exp in enumerate(experience):
            role_summaries.append(
                f"Role {i}: {exp.get('role', '')} at {exp.get('company', '')} "
                f"({exp.get('period', '')}) — {len(exp.get('bullets', []))} bullets"
            )

        # Static template context (what to differ from)
        static_ctx = ""
        if static_template_config:
            static_ctx = (
                f"The STATIC template (slot 1) already uses: "
                f"layout={static_template_config.get('layout', 'header-single')}, "
                f"font={static_template_config.get('fontFamily', 'sans-modern')}, "
                f"rhythm={static_template_config.get('verticalRhythm', 'standard')}, "
                f"headingStyle={static_template_config.get('headingStyle', 'underline')}, "
                f"boldTarget={static_template_config.get('boldTarget', 'metrics')}. "
                f"You MUST pick DIFFERENT values for at least layout and fontFamily."
            )

        # ── Build the prompt ──
        prompt = f"""You are a professional resume template designer. Given a person's actual resume data and a design brief, create a unique visual template configuration that best presents THIS specific person.

PERSON'S PROFILE:
- Current role: {experience[0].get('role', 'Professional') if experience else 'Professional'} at {experience[0].get('company', '') if experience else ''}
- Experience: {n_roles} roles, {total_bullets} achievement bullets
- Skills: {n_skills} skills listed{' — ' + ', '.join(skills[:10]) if skills else ''}
- Education: {len(education)} entries
- Summary length: {len(summary)} chars
- Content density: {density}
- Top metric-containing bullets ({len(metric_bullets)}): {'; '.join(b[:80] for b in metric_bullets[:5])}

ROLES:
{chr(10).join(role_summaries)}

ALL BULLETS (with indices for selection):
{chr(10).join(f'[{m["role"]},{m["bullet"]}] {m["text"]}' for m in bullet_index_map[:30])}

SKILLS LIST:
{', '.join(skills[:30])}

DESIGN BRIEF:
- Variant voice: {voice}
- Narrative angle: {persona_angle.upper()} — {angle_info['instruction']}
- This is template slot {slot_index} of 5 — must be VISUALLY DISTINCT from slot 1
{static_ctx}

AVAILABLE OPTIONS:
- layouts: ["header-single", "sidebar-left", "sidebar-right", "centered", "minimal", "bold-bars", "timeline", "two-col"]
- fontFamilies: ["sans-modern", "sans-clean", "serif-prestigious", "serif-executive", "tech-mono", "sans-display"]
- verticalRhythms: ["tight", "standard", "generous", "very-generous"]
- headingStyles: ["underline", "pill", "side", "caps"]
- boldTargets: ["stack", "metrics", "company", "scale", "skills", "none"]
- Preferred layouts for this angle: {angle_info['preferred_layouts']}

RULES:
1. Pick a layout that best serves this person's content shape and the narrative angle
2. Choose typography that matches the variant voice
3. Set sectionOrder to put the person's STRONGEST content first based on the angle
4. Write creative sectionTitles that match the narrative (e.g. "Engineering Impact" not just "Experience")
5. Select 2-3 most compelling metrics for achievementBarMetrics
6. For bulletStrategy: pick the strongest bullets per role for this angle (max 4 per role). Use actual [role,bullet] indices from the bullet list above. If the angle is "impact", prioritize metric-heavy bullets. If "depth", prioritize technical detail bullets.
7. If the person has 8+ skills, group them into 2-4 meaningful categories
8. Optionally rewrite the summary (2-3 sentences) to match this template's narrative angle. Keep ALL facts true — only change the framing/emphasis. If the existing summary is good for this angle, set summaryRewrite to null.
9. Choose colors that feel professional. primary must be a dark, muted hex color. accent is a complementary color.
10. NEVER fabricate data. Only reorder, select, or rephrase what exists.

Return a JSON object with this exact schema:
{{
  "templateName": "string — creative name for this template",
  "templateTagline": "string — 5-8 word tagline",
  "layout": "one of the layout options",
  "headingStyle": "one of the heading style options",
  "fontFamily": "one of the font family options",
  "verticalRhythm": "one of the rhythm options",
  "boldTarget": "one of the bold target options",
  "colorScheme": {{
    "primary": "#hex — dark professional color",
    "accent": "#hex — complementary accent",
    "headerBg": "#hex — header background (same or near primary for dark headers, #ffffff for light)",
    "headerText": "#hex — text on header (#ffffff for dark headers, primary for light)",
    "sectionLine": "#hex — section divider color",
    "bulletColor": "#hex — bullet point color",
    "skillBg": "#hex15 — skill tag background (light tint)",
    "skillText": "#hex — skill tag text color"
  }},
  "sectionOrder": ["summary", "experience", "skills", "education"],
  "sectionTitles": {{
    "summary": "string — creative title",
    "experience": "string — creative title",
    "skills": "string — creative title",
    "education": "string — creative title"
  }},
  "highlightedMetrics": ["metric1", "metric2"] ,
  "bulletStrategy": [
    {{"roleIndex": 0, "selectedBullets": [0, 2, 4], "maxBullets": 4}},
    {{"roleIndex": 1, "selectedBullets": [0, 1], "maxBullets": 3}}
  ],
  "summaryRewrite": "string or null",
  "skillsLayout": "tags or list or grouped",
  "skillGroups": [{{"label": "Category", "skills": ["skill1", "skill2"]}}],
  "showAchievementBar": true,
  "achievementBarMetrics": [{{"value": "$2M", "label": "Revenue Growth"}}]
}}"""

        try:
            response = gemini_service.client.models.generate_content(
                model=gemini_service.model_name,
                contents=prompt,
                config=JSON_CONFIG,
            )
            config = _robust_parse_json(response.text)

            # ── Validate and sanitize the LLM output ──
            valid_layouts = {"header-single", "sidebar-left", "sidebar-right", "centered", "minimal", "bold-bars", "timeline", "two-col"}
            valid_fonts = {"sans-modern", "sans-clean", "serif-prestigious", "serif-executive", "tech-mono", "sans-display"}
            valid_rhythms = {"tight", "standard", "generous", "very-generous"}
            valid_headings = {"underline", "pill", "side", "caps"}
            valid_bolds = {"stack", "metrics", "company", "scale", "skills", "none"}
            valid_sections = {"summary", "experience", "skills", "education"}

            config["layout"] = config.get("layout", "header-single") if config.get("layout") in valid_layouts else "header-single"
            config["fontFamily"] = config.get("fontFamily", "sans-modern") if config.get("fontFamily") in valid_fonts else "sans-modern"
            config["verticalRhythm"] = config.get("verticalRhythm", "standard") if config.get("verticalRhythm") in valid_rhythms else "standard"
            config["headingStyle"] = config.get("headingStyle", "underline") if config.get("headingStyle") in valid_headings else "underline"
            config["boldTarget"] = config.get("boldTarget", "metrics") if config.get("boldTarget") in valid_bolds else "metrics"

            # Validate sectionOrder
            order = config.get("sectionOrder", [])
            if not isinstance(order, list) or set(order) != valid_sections:
                config["sectionOrder"] = list(angle_info.get("preferred_sections_first", ["summary", "experience"])) + [
                    s for s in ["summary", "experience", "skills", "education"]
                    if s not in angle_info.get("preferred_sections_first", [])
                ]

            # Validate bulletStrategy indices
            bullet_strategy = config.get("bulletStrategy", [])
            if isinstance(bullet_strategy, list):
                validated_bs = []
                for bs in bullet_strategy:
                    ri = bs.get("roleIndex", 0)
                    if ri < len(experience):
                        role_bullet_count = len(experience[ri].get("bullets", []))
                        selected = [b for b in bs.get("selectedBullets", []) if isinstance(b, int) and 0 <= b < role_bullet_count]
                        if selected:
                            validated_bs.append({
                                "roleIndex": ri,
                                "selectedBullets": selected,
                                "maxBullets": bs.get("maxBullets", 4),
                            })
                config["bulletStrategy"] = validated_bs

            # Validate skillGroups reference real skills
            skill_groups = config.get("skillGroups")
            if isinstance(skill_groups, list) and skills:
                skills_lower = {s.lower() for s in skills}
                validated_groups = []
                for grp in skill_groups:
                    if isinstance(grp, dict) and grp.get("label") and isinstance(grp.get("skills"), list):
                        valid_skills = [s for s in grp["skills"] if s.lower() in skills_lower]
                        if valid_skills:
                            validated_groups.append({"label": grp["label"], "skills": valid_skills})
                config["skillGroups"] = validated_groups if validated_groups else None

            # Validate color scheme has all required fields
            color_defaults = {
                "primary": "#1e3a5f", "accent": "#2563eb",
                "headerBg": "#1e3a5f", "headerText": "#ffffff",
                "sectionLine": "#1e3a5f", "bulletColor": "#1e3a5f",
                "skillBg": "#1e3a5f15", "skillText": "#1e3a5f",
            }
            cs = config.get("colorScheme", {})
            if not isinstance(cs, dict):
                cs = {}
            for key, default in color_defaults.items():
                if key not in cs or not isinstance(cs[key], str):
                    cs[key] = default
            config["colorScheme"] = cs

            # Ensure required string fields
            config.setdefault("templateName", f"Dynamic {persona_angle.title()}")
            config.setdefault("templateTagline", f"{persona_angle.title()}-focused template")
            config.setdefault("skillsLayout", "tags")
            config.setdefault("showAchievementBar", True)

            config["_meta"] = {
                "slot": slot_index,
                "persona": persona_angle,
                "variant": variant_id,
                "dynamic": True,
            }

            return config

        except Exception as e:
            logger.error(f"Dynamic template generation failed for slot {slot_index}: {e}")
            # Fallback: return a reasonable static config based on angle
            fallback_layout = angle_info["preferred_layouts"][0] if angle_info.get("preferred_layouts") else "header-single"
            return {
                "templateName": f"{persona_angle.title()} Focus",
                "templateTagline": f"{persona_angle.title()}-optimized layout",
                "layout": fallback_layout,
                "headingStyle": "underline",
                "fontFamily": "sans-modern",
                "verticalRhythm": "standard",
                "boldTarget": "metrics",
                "colorScheme": {
                    "primary": "#1e3a5f", "accent": "#2563eb",
                    "headerBg": "#1e3a5f", "headerText": "#ffffff",
                    "sectionLine": "#1e3a5f", "bulletColor": "#1e3a5f",
                    "skillBg": "#1e3a5f15", "skillText": "#1e3a5f",
                },
                "sectionOrder": angle_info.get("preferred_sections_first", ["summary", "experience"]) + [
                    s for s in ["summary", "experience", "skills", "education"]
                    if s not in angle_info.get("preferred_sections_first", [])
                ],
                "sectionTitles": {"summary": "Summary", "experience": "Experience", "skills": "Skills", "education": "Education"},
                "bulletStrategy": [],
                "summaryRewrite": None,
                "skillsLayout": "tags",
                "skillGroups": None,
                "showAchievementBar": True,
                "achievementBarMetrics": [],
                "highlightedMetrics": [],
                "_meta": {"slot": slot_index, "persona": persona_angle, "variant": variant_id, "dynamic": True, "fallback": True},
            }

'''

if MARKER in src:
    src = src.replace(MARKER, NEW_METHOD + MARKER)
    with open(FILE, "w") as f:
        f.write(src)
    print("OK: generate_dynamic_template method added")
else:
    print("MARKER not found!")
    # Try to find it
    import re
    m = re.search(r'    def compress_variant\(', src)
    if m:
        print(f"Found compress_variant at position {m.start()}")
        src = src[:m.start()] + NEW_METHOD + src[m.start():]
        with open(FILE, "w") as f:
            f.write(src)
        print("OK: Added via regex fallback")
    else:
        print("!! Could not find compress_variant")
