"""Phase 3+4: Backend authenticity engine + simulation pivot upgrades.

Changes:
1. Add VARIANT_VERB_REGISTRY — variant-level preferred/suppressed verbs
2. Update _authenticity_engine to accept variant_id, add verb cap, dissonance detection
3. Update _simulation_layer to support design pivot recommendations
4. Update caller to pass variant_id to authenticity/simulation engines
"""

filepath = 'backend/services/resume_os_orchestrator.py'

with open(filepath, 'r') as f:
    content = f.read()

# ─────────────────────────────────────────────
# STEP 1: Add VARIANT_VERB_REGISTRY after CLUSTER_EXPERTISE
# ─────────────────────────────────────────────

insert_after = "}\n\n\nclass ResumeOSOrchestrator:"
insert_pos = content.find(insert_after)
if insert_pos < 0:
    print("FATAL: Cannot find end of CLUSTER_EXPERTISE + class marker")
    exit(1)

variant_registry = '''

# ── Variant-Level Verb Registry (Spec: Authenticity Engine Integration) ──
# Maps each variant to preferred "voice" verbs and suppressed verbs.
# Used to detect dissonance between template visual level and language level.
VARIANT_VERB_REGISTRY: Dict[str, Dict] = {
    "V1": {
        "name": "Signal Stack",
        "voice_level": "technical",
        "preferred_verbs": ["architected", "deployed", "instrumented", "built", "shipped", "optimized", "refactored", "migrated", "integrated", "automated"],
        "suppressed_verbs": ["strategic", "collaborative", "mentored", "oversaw", "managed stakeholders", "aligned teams"],
        "max_verb_repeats": 2,
    },
    "V2": {
        "name": "Outcome Ledger",
        "voice_level": "business",
        "preferred_verbs": ["drove", "generated", "exceeded", "grew", "delivered", "closed", "expanded", "negotiated", "launched", "increased"],
        "suppressed_verbs": ["helped", "worked on", "collaborated", "participated"],
        "max_verb_repeats": 2,
    },
    "V3": {
        "name": "Authority Frame",
        "voice_level": "executive_institutional",
        "preferred_verbs": ["led", "managed", "directed", "established", "governed", "implemented", "consolidated", "standardized", "oversaw", "championed"],
        "suppressed_verbs": ["coded", "built", "hacked", "prototyped", "debugged"],
        "max_verb_repeats": 2,
    },
    "V4": {
        "name": "Leadership Thesis",
        "voice_level": "executive_visionary",
        "preferred_verbs": ["orchestrated", "galvanized", "transformed", "pioneered", "envisioned", "spearheaded", "shaped", "influenced", "repositioned", "accelerated"],
        "suppressed_verbs": ["built", "coded", "designed", "fixed", "debugged", "tested", "wrote"],
        "max_verb_repeats": 1,
    },
    "V5": {
        "name": "Proof Sheet",
        "voice_level": "research",
        "preferred_verbs": ["researched", "published", "validated", "evaluated", "hypothesized", "developed", "analyzed", "demonstrated", "quantified", "modeled"],
        "suppressed_verbs": ["managed", "led team", "closed deal", "sold"],
        "max_verb_repeats": 2,
    },
    "V6": {
        "name": "Problem-Solver",
        "voice_level": "operational",
        "preferred_verbs": ["optimized", "streamlined", "reduced", "implemented", "redesigned", "eliminated", "automated", "standardized", "resolved", "mitigated"],
        "suppressed_verbs": ["envisioned", "pioneered", "galvanized"],
        "max_verb_repeats": 2,
    },
    "V7": {
        "name": "Portfolio Lead",
        "voice_level": "creative",
        "preferred_verbs": ["designed", "prototyped", "crafted", "created", "iterated", "researched", "validated", "shipped", "conceptualized", "tested"],
        "suppressed_verbs": ["managed stakeholders", "governed", "consolidated"],
        "max_verb_repeats": 2,
    },
    "V8": {
        "name": "Versatility Map",
        "voice_level": "generalist",
        "preferred_verbs": ["owned", "led", "built", "managed", "launched", "drove", "scaled", "operated", "delivered", "established"],
        "suppressed_verbs": [],
        "max_verb_repeats": 2,
    },
    "V9": {
        "name": "Domain Expert",
        "voice_level": "specialist",
        "preferred_verbs": ["specialized", "developed", "architected", "implemented", "designed", "scaled", "optimized", "mentored", "standardized", "led"],
        "suppressed_verbs": ["helped", "assisted", "participated"],
        "max_verb_repeats": 2,
    },
    "V10": {
        "name": "Transition Narrative",
        "voice_level": "adaptive",
        "preferred_verbs": ["transitioned", "adapted", "applied", "leveraged", "translated", "pivoted", "transferred", "reframed", "demonstrated", "developed"],
        "suppressed_verbs": [],
        "max_verb_repeats": 2,
    },
}

'''

content = content[:insert_pos] + variant_registry + content[insert_pos:]
print("STEP 1 DONE: Added VARIANT_VERB_REGISTRY")

# ─────────────────────────────────────────────
# STEP 2: Update _authenticity_engine signature and logic
# ─────────────────────────────────────────────

# Add variant_id parameter
old_auth_sig = '    def _authenticity_engine(self, resume_text: str, role_dna: Optional[Dict] = None) -> Dict:'
new_auth_sig = '    def _authenticity_engine(self, resume_text: str, role_dna: Optional[Dict] = None, variant_id: str = "V1") -> Dict:'
content = content.replace(old_auth_sig, new_auth_sig, 1)

# Add variant verb checks after the existing verb_penalty calculation
old_verb_penalty = """        verb_penalty = sum(5 for count in verb_counts.values() if count > 2)"""
new_verb_penalty = """        verb_penalty = sum(5 for count in verb_counts.values() if count > 2)

        # ── Variant-level verb registry checks (Spec: Engine 3.9) ──
        variant_verbs = VARIANT_VERB_REGISTRY.get(variant_id.upper(), {})
        max_repeats = variant_verbs.get("max_verb_repeats", 2)
        verb_cap_penalty = sum(3 for count in verb_counts.values() if count > max_repeats)
        verb_penalty += verb_cap_penalty

        # Check for suppressed verbs (dissonance detection)
        suppressed = [v.lower() for v in variant_verbs.get("suppressed_verbs", [])]
        dissonance_hits = []
        for sv in suppressed:
            if sv in text_lower:
                dissonance_hits.append(sv)
        dissonance_penalty = len(dissonance_hits) * 4

        # Check preferred verb usage (reward)
        preferred = [v.lower() for v in variant_verbs.get("preferred_verbs", [])]
        preferred_used = sum(1 for pv in preferred if pv in text_lower)
        preferred_bonus = min(5, preferred_used)  # up to 5 bonus points"""

content = content.replace(old_verb_penalty, new_verb_penalty, 1)

# Update the language_variation score to include new penalties/bonuses
old_lang_var = "        language_variation = max(0, 30 - verb_penalty - syntactic_penalty)"
new_lang_var = "        language_variation = max(0, min(30, 30 - verb_penalty - syntactic_penalty - dissonance_penalty + preferred_bonus))"
content = content.replace(old_lang_var, new_lang_var, 1)

# Add dissonance info to the return dict
old_auth_return = """        return {
            "authenticity_score": total,
            "interpretation": interpretation,
            "language_variation": language_variation,
            "voice_consistency": voice_consistency,
            "imperfection_tolerance": imperfection,
            "narrative_coherence": narrative_coherence,
            "verb_repetitions": {k: v for k, v in verb_counts.items() if v > 2},
            "metric_ratio": round(metric_ratio, 2),
            "cluster_voice_profile": expertise.get("voice_profile", "neutral"),
            "cluster_density_notes": cluster_density_notes,
            "anti_pattern_hits": anti_hits,
        }"""
new_auth_return = """        return {
            "authenticity_score": total,
            "interpretation": interpretation,
            "language_variation": language_variation,
            "voice_consistency": voice_consistency,
            "imperfection_tolerance": imperfection,
            "narrative_coherence": narrative_coherence,
            "verb_repetitions": {k: v for k, v in verb_counts.items() if v > 2},
            "metric_ratio": round(metric_ratio, 2),
            "cluster_voice_profile": expertise.get("voice_profile", "neutral"),
            "cluster_density_notes": cluster_density_notes,
            "anti_pattern_hits": anti_hits,
            "variant_voice_level": variant_verbs.get("voice_level", "neutral"),
            "dissonance_verbs": dissonance_hits,
            "dissonance_penalty": dissonance_penalty,
            "preferred_verbs_used": preferred_used,
            "verb_cap_violations": sum(1 for count in verb_counts.values() if count > max_repeats),
        }"""

content = content.replace(old_auth_return, new_auth_return, 1)
print("STEP 2 DONE: Updated _authenticity_engine with variant awareness")

# ─────────────────────────────────────────────
# STEP 3: Update _simulation_layer with design pivot logic
# ─────────────────────────────────────────────

old_sim_sig = '    def _simulation_layer(self, resume_text: str, role_dna: Dict) -> Dict:'
new_sim_sig = '    def _simulation_layer(self, resume_text: str, role_dna: Dict, variant_id: str = "V1") -> Dict:'
content = content.replace(old_sim_sig, new_sim_sig, 1)

# Add design pivot logic before the return statement
old_sim_return = '''        return {
            "simulation_score": simulation_score,
            "interpretation": sim_interpretation,
            "triage_pass_probability": triage_pass,
            "pedigree_heuristic_score": pedigree_score,
            "confirmation_bias_anchor": anchor_type,
            "confirmation_bias_score": anchor_score,
            "cognitive_load_mode": cognitive_mode,
            "cognitive_load_score": cognitive_load_score,
            "risk_signals": {
                "hard_risks": hard_risks,
                "soft_risks": soft_risks,
            },
            "triage_anchors": anchors,
        }'''
new_sim_return = '''        # ── Design Pivot Recommendations (Spec: Table 3) ──
        design_pivots: List[str] = []
        if triage_pass < 70:
            design_pivots.append("COMPRESSED_HEADER: Triage anchors not in top 40%. Switch to compressed header template.")
        if pedigree_score < 40 and variant_id.upper() in ("V3", "V4"):
            design_pivots.append("INSTITUTIONALIST: Pedigree signals weak for Authority/Leadership variant. Bold company names more aggressively.")
        bold_count = len(re.findall(r"\\*\\*[^*]+\\*\\*|<b>[^<]+</b>|<strong>[^<]+</strong>", text))
        if bold_count > len(bullets) * 3:
            design_pivots.append("MINIMALIST: Bold density too high (>3 per bullet). Switch to minimalist template; reduce secondary bolding.")
        if anchor_type == "NEUTRAL" and variant_id.upper() in ("V2", "V6"):
            design_pivots.append("HARD_SIGNAL_LEAD: First element is not a metric. Re-order to lead with Hard Signal bullet for Outcome/Ops variant.")

        return {
            "simulation_score": simulation_score,
            "interpretation": sim_interpretation,
            "triage_pass_probability": triage_pass,
            "pedigree_heuristic_score": pedigree_score,
            "confirmation_bias_anchor": anchor_type,
            "confirmation_bias_score": anchor_score,
            "cognitive_load_mode": cognitive_mode,
            "cognitive_load_score": cognitive_load_score,
            "risk_signals": {
                "hard_risks": hard_risks,
                "soft_risks": soft_risks,
            },
            "triage_anchors": anchors,
            "design_pivots": design_pivots,
        }'''

content = content.replace(old_sim_return, new_sim_return, 1)
print("STEP 3 DONE: Updated _simulation_layer with design pivot logic")

# ─────────────────────────────────────────────
# STEP 4: Update callers to pass variant_id
# ─────────────────────────────────────────────

old_auth_call = '            auth_result = self._authenticity_engine(variant.get("optimized_resume_text", ""), role_dna=role_dna)'
new_auth_call = '            auth_result = self._authenticity_engine(variant.get("optimized_resume_text", ""), role_dna=role_dna, variant_id=variant.get("id", "V1"))'
content = content.replace(old_auth_call, new_auth_call, 1)

old_sim_call = '            sim_result = self._simulation_layer(variant.get("optimized_resume_text", ""), role_dna)'
new_sim_call = '            sim_result = self._simulation_layer(variant.get("optimized_resume_text", ""), role_dna, variant_id=variant.get("id", "V1"))'
content = content.replace(old_sim_call, new_sim_call, 1)

print("STEP 4 DONE: Updated callers to pass variant_id")

with open(filepath, 'w') as f:
    f.write(content)

print(f"\n✅ Phase 3+4 complete! File: {filepath}")
print(f"   Total size: {len(content)} chars, {content.count(chr(10))+1} lines")
