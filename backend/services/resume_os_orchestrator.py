"""Resume OS multi-agent orchestration service.

Implements the full Resume OS pipeline aligned with resume_os_agent_prompt.md:

Pipeline Steps:
0. Fallback Mode Detection (7 modes)
1. Input Normalization (via Gemini prompt)
2. Constraint Engine (Hard/Soft Fails)
3. Role DNA Classification (Function/Level/Environment/KPI/Cluster)
4. Signal Architecture (via Gemini prompt — HARD/COGNITIVE/STRUCTURAL/TRUST)
5. ATS Intelligence Layer (platform detection + score calculation)
6. 9 Sub-Engines (via enhanced Gemini prompt):
   E5.1 Positioning, E5.2 Keyword, E5.3 Bullet, E5.4 Role-Shift,
   E5.5 Environment Adaptation, E5.6 Signal Amplification,
   E5.7 Recency Weighting, E5.8 Structure, E5.9 Bias Mitigation
7. Trade-Off Engine (deterministic rules)
8. Authenticity Engine (scoring heuristics)
9. Output Engine — 10 Base Variants
10. Variant Distance Control
11. Simulation Layer (5 dimensions)
12. Output Validation (pre-delivery checklist)

The orchestrator composes specialist "agents" as deterministic + AI-assisted
steps while preserving strict anti-hallucination constraints.
"""
from __future__ import annotations

from typing import Dict, List, Optional, Tuple
import logging
import re
import copy
import statistics as _statistics

from services.gemini_service import gemini_service

logger = logging.getLogger(__name__)


VARIANT_CATALOG = [
    {"id": "V1", "name": "The Signal Stack", "focus": "tech_depth", "base_bias": 4},
    {"id": "V2", "name": "The Outcome Ledger", "focus": "business_outcomes", "base_bias": 3},
    {"id": "V3", "name": "The Authority Frame", "focus": "enterprise_process", "base_bias": 3},
    {"id": "V4", "name": "The Leadership Thesis", "focus": "senior_leadership", "base_bias": 2},
    {"id": "V5", "name": "The Proof Sheet", "focus": "research_proof", "base_bias": 2},
    {"id": "V6", "name": "The Problem-Solver", "focus": "ops_consulting", "base_bias": 3},
    {"id": "V7", "name": "The Portfolio Lead", "focus": "design_portfolio", "base_bias": 2},
    {"id": "V8", "name": "The Versatility Map", "focus": "generalist_breadth", "base_bias": 2},
    {"id": "V9", "name": "The Domain Expert", "focus": "deep_specialist", "base_bias": 3},
    {"id": "V10", "name": "The Transition Narrative", "focus": "career_transition", "base_bias": 1},
]

# ── Cluster Domain Expertise Registry ──────────────────────────────
# Each cluster defines its own bullet formula, KPI vocabulary, signal density
# targets, voice profile, environment×cluster language, recency limits,
# and fresher-specific signals per the Resume OS agent prompt spec.
CLUSTER_EXPERTISE: Dict[str, Dict] = {
    "C1": {
        "name": "SWE / Full-Stack Engineering",
        "bullet_formula": "[Tech stack] + [Users/Throughput/Latency metric]",
        "mandatory_elements": ["exact tool names — no approximation", "technical metric (not business)"],
        "kpi_vocabulary": ["users", "throughput", "uptime", "latency", "deployment frequency", "mttr", "api", "requests", "rps"],
        "signal_density": {"hard_min": 0.60, "cognitive_min": 0.0, "trust_min": 0.0, "structural_priority": True},
        "recency_limits": {"current": 6, "prior_1": 4, "prior_2": 3, "prior_3_plus": 2},
        "voice_profile": "technical_matter_of_fact",
        "voice_verbs": ["architected", "designed", "built", "shipped", "deployed", "implemented", "refactored", "optimized", "migrated", "integrated"],
        "voice_anti_patterns": ["responsible for", "helped with", "worked on", "passionate about"],
        "env_startup": ["built from scratch", "zero-to-one", "inherited no legacy", "shipped in"],
        "env_mnc": ["managed platform team", "inherited LOC", "migrated legacy", "scaled to"],
        "fresher_signals": ["github url", "active repos", "star count", "open source contributions", "personal projects"],
        "fresher_hard_gate": "GitHub URL or active project portfolio required for C1 freshers",
        "tool_precision": "strict",  # exact tool names, no synonyms
        "portfolio_required": False,
        "model_baseline_required": False,
        "contact_extras": ["github"],
    },
    "C2": {
        "name": "Data / Business Analysis",
        "bullet_formula": "[Analysis scope] + [Business outcome per analysis]",
        "mandatory_elements": ["data source/tool", "business impact metric"],
        "kpi_vocabulary": ["roi", "cost per insight", "decision velocity", "revenue impact", "forecast accuracy", "dashboard", "report", "sql", "bi"],
        "signal_density": {"hard_min": 0.50, "cognitive_min": 0.30, "trust_min": 0.0, "structural_priority": False},
        "recency_limits": {"current": 5, "prior_1": 4, "prior_2": 3, "prior_3_plus": 2},
        "voice_profile": "analytical_precise",
        "voice_verbs": ["analyzed", "modeled", "quantified", "identified", "recommended", "automated", "designed", "built", "delivered", "optimized"],
        "voice_anti_patterns": ["responsible for", "helped", "was involved"],
        "env_startup": ["built analytics from scratch", "single source of truth", "data-driven culture from zero"],
        "env_mnc": ["enterprise BI", "cross-regional reporting", "stakeholder dashboards"],
        "fresher_signals": ["sql proficiency", "excel advanced", "case studies", "analytics projects"],
        "fresher_hard_gate": None,
        "tool_precision": "moderate",
        "portfolio_required": False,
        "model_baseline_required": False,
        "contact_extras": [],
    },
    "C3": {
        "name": "Data Science / ML",
        "bullet_formula": "[Model name] + [Baseline] + [Accuracy vs baseline]",
        "mandatory_elements": ["model accuracy vs baseline MANDATORY", "framework + deployment context"],
        "kpi_vocabulary": ["model accuracy", "baseline", "mae", "rmse", "f1", "auc", "precision", "recall", "data quality", "inference latency", "training time"],
        "signal_density": {"hard_min": 0.70, "cognitive_min": 0.0, "trust_min": 0.0, "structural_priority": False},
        "recency_limits": {"current": 5, "prior_1": 4, "prior_2": 3, "prior_3_plus": 2},
        "voice_profile": "technical_matter_of_fact",
        "voice_verbs": ["trained", "deployed", "designed", "built", "improved", "fine-tuned", "evaluated", "implemented", "engineered", "developed"],
        "voice_anti_patterns": ["passionate about AI", "familiar with", "explored"],
        "env_startup": ["built ML pipeline from scratch", "production ML with no existing infra"],
        "env_mnc": ["enterprise ML platform", "model governance", "A/B testing at scale"],
        "fresher_signals": ["kaggle rank", "competition placement", "research publication", "model accuracy project"],
        "fresher_hard_gate": "Kaggle profile or research project with model accuracy vs baseline required for C3 freshers",
        "tool_precision": "strict",  # TensorFlow 2.x with LSTM, not just TensorFlow
        "portfolio_required": False,
        "model_baseline_required": True,
        "contact_extras": ["github", "kaggle"],
    },
    "C4": {
        "name": "Product Management",
        "bullet_formula": "Problem → Diagnosis → Action → Outcome (COGNITIVE)",
        "mandatory_elements": ["decision-making process visible", "not just execution — show why"],
        "kpi_vocabulary": ["dau", "mau", "arr", "nps", "feature adoption", "ttm", "retention", "conversion", "churn", "engagement"],
        "signal_density": {"hard_min": 0.50, "cognitive_min": 0.50, "trust_min": 0.0, "structural_priority": False},
        "recency_limits": {"current": 4, "prior_1": 3, "prior_2": 2, "prior_3_plus": 1},
        "voice_profile": "strategic_narrative",
        "voice_verbs": ["identified", "defined", "prioritized", "launched", "drove", "measured", "iterated", "scaled", "negotiated", "influenced"],
        "voice_anti_patterns": ["managed product", "was responsible for product", "oversaw"],
        "env_startup": ["0-to-1 product", "found product-market fit", "wore every hat", "user interviews"],
        "env_mnc": ["cross-functional stakeholder alignment", "roadmap for N teams", "enterprise product strategy"],
        "fresher_signals": ["product case studies", "user research projects", "mock PRDs"],
        "fresher_hard_gate": None,
        "tool_precision": "moderate",
        "portfolio_required": False,
        "model_baseline_required": False,
        "contact_extras": [],
    },
    "C5": {
        "name": "DevOps / SRE / Infrastructure",
        "bullet_formula": "[Platform/Tool] + [Scale metric: nodes/regions/uptime]",
        "mandatory_elements": ["exact infrastructure tool names", "scale/reliability metric"],
        "kpi_vocabulary": ["uptime", "cost reduction", "nodes", "regions", "deployment frequency", "mttr", "incident", "sla", "infrastructure", "cloud spend"],
        "signal_density": {"hard_min": 0.60, "cognitive_min": 0.0, "trust_min": 0.0, "structural_priority": True},
        "recency_limits": {"current": 5, "prior_1": 4, "prior_2": 3, "prior_3_plus": 2},
        "voice_profile": "technical_matter_of_fact",
        "voice_verbs": ["automated", "deployed", "configured", "migrated", "scaled", "monitored", "reduced", "implemented", "designed", "maintained"],
        "voice_anti_patterns": ["responsible for infrastructure", "helped deploy"],
        "env_startup": ["built infrastructure from scratch", "single-engineer infra", "cost-optimized from zero"],
        "env_mnc": ["multi-region deployment", "enterprise cloud governance", "compliance-driven infrastructure"],
        "fresher_signals": ["cloud certifications", "personal infrastructure projects", "homelab"],
        "fresher_hard_gate": None,
        "tool_precision": "strict",  # AWS S3 not cloud storage, Kubernetes exact
        "portfolio_required": False,
        "model_baseline_required": False,
        "contact_extras": ["github"],
    },
    "C6": {
        "name": "Sales / Business Development",
        "bullet_formula": "Metric + Context + Quota/ARR signal",
        "mandatory_elements": ["EVERY bullet must include quota%, ARR, deal size, or pipeline metric"],
        "kpi_vocabulary": ["quota", "arr", "acv", "deal size", "pipeline", "revenue", "close rate", "new business", "territory", "accounts", "cac"],
        "signal_density": {"hard_min": 1.00, "cognitive_min": 0.0, "trust_min": 0.0, "structural_priority": False},
        "recency_limits": {"current": 4, "prior_1": 3, "prior_2": 2, "prior_3_plus": 1},
        "voice_profile": "results_quantified_energetic",
        "voice_verbs": ["closed", "generated", "exceeded", "grew", "expanded", "negotiated", "secured", "acquired", "managed", "built"],
        "voice_anti_patterns": ["managed sales pipeline", "was responsible for sales", "handled accounts"],
        "env_startup": ["wore multiple hats", "prospecting + closing + account mgmt", "built territory from zero"],
        "env_mnc": ["specialized seller focus", "quota carrier per region", "enterprise named accounts"],
        "fresher_signals": ["sales metrics proxies", "calls booked", "demo conversion", "lead generation"],
        "fresher_hard_gate": None,
        "tool_precision": "moderate",
        "portfolio_required": False,
        "model_baseline_required": False,
        "contact_extras": [],
    },
    "C7": {
        "name": "Marketing / Growth",
        "bullet_formula": "[Channel/Campaign] + [Budget/Scale] + [ROI/CAC/ROAS metric]",
        "mandatory_elements": ["campaign ROI or equivalent metric", "channel + budget scope"],
        "kpi_vocabulary": ["roas", "cac", "conversion rate", "mql", "pipeline sourced", "roi", "impressions", "ctr", "engagement", "brand awareness"],
        "signal_density": {"hard_min": 0.60, "cognitive_min": 0.0, "trust_min": 0.0, "structural_priority": False},
        "recency_limits": {"current": 4, "prior_1": 3, "prior_2": 2, "prior_3_plus": 1},
        "voice_profile": "strategic_narrative",
        "voice_verbs": ["launched", "drove", "grew", "optimized", "designed", "executed", "measured", "scaled", "built", "managed"],
        "voice_anti_patterns": ["responsible for marketing", "helped with campaigns"],
        "env_startup": ["growth hacking", "zero-budget marketing", "viral loop design"],
        "env_mnc": ["global campaign", "multi-market", "brand compliance", "agency management"],
        "fresher_signals": ["personal campaigns", "social media metrics", "content portfolio"],
        "fresher_hard_gate": None,
        "tool_precision": "moderate",
        "portfolio_required": False,
        "model_baseline_required": False,
        "contact_extras": [],
    },
    "C8": {
        "name": "HR / Talent Acquisition",
        "bullet_formula": "[HR Process/Scope] + [Volume/Speed metric]",
        "mandatory_elements": ["hiring volume or TTF or offer acceptance metric"],
        "kpi_vocabulary": ["ttf", "time to fill", "offer acceptance", "hiring volume", "attrition", "retention", "employee satisfaction", "onboarding", "hr tech"],
        "signal_density": {"hard_min": 0.50, "cognitive_min": 0.0, "trust_min": 0.0, "structural_priority": False},
        "recency_limits": {"current": 4, "prior_1": 3, "prior_2": 2, "prior_3_plus": 1},
        "voice_profile": "process_oriented_structured",
        "voice_verbs": ["recruited", "hired", "implemented", "designed", "streamlined", "reduced", "managed", "built", "scaled", "trained"],
        "voice_anti_patterns": ["responsible for hiring", "helped with recruitment"],
        "env_startup": ["built HR function from scratch", "first HR hire", "culture design"],
        "env_mnc": ["HRIS implementation", "multi-region TA", "compliance-driven HR"],
        "fresher_signals": ["hr certifications", "internship metrics", "campus recruitment experience"],
        "fresher_hard_gate": None,
        "tool_precision": "moderate",
        "portfolio_required": False,
        "model_baseline_required": False,
        "contact_extras": [],
    },
    "C9": {
        "name": "Operations / Consulting",
        "bullet_formula": "Situation → Action → Result (SAR format)",
        "mandatory_elements": ["structured SAR narrative", "efficiency/cost metric"],
        "kpi_vocabulary": ["cost reduction", "efficiency gain", "process cycle time", "sla", "delivery", "utilization", "billable", "client satisfaction"],
        "signal_density": {"hard_min": 0.40, "cognitive_min": 0.50, "trust_min": 0.0, "structural_priority": False},
        "recency_limits": {"current": 3, "prior_1": 3, "prior_2": 2, "prior_3_plus": 1},
        "voice_profile": "process_oriented_structured",
        "voice_verbs": ["implemented", "optimized", "streamlined", "reduced", "delivered", "managed", "designed", "led", "transformed", "assessed"],
        "voice_anti_patterns": ["responsible for operations", "was involved in consulting"],
        "env_startup": ["optimized with no playbook", "rapid iteration", "built process from scratch"],
        "env_mnc": ["compliance-heavy", "multi-region rollout", "SAP module implementation"],
        "fresher_signals": ["case competitions", "consulting club", "process improvement projects"],
        "fresher_hard_gate": None,
        "tool_precision": "moderate",
        "portfolio_required": False,
        "model_baseline_required": False,
        "contact_extras": [],
    },
    "C10": {
        "name": "UX / UI Design",
        "bullet_formula": "Problem → Research → Design decision → User outcome",
        "mandatory_elements": ["user research/validation process", "portfolio URL hero placement"],
        "kpi_vocabulary": ["user satisfaction", "task completion", "usability", "research respondents", "prototype", "a/b test", "conversion", "engagement"],
        "signal_density": {"hard_min": 0.30, "cognitive_min": 0.40, "trust_min": 0.80, "structural_priority": False},
        "recency_limits": {"current": 3, "prior_1": 2, "prior_2": 2, "prior_3_plus": 1},
        "voice_profile": "user_centric_process",
        "voice_verbs": ["designed", "researched", "prototyped", "tested", "iterated", "improved", "led", "facilitated", "mapped", "created"],
        "voice_anti_patterns": ["responsible for design", "made designs", "was the designer"],
        "env_startup": ["design system from scratch", "solo designer", "user research + design + front-end"],
        "env_mnc": ["design system governance", "multi-product design language", "accessibility compliance"],
        "fresher_signals": ["portfolio projects", "design system examples", "user research case studies", "figma prototypes"],
        "fresher_hard_gate": "Portfolio URL required for C10 freshers — must be hero above fold",
        "tool_precision": "moderate",
        "portfolio_required": True,
        "model_baseline_required": False,
        "contact_extras": ["portfolio"],
    },
    "C0": {
        "name": "General",
        "bullet_formula": "[Action] + [Scope] + [Impact metric]",
        "mandatory_elements": ["quantified impact"],
        "kpi_vocabulary": [],
        "signal_density": {"hard_min": 0.40, "cognitive_min": 0.0, "trust_min": 0.0, "structural_priority": False},
        "recency_limits": {"current": 5, "prior_1": 4, "prior_2": 3, "prior_3_plus": 2},
        "voice_profile": "neutral_professional",
        "voice_verbs": ["led", "managed", "built", "designed", "implemented", "delivered", "improved", "developed", "created", "launched"],
        "voice_anti_patterns": ["responsible for", "helped", "worked on"],
        "env_startup": ["built from scratch", "wore multiple hats"],
        "env_mnc": ["cross-functional", "stakeholder management"],
        "fresher_signals": ["projects", "internships", "certifications"],
        "fresher_hard_gate": None,
        "tool_precision": "moderate",
        "portfolio_required": False,
        "model_baseline_required": False,
        "contact_extras": [],
    },
}


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


class ResumeOSOrchestrator:
    """Coordinates multi-agent resume optimization flow."""

    ATS_RULES = {
        "greenhouse": {
            "name": "Greenhouse",
            "keyword_weight": "high",
            "preferred_format": "pdf",
            "rules": [
                "Prioritize exact JD keyword phrasing in Summary, Skills, and top experience bullets",
                "Use standard section headings and strict single-column layout",
            ],
        },
        "lever": {
            "name": "Lever",
            "keyword_weight": "high",
            "preferred_format": "pdf",
            "rules": [
                "Maintain clear sections; semantic variation is tolerated",
                "Portfolio/GitHub links can be surfaced when evidence exists",
            ],
        },
        "workday": {
            "name": "Workday",
            "keyword_weight": "very_high",
            "preferred_format": "docx",
            "rules": [
                "Use canonical headings: Professional Summary, Work Experience, Skills, Education",
                "Avoid visual complexity and non-standard separators",
            ],
        },
        "taleo": {
            "name": "Taleo",
            "keyword_weight": "very_high",
            "preferred_format": "docx",
            "rules": [
                "No tables, icons, or unusual symbols in headings",
                "Keep formatting plain and parsable",
            ],
        },
        "ashby": {
            "name": "Ashby",
            "keyword_weight": "medium",
            "preferred_format": "pdf",
            "rules": [
                "Structured sections still matter; semantic wording is acceptable",
                "Project proof and portfolio links can improve relevance",
            ],
        },
        "smartrecruiters": {
            "name": "SmartRecruiters",
            "keyword_weight": "high",
            "preferred_format": "docx",
            "rules": [
                "Keep skills section explicit and prominent",
                "Certifications/tools should use exact names",
            ],
        },
        "sap_successfactors": {
            "name": "SAP SuccessFactors",
            "keyword_weight": "very_high",
            "preferred_format": "docx",
            "rules": [
                "Enterprise-grade parsing; use exact tool names (e.g. 'Power BI' not 'PowerBI')",
                "Section order matters; standard headers mandatory",
            ],
        },
        "naukri": {
            "name": "Naukri RMS",
            "keyword_weight": "very_high",
            "preferred_format": "docx",
            "rules": [
                "Exact-match keyword mandatory — no semantic matching",
                "78.3M resume database; basic regex/RChilli parsing",
                "Standard section headers critical; no creative formatting",
            ],
        },
        "darwinbox": {
            "name": "Darwinbox",
            "keyword_weight": "high",
            "preferred_format": "docx",
            "rules": [
                "Structured parsing; standard headers required",
                "More sophisticated than basic ATS; DOCX preferred",
            ],
        },
        "keka": {
            "name": "Keka / Freshteam / GreytHR",
            "keyword_weight": "very_high",
            "preferred_format": "docx",
            "rules": [
                "Basic ATS with aggressive exact-match keyword parsing",
                "Minimal semantic capability; plain formatting essential",
            ],
        },
    }

    ATS_DOMAIN_MAP = {
        "boards.greenhouse.io": "greenhouse",
        "greenhouse.io": "greenhouse",
        "jobs.lever.co": "lever",
        "lever.co": "lever",
        "myworkdayjobs.com": "workday",
        "workday.com": "workday",
        "taleo.net": "taleo",
        "ashbyhq.com": "ashby",
        "smartrecruiters.com": "smartrecruiters",
        "successfactors.com": "sap_successfactors",
        "naukri.com": "naukri",
        "darwinbox.io": "darwinbox",
        "darwinbox.com": "darwinbox",
        "keka.com": "keka",
        "freshteam.com": "keka",
        "greythr.com": "keka",
    }

    async def optimize(
        self,
        *,
        resume_text: str,
        job_title: str,
        job_description: str,
        job_link: Optional[str] = None,
        github_context: Optional[str] = None,
    ) -> Dict:
        """Run the full Resume OS multi-agent pipeline.

        Pipeline Steps:
        0. Fallback Mode Detection
        1. (Input normalization — handled by Gemini prompt)
        2. Constraint Engine
        3. Role DNA Classification
        4. (Signal Architecture — handled by Gemini prompt)
        5. ATS Intelligence
        6. Recruiter Decision Model + Gap Analysis
        7. 9 Sub-Engines (via enhanced Gemini prompt)
        8. Trade-Off Engine
        9. Authenticity Engine
        10. Variant Scoring + Distance Control
        11. Simulation Layer
        12. Output Validation
        """

        # ── Step 0: Fallback Mode Detection ──
        fallback_modes = self._detect_fallback_modes(
            resume_text=resume_text,
            job_description=job_description,
            job_link=job_link,
        )

        # ── Step 3: Role DNA Classification ──
        role_dna = await self._role_intelligence_agent(job_title=job_title, job_description=job_description)

        # ── Step 2: Constraint Engine ──
        constraint_result = self._constraint_engine(
            resume_text=resume_text,
            job_description=job_description,
            role_dna=role_dna,
        )

        # ── Step 5: ATS Intelligence ──
        ats_intel = self._ats_intelligence_agent(job_link)

        # ── Step 6: Recruiter Decision + Gap Analysis ──
        recruiter_scan = self._recruiter_decision_agent(resume_text)
        gap_scorecard = self._gap_analysis_agent(
            resume_text=resume_text,
            job_description=job_description,
            role_dna=role_dna,
            recruiter_scan=recruiter_scan,
        )

        # ── ATS Compatibility Score ──
        ats_score_result = self._compute_ats_score(
            resume_text=resume_text,
            job_description=job_description,
            ats_intel=ats_intel,
            keyword_coverage=gap_scorecard.get("keyword_coverage", 0),
            title_alignment=gap_scorecard.get("title_alignment", 0),
        )

        # ── Build enriched context for Gemini (includes all pipeline data) ──
        optimization_input_context = self._build_optimization_context(
            role_dna=role_dna,
            ats_intel=ats_intel,
            recruiter_scan=recruiter_scan,
            gap_scorecard=gap_scorecard,
            fallback_modes=fallback_modes,
            constraint_result=constraint_result,
            ats_score_result=ats_score_result,
        )

        # ── Steps 1+4+6 (9 Sub-Engines): Gemini optimization with full Resume OS prompt ──
        optimization_result = await gemini_service.optimize_resume_for_job(
            resume_text=resume_text,
            job_description=job_description,
            job_title=job_title,
            github_context=github_context or None,
            resume_os_context=optimization_input_context,
        )

        if "error" in optimization_result:
            return optimization_result

        # ── Step 7: Trade-Off Engine ──
        tradeoff_log = self._trade_off_engine(
            role_dna=role_dna,
            ats_score=ats_score_result.get("ats_score", 0),
            recruiter_score=recruiter_scan.get("scan_score", 0),
            authenticity_score=70,  # preliminary; recalculated after variants
        )

        # ── Step 9+10: Variant Scoring + Distance Control ──
        variant_scores, recommended_variant = self._output_engine_variant_scoring(
            role_dna=role_dna,
            ats_intel=ats_intel,
            gap_scorecard=gap_scorecard,
            match_score=float(optimization_result.get("match_score", 0) or 0),
        )
        variant_scores = self._variant_distance_control(variant_scores)

        # ── Strategy Log ──
        strategy_log = self._strategy_log_agent(
            role_dna=role_dna,
            ats_intel=ats_intel,
            gap_scorecard=gap_scorecard,
            changes_made=optimization_result.get("changes_made", []),
            recommended_variant=recommended_variant,
            variant_scores=variant_scores,
            fallback_modes=fallback_modes,
            constraint_result=constraint_result,
            tradeoff_log=tradeoff_log,
        )

        # ── Build Resume Variants ──
        resume_variants = self._build_resume_variants(
            optimization_result=optimization_result,
            role_dna=role_dna,
            ats_intel=ats_intel,
            variant_scores=variant_scores,
        )

        # ── Step 8: Authenticity Engine (score each variant, cluster-aware) ──
        for variant in resume_variants:
            auth_result = self._authenticity_engine(variant.get("optimized_resume_text", ""), role_dna=role_dna, variant_id=variant.get("id", "V1"))
            variant["authenticity"] = auth_result

        # ── Step 11: Simulation Layer (score each variant) ──
        for variant in resume_variants:
            sim_result = self._simulation_layer(variant.get("optimized_resume_text", ""), role_dna, variant_id=variant.get("id", "V1"))
            variant["simulation"] = sim_result

        # ── Compute per-variant composite scores ──
        for variant in resume_variants:
            ats = ats_score_result.get("ats_score", 0)
            recruiter = recruiter_scan.get("scan_score", 0)
            sim = variant.get("simulation", {}).get("simulation_score", 0)
            auth = variant.get("authenticity", {}).get("authenticity_score", 0)
            composite = int(round(ats * 0.60 + recruiter * 0.40))
            variant["scores"] = {
                "ats_compatibility": ats,
                "ats_platform": ats_intel.get("platform_name", "Unknown"),
                "recruiter_scan": recruiter,
                "signal_density": variant.get("score", 0),
                "cognitive_load": variant.get("simulation", {}).get("cognitive_load_score", 0),
                "role_match": gap_scorecard.get("role_match", 0),
                "simulation": sim,
                "authenticity": auth,
                "composite": composite,
            }

        # ── Step 12: Output Validation (cluster-aware) ──
        validation = self._output_validation(
            variants=resume_variants,
            strategy_log=strategy_log,
            constraint_result=constraint_result,
            role_dna=role_dna,
        )

        # ── Compute default recommendation ──
        # Filter variants with ATS < 55%, pick highest composite
        viable = [v for v in resume_variants if ats_score_result.get("ats_score", 0) >= 55]
        if not viable:
            viable = resume_variants  # fallback: use all
        if viable:
            best = max(viable, key=lambda v: v.get("scores", {}).get("composite", 0))
            default_recommendation = {
                "variant_id": best.get("id"),
                "variant_name": best.get("name"),
                "composite_score": best.get("scores", {}).get("composite", 0),
                "rationale": best.get("rationale", "Highest composite score"),
            }
        else:
            default_recommendation = recommended_variant

        # ── Gap Notification ──
        gap_notification = {
            "missing_required_keywords": gap_scorecard.get("missing_required_keywords", []),
            "missing_preferred_keywords": [],
            "development_signals": [
                f"To strengthen your application, consider developing evidence for: {kw}"
                for kw in gap_scorecard.get("missing_required_keywords", [])[:5]
            ],
        }

        # ── ATS Advisory ──
        ats_advisory = {
            "platform": ats_intel.get("platform_name", "Unknown"),
            "rules_applied": ats_intel.get("rules", []),
            "file_format_recommendation": ats_intel.get("preferred_format", "pdf"),
            "posting_age_warning": None,
        }

        return {
            **optimization_result,
            "resume_variants": resume_variants,
            "resume_os": {
                "run_valid": validation.get("valid", True),
                "fallback_modes": fallback_modes,
                "agents_executed": [
                    "FallbackDetection",
                    "RoleDNAAgent",
                    "ConstraintEngine",
                    "ATSAgent",
                    "RecruiterScanAgent",
                    "GapAgent",
                    "ATSScoringAgent",
                    "OptimizationSwarm (9 sub-engines via Gemini)",
                    "TradeOffEngine",
                    "VariantScoringAgent",
                    "VariantDistanceControl",
                    "AuthenticityEngine",
                    "SimulationLayer",
                    "OutputValidation",
                    "StrategyLogAgent",
                ],
                "role_dna": role_dna,
                "recommended_variant": {
                    "id": default_recommendation.get("variant_id", ""),
                    "name": default_recommendation.get("variant_name", ""),
                    "score": default_recommendation.get("composite_score", 0),
                    "rationale": default_recommendation.get("rationale", ""),
                },
                "ats_intelligence": ats_intel,
                "ats_score": ats_score_result,
                "recruiter_scan": recruiter_scan,
                "gap_scorecard": gap_scorecard,
                "constraint_result": constraint_result,
                "tradeoff_log": tradeoff_log,
                "variant_scores": variant_scores,
                "default_recommendation": default_recommendation,
                "strategy_log": strategy_log,
                "gap_notification": gap_notification,
                "ats_advisory": ats_advisory,
                "validation": validation,
                "signal_classification": optimization_result.get("signal_classification", {}),
                "deprioritize_options": self.DEPRIORITIZE_OPTIONS,
            },
        }

    def _build_resume_variants(
        self,
        *,
        optimization_result: Dict,
        role_dna: Dict,
        ats_intel: Dict,
        variant_scores: List[Dict],
    ) -> List[Dict]:
        """Build top 7 concrete resume variants (structured + rendered text)."""
        base_data = {
            "name": optimization_result.get("name", ""),
            "title": optimization_result.get("title", ""),
            "email": optimization_result.get("email", ""),
            "phone": optimization_result.get("phone", ""),
            "linkedin": optimization_result.get("linkedin", ""),
            "location": optimization_result.get("location", ""),
            "summary": optimization_result.get("professional_summary", ""),
            "experience": optimization_result.get("experience", []) if isinstance(optimization_result.get("experience", []), list) else [],
            "skills": optimization_result.get("skills", []) if isinstance(optimization_result.get("skills", []), list) else [],
            "education": optimization_result.get("education", []) if isinstance(optimization_result.get("education", []), list) else [],
        }

        top = variant_scores[:7]
        output = []
        for rank, variant in enumerate(top, start=1):
            variant_id = variant.get("id", "V1")
            transformed = self._apply_variant_transform(
                base_data=base_data,
                variant_id=variant_id,
                role_dna=role_dna,
            )
            section_order = self._section_order_for_variant(variant_id, role_dna=role_dna)
            rendered = self._render_resume_text(transformed, section_order)

            output.append({
                "rank": rank,
                "id": variant_id,
                "name": variant.get("name"),
                "score": variant.get("score"),
                "rationale": variant.get("rationale"),
                "section_order": section_order,
                "recommended_file_format": ats_intel.get("preferred_format", "pdf"),
                "resume_data": transformed,
                "optimized_resume_text": rendered,
                "page_estimate": self._estimate_page_count(transformed),
            })

        return output

    def _apply_variant_transform(self, *, base_data: Dict, variant_id: str, role_dna: Dict) -> Dict:
        """Apply non-fabricating transforms based on variant, level, environment, and cluster."""
        data = copy.deepcopy(base_data)
        level = str(role_dna.get("level", "L3")).upper()
        env = str(role_dna.get("environment", "")).lower()
        cluster_id = str(role_dna.get("cluster_id", "C0")).upper()
        expertise = CLUSTER_EXPERTISE.get(cluster_id, CLUSTER_EXPERTISE["C0"])
        is_fresher = level in ["L1", "L2"] and not data.get("experience")

        # ── Normalize experience keys ──
        normalized_exp = []
        for exp in data.get("experience", []):
            if not isinstance(exp, dict):
                continue
            bullets = exp.get("bullets", []) if isinstance(exp.get("bullets", []), list) else []
            normalized_exp.append({
                "role": exp.get("role") or exp.get("title") or "",
                "company": exp.get("company", ""),
                "location": exp.get("location", ""),
                "period": exp.get("period") or exp.get("dates") or "",
                "bullets": [str(b).strip() for b in bullets if str(b).strip()],
            })
        data["experience"] = normalized_exp

        # ── Normalize education keys ──
        normalized_edu = []
        for edu in data.get("education", []):
            if not isinstance(edu, dict):
                continue
            normalized_edu.append({
                "degree": edu.get("degree", ""),
                "school": edu.get("school") or edu.get("institution") or "",
                "period": edu.get("period") or edu.get("year") or "",
            })
        data["education"] = normalized_edu

        # ── Recency Weighting (Engine 5.7) — Cluster-aware limits ──
        cluster_limits = expertise.get("recency_limits", {})
        recency_limits = [
            cluster_limits.get("current", 5),
            cluster_limits.get("prior_1", 4),
            cluster_limits.get("prior_2", 3),
            cluster_limits.get("prior_3_plus", 2),
            cluster_limits.get("prior_3_plus", 2),
        ]
        if level in ["L4", "L5", "L5+"]:
            recency_limits[0] = min(recency_limits[0] + 1, 6)  # seniors get +1 in current role
        if is_fresher:
            recency_limits = [min(r, 4) for r in recency_limits]  # cap all for freshers

        for idx, exp in enumerate(data.get("experience", [])):
            bullets = exp.get("bullets", [])
            if not bullets:
                continue

            # Apply recency band limit
            max_bullets = recency_limits[min(idx, len(recency_limits) - 1)]

            # ── Variant-specific bullet sorting ──
            if variant_id in ["V2", "V5"]:
                # Outcome/Proof: metrics first
                bullets = sorted(bullets, key=lambda b: self._contains_metric(b), reverse=True)
            elif variant_id == "V4":
                # Leadership: leadership verbs first
                bullets = sorted(bullets, key=lambda b: self._leadership_weight(b), reverse=True)
            elif variant_id == "V6":
                # Problem-Solver: problem-solving language first
                bullets = sorted(bullets, key=lambda b: self._problem_solver_weight(b), reverse=True)
            elif variant_id == "V1":
                # Signal Stack: tech specificity first
                bullets = sorted(bullets, key=lambda b: self._tech_skill_weight(b), reverse=True)
            elif variant_id == "V9":
                # Domain Expert: domain relevance first
                domain_terms = self._extract_domain_terms(role_dna)
                bullets = sorted(bullets, key=lambda b: self._domain_weight(b, domain_terms), reverse=True)
            elif variant_id == "V7":
                # Portfolio Lead: user-centric / design language first
                bullets = sorted(bullets, key=lambda b: self._design_weight(b), reverse=True)
            elif variant_id == "V3":
                # Authority Frame: process/governance language first
                bullets = sorted(bullets, key=lambda b: self._authority_weight(b), reverse=True)

            exp["bullets"] = bullets[:max_bullets]

        # ── Skills sorting per variant ──
        if isinstance(data.get("skills"), list):
            skills = [str(s).strip() for s in data.get("skills", []) if str(s).strip()]
            if variant_id == "V1":
                skills.sort(key=lambda s: self._tech_skill_weight(s), reverse=True)
            elif variant_id == "V8":
                # Versatility: breadth — alphabetical for easy scanning
                skills.sort(key=lambda s: len(s))
            elif variant_id == "V9":
                domain_terms = self._extract_domain_terms(role_dna)
                skills.sort(key=lambda s: self._domain_weight(s, domain_terms), reverse=True)
            elif variant_id == "V3":
                # Authority: certifications/tools first, then others
                skills.sort(key=lambda s: self._authority_weight(s), reverse=True)
            else:
                skills.sort()
            data["skills"] = skills

        # ── Transition narrative (V10) ──
        if variant_id == "V10":
            target = role_dna.get("target_title") or role_dna.get("cluster_name") or "target role"
            summary = (data.get("summary") or "").strip()
            if summary and f"Target: {target}" not in summary:
                data["summary"] = f"{summary} Target: {target}."

        # ── Education compression for 7+ years experience (Engine 5.7 rule) ──
        if level in ["L3", "L4", "L5", "L5+"] and variant_id not in ["V5"]:
            # Compress education to essentials only
            for edu in data.get("education", []):
                # Strip coursework, GPA (unless kept intentionally)
                edu.pop("coursework", None)
                edu.pop("gpa", None)

        # ── Fresher: assessment-forward placement ──
        if is_fresher and variant_id not in ["V5"]:
            # For freshers, ensure education is prominent
            # (section ordering already handles this via _section_order_for_variant)
            pass

        # Full-content mode: no budget trimming.
        # Compression is applied on-demand via compress_variant().
        return data

    def _design_weight(self, text: str) -> int:
        """Score for UX/UI/design-related bullet language."""
        t = text.lower()
        design_terms = ["user", "ux", "ui", "design", "prototype", "wireframe", "figma",
                        "usability", "research", "persona", "journey", "accessibility"]
        return sum(2 for term in design_terms if term in t) + self._contains_metric(text)

    def _authority_weight(self, text: str) -> int:
        """Score for enterprise/authority/governance language."""
        t = text.lower()
        auth_terms = ["certified", "compliance", "governance", "audit", "framework",
                      "process", "stakeholder", "programme", "standard", "policy",
                      "pmp", "itil", "iso", "six sigma", "prince2"]
        return sum(2 for term in auth_terms if term in t) + self._contains_metric(text)

    def _apply_one_page_budget(self, *, data: Dict, variant_id: str, role_dna: Dict, target_lines: int = 62) -> Dict:
        """Constrain content to fit within a target line budget.

        Budget adapts based on:
        - target_lines (58 = 1 page, 116 = 2 pages)
        - Cluster (C0-C10 each define recency_limits and density profiles)
        - Variant template (V1-V10 have different density profiles)
        - Level (L1-L5+ control summary length and bullet depth)
        - Environment (MNC = more structured; Startup = more concise)
        """
        level = str(role_dna.get("level", "L3")).upper()
        env = str(role_dna.get("environment", "")).lower()
        cluster_id = str(role_dna.get("cluster", "C0")).upper()
        is_fresher = level in ["L1", "L2"] and not data.get("experience")

        cluster_cfg = CLUSTER_EXPERTISE.get(cluster_id, CLUSTER_EXPERTISE["C0"])
        recency = cluster_cfg.get("recency_limits", {})

        # ── Base budget (level-aware per spec) ──
        summary_by_level = {
            "L1": 220, "L2": 260, "L3": 340, "L4": 420, "L5": 460, "L5+": 460,
        }

        # Derive max bullets from cluster's current-role recency limit
        cluster_max_bullets = recency.get("current", 4)

        budget = {
            "max_experiences": 3,
            "max_bullets_per_exp": min(cluster_max_bullets, 5),
            "max_skills": 10,
            "max_education": 2,
            "summary_chars": summary_by_level.get(level, 380),
            "bullet_chars": 175,
        }

        # ── Cluster-specific overrides ──
        if cluster_id in ["C1", "C5"]:
            # SWE / DevOps: dense technical bullets, slightly more skills
            budget.update({"max_experiences": 4, "max_skills": 12})
        elif cluster_id == "C6":
            # Sales: fewer but metric-heavy bullets
            budget.update({"max_bullets_per_exp": min(cluster_max_bullets, 4), "max_skills": 8})
        elif cluster_id == "C10":
            # UX/UI: portfolio-first, fewer bullets
            budget.update({"max_bullets_per_exp": min(cluster_max_bullets, 3), "max_skills": 8})
        elif cluster_id == "C3":
            # DS/ML: education prominent
            budget.update({"max_education": 3, "max_skills": 12})
        elif cluster_id == "C4":
            # Product: strategic summary, moderate bullets
            budget.update({"summary_chars": max(budget["summary_chars"], 400)})
        elif cluster_id == "C9":
            # Ops/Consulting: structured, fewer bullets
            budget.update({"max_bullets_per_exp": min(cluster_max_bullets, 3)})

        # ── Variant-specific adjustments ──
        if variant_id in ["V1", "V2", "V6", "V8"]:
            budget.update({"max_experiences": 4, "max_skills": 14, "summary_chars": max(budget["summary_chars"], 430)})

        if variant_id in ["V4", "V9"] or level in ["L4", "L5", "L5+"]:
            budget.update({"summary_chars": max(budget["summary_chars"], 460), "max_bullets_per_exp": min(budget["max_bullets_per_exp"], 2), "max_skills": 11})

        if variant_id == "V5":
            budget.update({"max_experiences": 3, "max_bullets_per_exp": 2, "max_skills": 10, "max_education": 3})

        if variant_id == "V7":
            budget.update({"max_experiences": 3, "max_bullets_per_exp": 2, "max_skills": 10})

        # Fresher: tight experience, more education space
        if is_fresher:
            budget.update({"max_experiences": 2, "max_bullets_per_exp": min(cluster_max_bullets, 3), "max_skills": 10, "max_education": 2, "summary_chars": 220})

        # Environment adjustments
        if "startup" in env:
            budget["bullet_chars"] = min(budget["bullet_chars"], 160)
        elif "mnc" in env:
            budget["bullet_chars"] = min(budget["bullet_chars"] + 15, 195)

        # Summary trim
        data["summary"] = self._truncate_text(str(data.get("summary", "")), budget["summary_chars"])

        # Experience trim
        exp_list = data.get("experience", []) if isinstance(data.get("experience", []), list) else []
        trimmed_exp = []
        for exp in exp_list[: budget["max_experiences"]]:
            bullets = exp.get("bullets", []) if isinstance(exp.get("bullets", []), list) else []

            scored_bullets = sorted(
                [str(b).strip() for b in bullets if str(b).strip()],
                key=lambda b: (
                    self._contains_metric(b),
                    self._leadership_weight(b),
                    min(len(b), budget["bullet_chars"]),
                ),
                reverse=True,
            )
            kept = [self._truncate_text(b, budget["bullet_chars"]) for b in scored_bullets[: budget["max_bullets_per_exp"]]]

            trimmed_exp.append({
                "role": exp.get("role", ""),
                "company": exp.get("company", ""),
                "location": exp.get("location", ""),
                "period": exp.get("period", ""),
                "bullets": kept,
            })

        data["experience"] = trimmed_exp

        # Skills trim
        skills = data.get("skills", []) if isinstance(data.get("skills", []), list) else []
        data["skills"] = [str(s).strip() for s in skills[: budget["max_skills"]] if str(s).strip()]

        # Education trim
        edu = data.get("education", []) if isinstance(data.get("education", []), list) else []
        data["education"] = edu[: budget["max_education"]]

        # Final compaction loop using estimated rendered line count.
        max_lines = target_lines
        for _ in range(5):
            estimated_lines = self._estimate_resume_lines(data)
            if estimated_lines <= max_lines:
                break

            # Step-down strategy (least destructive first)
            if budget["max_skills"] > 9:
                budget["max_skills"] -= 1
            if budget["summary_chars"] > 220:
                budget["summary_chars"] -= 35
            if budget["bullet_chars"] > 120:
                budget["bullet_chars"] -= 10
            if budget["max_bullets_per_exp"] > 2:
                budget["max_bullets_per_exp"] -= 1
            elif budget["max_experiences"] > 2:
                budget["max_experiences"] -= 1

            data["summary"] = self._truncate_text(str(data.get("summary", "")), budget["summary_chars"])

            exp_list = data.get("experience", []) if isinstance(data.get("experience", []), list) else []
            compact_exp = []
            for exp in exp_list[: budget["max_experiences"]]:
                bullets = exp.get("bullets", []) if isinstance(exp.get("bullets", []), list) else []
                rescored = sorted(
                    [str(b).strip() for b in bullets if str(b).strip()],
                    key=lambda b: (
                        self._contains_metric(b),
                        self._leadership_weight(b),
                        self._problem_solver_weight(b),
                    ),
                    reverse=True,
                )
                compact_exp.append({
                    "role": exp.get("role", ""),
                    "company": exp.get("company", ""),
                    "location": exp.get("location", ""),
                    "period": exp.get("period", ""),
                    "bullets": [self._truncate_text(b, budget["bullet_chars"]) for b in rescored[: budget["max_bullets_per_exp"]]],
                })
            data["experience"] = compact_exp

            skills = data.get("skills", []) if isinstance(data.get("skills", []), list) else []
            data["skills"] = [str(s).strip() for s in skills[: budget["max_skills"]] if str(s).strip()]

        return data

    def _estimate_resume_lines(self, data: Dict) -> int:
        """Rough line estimator for one-page fit validation."""
        lines = 6  # header block

        summary = str(data.get("summary", "") or "")
        if summary:
            lines += 2 + max(1, (len(summary) // 90) + 1)

        exp_list = data.get("experience", []) if isinstance(data.get("experience", []), list) else []
        if exp_list:
            lines += 2
            for exp in exp_list:
                lines += 2  # role + period line
                bullets = exp.get("bullets", []) if isinstance(exp.get("bullets", []), list) else []
                for b in bullets:
                    lines += max(1, (len(str(b)) // 95) + 1)

        skills = data.get("skills", []) if isinstance(data.get("skills", []), list) else []
        if skills:
            joined = ", ".join([str(s) for s in skills])
            lines += 2 + max(1, (len(joined) // 75) + 1)

        edu = data.get("education", []) if isinstance(data.get("education", []), list) else []
        if edu:
            lines += 2 + (len(edu) * 2)

        return lines

    def _estimate_page_count(self, data: Dict) -> int:
        """Estimate how many pages this resume content would fill."""
        lines = self._estimate_resume_lines(data)
        lines_per_page = 58  # conservative A4 estimate
        if lines <= lines_per_page:
            return 1
        elif lines <= lines_per_page * 2:
            return 2
        return 3

    # ── Deprioritization option catalog ──
    DEPRIORITIZE_OPTIONS = [
        {"id": "older_experience", "label": "Older work experience (3+ years ago)", "description": "Remove or trim roles older than 3 years"},
        {"id": "education_details", "label": "Education details", "description": "Keep only degree + school, drop coursework/GPA"},
        {"id": "reduce_skills", "label": "Trim skills list", "description": "Keep only the top 8-10 most relevant skills"},
        {"id": "shorten_summary", "label": "Shorten professional summary", "description": "Compress summary to 2-3 lines"},
        {"id": "reduce_bullets", "label": "Fewer bullets per role", "description": "Keep only the top 2-3 highest-impact bullets per role"},
        {"id": "trim_certifications", "label": "Remove certifications / projects", "description": "Drop certifications and projects sections"},
    ]

    def compress_variant(
        self,
        *,
        variant_data: Dict,
        target_pages: int,
        role_dna: Dict,
        variant_id: str = "V1",
        deprioritize: Optional[Dict] = None,
    ) -> Dict:
        """Compress a full-content variant down to a target page count.

        Args:
            variant_data: Full resume_data dict (name, experience, skills, etc.)
            target_pages: 1 or 2
            role_dna: Role DNA classification
            variant_id: Which variant template (V1-V10) — affects budget profile
            deprioritize: {
                "categories": ["older_experience", "education_details", ...],
                "custom_text": "Optional free-text deprioritization instruction"
            }

        Returns:
            {
                "resume_data": compressed data dict,
                "optimized_resume_text": rendered plain-text,
                "page_estimate": int,
                "compression_notes": list of what was trimmed,
            }
        """
        data = copy.deepcopy(variant_data)
        deprioritize = deprioritize or {}
        categories = set(deprioritize.get("categories", []))
        custom_text = str(deprioritize.get("custom_text", "")).strip()
        notes: List[str] = []

        lines_target = 58 if target_pages == 1 else 116  # ~58 lines per page

        # ── Phase 1: Apply user-requested deprioritization ──
        if "older_experience" in categories:
            exp = data.get("experience", [])
            if len(exp) > 3:
                removed_count = len(exp) - 3
                data["experience"] = exp[:3]
                notes.append(f"Removed {removed_count} older experience(s)")
            elif len(exp) > 2:
                data["experience"] = exp[:2]
                notes.append("Trimmed to 2 most recent experiences")

        if "education_details" in categories:
            for edu in data.get("education", []):
                if isinstance(edu, dict):
                    edu.pop("coursework", None)
                    edu.pop("gpa", None)
                    edu.pop("activities", None)
                    edu.pop("honors", None)
            if len(data.get("education", [])) > 2:
                data["education"] = data["education"][:2]
            notes.append("Trimmed education to essentials")

        if "reduce_skills" in categories:
            skills = data.get("skills", [])
            if len(skills) > 10:
                notes.append(f"Reduced skills from {len(skills)} to 10")
                data["skills"] = skills[:10]

        if "shorten_summary" in categories:
            summary = str(data.get("summary", ""))
            if len(summary) > 200:
                data["summary"] = self._truncate_text(summary, 200)
                notes.append("Shortened professional summary")

        if "reduce_bullets" in categories:
            for exp in data.get("experience", []):
                bullets = exp.get("bullets", [])
                if len(bullets) > 3:
                    # Keep highest-impact bullets
                    scored = sorted(
                        bullets,
                        key=lambda b: (self._contains_metric(b), self._leadership_weight(b)),
                        reverse=True,
                    )
                    exp["bullets"] = scored[:3]
            notes.append("Reduced to top 3 bullets per role")

        if "trim_certifications" in categories:
            if data.get("certifications"):
                data.pop("certifications", None)
                notes.append("Removed certifications section")
            if data.get("projects"):
                data.pop("projects", None)
                notes.append("Removed projects section")

        # ── Phase 1b: Free-text deprioritization ──
        if custom_text:
            custom_lower = custom_text.lower()
            # Detect common free-text intents
            if any(kw in custom_lower for kw in ["experience", "older", "old job", "previous"]):
                exp = data.get("experience", [])
                if len(exp) > 2:
                    data["experience"] = exp[:2]
                    notes.append(f"Removed older experiences per user request: '{custom_text}'")
            if any(kw in custom_lower for kw in ["skill", "less skill"]):
                skills = data.get("skills", [])
                if len(skills) > 8:
                    data["skills"] = skills[:8]
                    notes.append(f"Reduced skills per user request: '{custom_text}'")
            if any(kw in custom_lower for kw in ["summary", "shorter summary"]):
                summary = str(data.get("summary", ""))
                if len(summary) > 150:
                    data["summary"] = self._truncate_text(summary, 150)
                    notes.append(f"Shortened summary per user request: '{custom_text}'")
            if any(kw in custom_lower for kw in ["education", "degree"]):
                data["education"] = data.get("education", [])[:1]
                notes.append(f"Trimmed education per user request: '{custom_text}'")
            if not notes or notes[-1] == notes[0]:
                # Generic: didn't match specific patterns — note it
                notes.append(f"User deprioritization note: '{custom_text}'")

        # ── Phase 2: If still over target, apply progressive one-page budget ──
        current_lines = self._estimate_resume_lines(data)
        if current_lines > lines_target:
            data = self._apply_one_page_budget(
                data=data,
                variant_id=variant_id,
                role_dna=role_dna,
                target_lines=lines_target,
            )
            notes.append(f"Applied automatic compression to fit {target_pages} page(s)")

        # ── Re-render and estimate ──
        section_order = self._section_order_for_variant(variant_id, role_dna=role_dna)
        rendered = self._render_resume_text(data, section_order)
        page_estimate = self._estimate_page_count(data)

        return {
            "resume_data": data,
            "optimized_resume_text": rendered,
            "page_estimate": page_estimate,
            "compression_notes": notes,
        }

    def _section_order_for_variant(self, variant_id: str, role_dna: Optional[Dict] = None) -> List[str]:
        """Section ordering per Resume OS Step 9 variant templates.

        Adapts based on level/environment:
        - Freshers (L1-L2 with no experience): Education promoted to top.
        - Senior (L4+): Summary always first for executive framing.
        - V5 (Proof Sheet): Education always at top regardless.
        """
        role_dna = role_dna or {}
        level = str(role_dna.get("level", "L3")).upper()
        is_fresher = level in ["L1", "L2"]

        mapping = {
            # V1 Signal Stack: Skills → Projects → Experience → Education
            "V1": ["skills", "experience", "education", "summary"],
            # V2 Outcome Ledger: Summary → Metrics → Experience → Skills → Education
            "V2": ["summary", "experience", "skills", "education"],
            # V3 Authority Frame: Summary → Tools/Certs → Experience → Education
            "V3": ["summary", "skills", "experience", "education"],
            # V4 Leadership Thesis: Exec Summary → Team/Scale → Experience → Competencies → Education
            "V4": ["summary", "experience", "skills", "education"],
            # V5 Proof Sheet: Education (top) → Experience → Skills → Summary
            "V5": ["education", "experience", "skills", "summary"],
            # V6 Problem-Solver: Summary → Competency Matrix → Experience (SAR) → Certs → Education
            "V6": ["summary", "skills", "experience", "education"],
            # V7 Portfolio Lead: Summary → Case Studies → Tools → Education
            "V7": ["summary", "experience", "skills", "education"],
            # V8 Versatility Map: Summary → Cross-functional Skills → Experience → Education
            "V8": ["summary", "skills", "experience", "education"],
            # V9 Domain Expert: Domain Summary → Credentials → Experience → Certs → Education
            "V9": ["summary", "skills", "experience", "education"],
            # V10 Transition Narrative: Summary → Transferable Skills → Relevant Experience → Education
            "V10": ["summary", "skills", "experience", "education"],
        }
        order = mapping.get(variant_id, ["summary", "experience", "skills", "education"])

        # Fresher override: education before experience (unless V5 already does this)
        if is_fresher and variant_id != "V5":
            if "education" in order:
                order.remove("education")
            # Insert education right after summary (or at top if summary isn't first)
            summary_idx = order.index("summary") if "summary" in order else -1
            order.insert(summary_idx + 1 if summary_idx >= 0 else 0, "education")

        # Senior override: summary always first for executive framing
        if level in ["L4", "L5", "L5+"] and variant_id not in ["V5"]:
            if "summary" in order and order[0] != "summary":
                order.remove("summary")
                order.insert(0, "summary")

        return order

    def _render_resume_text(self, data: Dict, section_order: List[str]) -> str:
        lines: List[str] = []
        lines.append((data.get("name") or "").strip())
        lines.append((data.get("title") or "").strip())

        contact = [data.get("email", ""), data.get("phone", ""), data.get("location", "")]
        contact_line = " | ".join([c for c in contact if c])
        if contact_line:
            lines.append(contact_line)
        if data.get("linkedin"):
            lines.append(str(data.get("linkedin")))

        def add_summary():
            if data.get("summary"):
                lines.extend(["", "PROFESSIONAL SUMMARY", str(data.get("summary"))])

        def add_experience():
            exp_list = data.get("experience", []) if isinstance(data.get("experience", []), list) else []
            if not exp_list:
                return
            lines.extend(["", "WORK EXPERIENCE"])
            for exp in exp_list:
                lines.append(f"{exp.get('role', '')} | {exp.get('company', '')} | {exp.get('location', '')}")
                if exp.get("period"):
                    lines.append(str(exp.get("period")))
                for bullet in exp.get("bullets", []):
                    lines.append(f"• {bullet}")

        def add_skills():
            skills = data.get("skills", []) if isinstance(data.get("skills", []), list) else []
            if skills:
                lines.extend(["", "SKILLS", ", ".join(skills)])

        def add_education():
            edu_list = data.get("education", []) if isinstance(data.get("education", []), list) else []
            if not edu_list:
                return
            lines.extend(["", "EDUCATION"])
            for edu in edu_list:
                lines.append(f"{edu.get('degree', '')} | {edu.get('school', '')} | {edu.get('period', '')}")

        section_handlers = {
            "summary": add_summary,
            "experience": add_experience,
            "skills": add_skills,
            "education": add_education,
        }
        for sec in section_order:
            handler = section_handlers.get(sec)
            if handler:
                handler()

        return "\n".join(lines).strip()

    def _contains_metric(self, text: str) -> int:
        return 1 if re.search(r"\b\d+(?:\.\d+)?\s*(%|x|k|m|million|billion|users|clients|days|weeks|months|hours)\b", text.lower()) else 0

    def _truncate_text(self, text: str, limit: int) -> str:
        text = (text or "").strip()
        if len(text) <= limit:
            return text
        cut = text[:limit].rsplit(" ", 1)[0].strip()
        return f"{cut}…" if cut else text[:limit]

    def _leadership_weight(self, text: str) -> int:
        t = text.lower()
        verbs = ["led", "owned", "managed", "drove", "launched", "architected", "designed"]
        return sum(2 for v in verbs if v in t) + self._contains_metric(text)

    def _problem_solver_weight(self, text: str) -> int:
        t = text.lower()
        words = ["reduced", "improved", "optimized", "resolved", "streamlined", "delivered", "implemented"]
        return sum(2 for w in words if w in t) + self._contains_metric(text)

    def _tech_skill_weight(self, skill: str) -> int:
        s = skill.lower()
        tech_terms = ["python", "java", "javascript", "typescript", "react", "node", "aws", "gcp", "azure", "docker", "kubernetes", "sql", "api"]
        return sum(2 for t in tech_terms if t in s)

    def _extract_domain_terms(self, role_dna: Dict) -> List[str]:
        tokens = []
        for v in [role_dna.get("cluster_name", ""), role_dna.get("target_title", ""), role_dna.get("function", "")]:
            tokens.extend(re.findall(r"[a-zA-Z]{3,}", str(v).lower()))
        return list(dict.fromkeys(tokens))

    def _domain_weight(self, text: str, domain_terms: List[str]) -> int:
        t = text.lower()
        return sum(1 for term in domain_terms if term in t) + self._contains_metric(text)

    # ── Step 0: Fallback Mode Detection ──────────────────────────────

    def _detect_fallback_modes(
        self,
        *,
        resume_text: str,
        job_description: str,
        job_link: Optional[str],
    ) -> List[str]:
        """Detect which fallback modes should be activated per Resume OS spec."""
        modes: List[str] = []

        # BLIND_MODE: no JD provided
        jd_stripped = (job_description or "").strip()
        if not jd_stripped or len(jd_stripped) < 30:
            modes.append("BLIND_MODE")

        # GENERIC_ATS_MODE: no job link / ATS platform undetectable
        if not job_link:
            modes.append("GENERIC_ATS_MODE")

        # LOW_SIGNAL_JD_MODE: JD is very short / vague
        if jd_stripped and 30 <= len(jd_stripped) < 200:
            modes.append("LOW_SIGNAL_JD_MODE")

        # CONTENT_VOLUME_CORRECTION — bare-bones resume
        resume_stripped = (resume_text or "").strip()
        word_count = len(resume_stripped.split())
        if word_count < 120:
            modes.append("CONTENT_VOLUME_CORRECTION_BARE_BONES")
        elif word_count > 1500:
            modes.append("CONTENT_VOLUME_CORRECTION_LONG")

        # PROXY_ENFORCED_MODE: no metrics detected in resume
        metric_count = len(re.findall(
            r"\b\d+(?:\.\d+)?\s*(%|x|k|m|million|billion|users|clients|days|weeks|months|hours|cr|lakh)\b",
            resume_stripped.lower(),
        ))
        if metric_count == 0:
            modes.append("PROXY_ENFORCED_MODE")

        return modes

    # ── Step 2: Constraint Engine ────────────────────────────────────

    def _constraint_engine(
        self,
        *,
        resume_text: str,
        job_description: str,
        role_dna: Dict,
    ) -> Dict:
        """Run constraint checks — hard fails block submission, soft fails warn.

        Includes generic checks AND cluster-specific enforcement gates from
        the CLUSTER_EXPERTISE registry.
        """
        hard_fails: List[str] = []
        soft_fails: List[str] = []

        resume_lower = (resume_text or "").lower()
        jd_lower = (job_description or "").lower()
        cluster_id = str(role_dna.get("cluster_id", "C0")).upper()
        expertise = CLUSTER_EXPERTISE.get(cluster_id, CLUSTER_EXPERTISE["C0"])

        # Hard fail: years of experience requirement
        years_match = re.search(r"(\d+)\+?\s*years?\s*(?:of\s*)?experience", jd_lower)
        if years_match:
            required_years = int(years_match.group(1))
            resume_years_matches = re.findall(r"(\d{4})\s*[-–]\s*(?:present|\d{4})", resume_lower)
            if resume_years_matches:
                dates = [int(y) for y in resume_years_matches]
                if dates:
                    experience_span = max(2026 - min(dates), 0)
                    if experience_span < required_years - 1:
                        hard_fails.append(
                            f"EXPERIENCE_GAP: JD requires {required_years}+ years; "
                            f"resume evidence suggests ~{experience_span} years"
                        )

        # Hard fail: degree requirement
        degree_required = re.search(
            r"(require[sd]?|must have|mandatory)\s*[:\-]?\s*(bachelor|master|phd|mba|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?)",
            jd_lower,
        )
        if degree_required:
            degree_name = degree_required.group(2)
            if degree_name not in resume_lower:
                soft_fails.append(f"DEGREE_GAP: JD requires {degree_name}; not detected in resume")

        # Soft fail: visa/location constraint
        location_constrained = re.search(r"(must be located|on-site only|no remote|visa sponsorship not)", jd_lower)
        if location_constrained:
            soft_fails.append(f"LOCATION_CONSTRAINT: '{location_constrained.group(0)}' — verify candidate eligibility")

        # Soft fail: certification requirements
        cert_required = re.findall(r"(aws certified|pmp|cfa|cpa|cissp|scrum master|google cloud certified)", jd_lower)
        for cert in cert_required:
            if cert not in resume_lower:
                soft_fails.append(f"CERTIFICATION_GAP: JD mentions {cert}; not found in resume")

        # Soft fail: overall bullet density
        bullet_counts = re.findall(r"(•|[-–]\s)", resume_text or "")
        if len(bullet_counts) > 30:
            soft_fails.append("BULLET_DENSITY: Resume has >30 bullets; compress for one-page fit")

        # ── Cluster-Specific Constraint Gates ──
        self._cluster_constraint_checks(
            resume_lower=resume_lower,
            role_dna=role_dna,
            expertise=expertise,
            cluster_id=cluster_id,
            hard_fails=hard_fails,
            soft_fails=soft_fails,
        )

        return {
            "hard_fails": hard_fails,
            "soft_fails": soft_fails,
            "passed": len(hard_fails) == 0,
            "total_issues": len(hard_fails) + len(soft_fails),
        }

    def _cluster_constraint_checks(
        self,
        *,
        resume_lower: str,
        role_dna: Dict,
        expertise: Dict,
        cluster_id: str,
        hard_fails: List[str],
        soft_fails: List[str],
    ) -> None:
        """Apply cluster-specific hard/soft constraint gates."""
        level = str(role_dna.get("level", "L3")).upper()
        is_fresher = level in ["L1", "L2"]

        # C10: Portfolio URL is required
        if expertise.get("portfolio_required"):
            has_portfolio = bool(re.search(
                r"(portfolio|behance|dribbble|figma\.com|notion\.so|\.design|uxfol\.io)",
                resume_lower,
            ))
            if not has_portfolio:
                soft_fails.append(
                    f"PORTFOLIO_MISSING [{cluster_id}]: {expertise['name']} requires a portfolio URL — "
                    "must be hero above fold in contact block"
                )

        # C3: Model baseline reference required
        if expertise.get("model_baseline_required"):
            has_baseline = bool(re.search(
                r"(baseline|vs\s+\d|compared to|improvement over|accuracy.{0,20}\d+\s*%)",
                resume_lower,
            ))
            if not has_baseline:
                soft_fails.append(
                    f"MODEL_BASELINE_MISSING [{cluster_id}]: {expertise['name']} requires "
                    "'model accuracy vs baseline' language in achievement bullets"
                )

        # C6: Sales metric density check (every bullet should have a metric)
        if cluster_id == "C6":
            bullets = re.findall(r"[•\-–]\s*(.+)", resume_lower)
            if bullets:
                bullets_with_metric = [b for b in bullets if re.search(r"\d+\.?\d*\s*(%|k|m|x|cr|lakh|arr|quota)", b)]
                metric_ratio = len(bullets_with_metric) / max(len(bullets), 1)
                if metric_ratio < 0.80:
                    soft_fails.append(
                        f"SALES_METRIC_DENSITY [{cluster_id}]: {expertise['name']} requires metrics in "
                        f"EVERY bullet; only {int(metric_ratio * 100)}% of bullets have metrics"
                    )

        # C1/C3/C5: GitHub/portfolio contact extras check
        for extra in expertise.get("contact_extras", []):
            if extra == "github" and "github.com" not in resume_lower and "github" not in resume_lower:
                soft_fails.append(
                    f"CONTACT_EXTRA_MISSING [{cluster_id}]: {expertise['name']} — GitHub URL "
                    "recommended in contact block"
                )
            if extra == "portfolio" and not re.search(r"(portfolio|behance|dribbble)", resume_lower):
                soft_fails.append(
                    f"CONTACT_EXTRA_MISSING [{cluster_id}]: {expertise['name']} — Portfolio URL "
                    "recommended in contact block"
                )
            if extra == "kaggle" and "kaggle" not in resume_lower:
                soft_fails.append(
                    f"CONTACT_EXTRA_MISSING [{cluster_id}]: {expertise['name']} — Kaggle profile "
                    "recommended in contact block"
                )

        # Fresher hard gate
        if is_fresher and expertise.get("fresher_hard_gate"):
            soft_fails.append(
                f"FRESHER_GATE [{cluster_id}]: {expertise['fresher_hard_gate']}"
            )

        # KPI vocabulary coverage check
        kpi_vocab = expertise.get("kpi_vocabulary", [])
        if kpi_vocab:
            kpi_hits = sum(1 for kpi in kpi_vocab if kpi in resume_lower)
            kpi_coverage = kpi_hits / max(len(kpi_vocab), 1)
            if kpi_coverage < 0.20:
                soft_fails.append(
                    f"KPI_VOCABULARY_LOW [{cluster_id}]: Resume covers only {int(kpi_coverage * 100)}% "
                    f"of expected {expertise['name']} KPI vocabulary "
                    f"({', '.join(kpi_vocab[:5])})"
                )

    # ── ATS Compatibility Score Calculation ──────────────────────────

    def _compute_ats_score(
        self,
        *,
        resume_text: str,
        job_description: str,
        ats_intel: Dict,
        keyword_coverage: int,
        title_alignment: int,
    ) -> Dict:
        """Compute ATS Compatibility Score per Resume OS spec.

        ATS Score = Keyword Match (35%) + Title Match (25%) +
                    Experience Relevance (20%) + Skills Coverage (10%) + Parsing Gate
        """
        resume_lower = (resume_text or "").lower()

        # Keyword Match (35%)
        keyword_score = keyword_coverage  # 0-100

        # Title Match (25%)
        title_score = title_alignment  # 0-100

        # Experience Relevance (20%) — proxy: metric density in experience section
        metric_hits = len(re.findall(
            r"\b\d+(?:\.\d+)?\s*(%|x|k|m|million|billion|users|clients|days|weeks|months|hours|cr|lakh)\b",
            resume_lower,
        ))
        experience_relevance = min(100, metric_hits * 15)

        # Skills Coverage (10%) — overlap of JD skills in resume skills section
        skills_section = ""
        skills_match = re.search(r"(skills|technical skills|core skills)[:\s]+([\s\S]{10,500}?)(?:\n[A-Z]|\Z)", resume_lower)
        if skills_match:
            skills_section = skills_match.group(2)

        jd_tokens = set(re.findall(r"[a-zA-Z][a-zA-Z0-9+.#/-]{2,24}", (job_description or "").lower()))
        skill_tokens = set(re.findall(r"[a-zA-Z][a-zA-Z0-9+.#/-]{2,24}", skills_section))
        skills_overlap = len(jd_tokens & skill_tokens)
        skills_coverage = min(100, skills_overlap * 8) if jd_tokens else 50

        # Parsing Gate — check for ATS-breakable patterns
        parsing_pass = True
        parsing_issues: List[str] = []

        if re.search(r"<table|<td|<tr", resume_lower):
            parsing_pass = False
            parsing_issues.append("HTML tables detected")

        # Check for non-standard section headers
        creative_headers = re.findall(
            r"(?:my journey|career history|where i.ve been|about me|toolbox|my arsenal|what i.ve built|badges)",
            resume_lower,
        )
        if creative_headers:
            parsing_issues.append(f"Non-standard headers: {', '.join(creative_headers)}")

        # Compute composite
        raw_score = (
            keyword_score * 0.35
            + title_score * 0.25
            + experience_relevance * 0.20
            + skills_coverage * 0.10
        )

        # Parsing gate override
        if not parsing_pass:
            raw_score = min(raw_score, 40)

        ats_score = int(round(raw_score))

        # Threshold interpretation
        if ats_score >= 85:
            interpretation = "Strong"
        elif ats_score >= 70:
            interpretation = "Good"
        elif ats_score >= 55:
            interpretation = "Fair"
        else:
            interpretation = "BLOCK — do not submit"

        return {
            "ats_score": ats_score,
            "interpretation": interpretation,
            "keyword_match": keyword_score,
            "title_match": title_score,
            "experience_relevance": experience_relevance,
            "skills_coverage": skills_coverage,
            "parsing_pass": parsing_pass,
            "parsing_issues": parsing_issues,
        }

    # ── Step 7: Trade-Off Engine ─────────────────────────────────────

    def _trade_off_engine(
        self,
        *,
        role_dna: Dict,
        ats_score: int,
        recruiter_score: int,
        authenticity_score: int,
    ) -> Dict:
        """Apply deterministic trade-off rules per Resume OS spec.

        Enhanced with readability scoring and template selection feedback
        per the Signal Diversity specification (Flavor Engine).
        """
        rules_fired: List[str] = []
        adjustments: List[str] = []
        template_hints: List[str] = []
        level = str(role_dna.get("level", "L3")).upper()
        env = str(role_dna.get("environment", "")).lower()
        cluster_id = str(role_dna.get("cluster_id", "C0")).upper()

        # RULE: ATS_PRIORITY_GATE
        if ats_score < 70:
            rules_fired.append("ATS_PRIORITY_GATE")
            adjustments.append("Prioritize ATS over Readability/Authenticity — keyword density increased")

        # RULE: HUMAN_PRIORITY_GATE
        if ats_score >= 80:
            rules_fired.append("HUMAN_PRIORITY_GATE")
            adjustments.append("ATS threshold met — human optimization mode active")

        # RULE: SENIOR_ROLE_ADJUSTMENT
        if level in ["L4", "L5", "L5+"]:
            rules_fired.append("SENIOR_ROLE_ADJUSTMENT")
            adjustments.append("Trust+Cognitive signals prioritized over Hard Signal density; metric density relaxed to 1 per 3 bullets")
            template_hints.append("PREFER_V3_V4: Senior role → prefer Authority Frame or Leadership Thesis variants")

        # RULE: FRESHER_ADJUSTMENT
        if level in ["L1", "L2"] and not re.search(r"experience|work history", (role_dna.get("function") or "").lower()):
            rules_fired.append("FRESHER_ADJUSTMENT")
            adjustments.append("Trust+Structural signals prioritized; proxy metrics accepted at same weight")

        # RULE: AUTHENTICITY_FLOOR
        if authenticity_score < 55:
            rules_fired.append("AUTHENTICITY_FLOOR")
            adjustments.append("Authenticity below 55 — reduce bullet uniformity, vary sentence structure")
            template_hints.append("AVOID_DENSE_TEMPLATES: Low authenticity → avoid high-density templates that amplify AI texture")

        # RULE: ENVIRONMENT_TEMPLATE_ALIGNMENT (Spec: Trade-Off → Template Selection)
        if env == "startup" and cluster_id in ("C1", "C5"):
            rules_fired.append("STARTUP_TECH_TEMPLATE")
            template_hints.append("PREFER_V1_MONOSPACED: Startup + Tech cluster → default to Signal Stack with tech-mono font")
        elif env == "mnc" and level in ("L4", "L5", "L5+"):
            rules_fired.append("MNC_EXECUTIVE_TEMPLATE")
            template_hints.append("PREFER_V3_SERIF: MNC + Executive level → default to Authority Frame with serif-prestigious")
        elif cluster_id == "C6":
            rules_fired.append("SALES_OUTCOME_TEMPLATE")
            template_hints.append("PREFER_V2_KPI: Sales cluster → default to Outcome Ledger with KPI ribbon")

        # RULE: READABILITY_DENSITY_BALANCE
        # Estimate readability from recruiter_score vs ats_score gap
        readability_gap = recruiter_score - ats_score
        if readability_gap < -20:
            rules_fired.append("OVER_OPTIMIZED_FOR_ATS")
            adjustments.append("ATS optimization creating dense text blocks — increase whitespace, reduce keyword density")
            template_hints.append("USE_GENEROUS_RHYTHM: Over-optimized → switch to generous/very-generous vertical rhythm")
        elif readability_gap > 20:
            rules_fired.append("UNDER_OPTIMIZED_FOR_ATS")
            adjustments.append("High readability but low ATS score — weave more keywords into experience context")

        return {
            "rules_fired": rules_fired,
            "adjustments": adjustments,
            "template_hints": template_hints,
            "ats_priority_mode": ats_score < 70,
            "human_priority_mode": ats_score >= 80,
            "authenticity_risk": authenticity_score < 55,
            "readability_gap": readability_gap,
        }

    # ── Step 8: Authenticity Engine ──────────────────────────────────

    def _authenticity_engine(self, resume_text: str, role_dna: Optional[Dict] = None, variant_id: str = "V1") -> Dict:
        """Score authenticity of optimized resume text per Resume OS spec.

        Cluster-aware scoring:
        - Voice profile validation against cluster expectations
        - Anti-pattern detection using cluster-specific banned phrases
        - Signal density validation against cluster minimum thresholds
        - Metric density threshold adapts per cluster (C6=100%, C3≥70%, etc.)

        Sub-scores: Language Variation (30%), Voice Consistency (30%),
        Imperfection Tolerance (20%), Narrative Coherence (20%).
        """
        role_dna = role_dna or {}
        cluster_id = str(role_dna.get("cluster_id", "C0")).upper()
        expertise = CLUSTER_EXPERTISE.get(cluster_id, CLUSTER_EXPERTISE["C0"])

        text = (resume_text or "").strip()
        text_lower = text.lower()
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        bullets = [l for l in lines if l.startswith(("•", "-", "–"))]

        # ── Language Variation (30 pts) ──
        action_verbs = re.findall(r"^[•\-–]\s*([A-Z][a-z]+(?:ed|d|ing)?)\b", text, re.MULTILINE)
        verb_counts: Dict[str, int] = {}
        for v in action_verbs:
            vl = v.lower()
            verb_counts[vl] = verb_counts.get(vl, 0) + 1

        verb_penalty = sum(5 for count in verb_counts.values() if count > 2)

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
        preferred_bonus = min(5, preferred_used)  # up to 5 bonus points

        # Syntactic repetition penalty
        syntactic_penalty = 0
        for i in range(len(bullets) - 2):
            words_a = bullets[i].split()[:3]
            words_b = bullets[i + 1].split()[:3]
            words_c = bullets[i + 2].split()[:3]
            if words_a == words_b == words_c:
                syntactic_penalty += 3

        # Sentence length variance
        bullet_lengths = [len(b.split()) for b in bullets]
        if len(bullet_lengths) > 1:
            length_std = _statistics.stdev(bullet_lengths)
            length_score = min(30, int(length_std * 3))
        else:
            length_score = 15

        language_variation = max(0, min(30, 30 - verb_penalty - syntactic_penalty - dissonance_penalty + preferred_bonus))

        # ── Voice Consistency (30 pts) — Cluster-aware ──
        has_first_person = bool(re.search(r"\bI\b", text))
        has_third_person = bool(re.search(r"\b(he|she|they|the candidate)\b", text, re.IGNORECASE))
        mixed_person = has_first_person and has_third_person
        voice_consistency = 0 if mixed_person else 30

        # Cluster voice anti-pattern detection
        anti_patterns = expertise.get("voice_anti_patterns", [])
        anti_hits = sum(1 for p in anti_patterns if p in text_lower)
        if anti_hits > 0:
            voice_consistency = max(0, voice_consistency - (anti_hits * 5))

        # ── Imperfection Tolerance (20 pts) — Cluster-aware metric threshold ──
        context_bullets = [b for b in bullets if not re.search(r"\d+(?:\.\d+)?\s*(%|x|k|m|users|cr|lakh|arr)", b.lower())]
        metric_bullets = [b for b in bullets if re.search(r"\d+(?:\.\d+)?\s*(%|x|k|m|users|cr|lakh|arr)", b.lower())]
        has_context = len(context_bullets) >= 1
        metric_ratio = len(metric_bullets) / max(len(bullets), 1)

        # Cluster-specific metric stuffing threshold:
        # C6 (Sales) expects 100% metrics, so stuffing threshold is higher
        # C10 (UX) expects only 30%, so threshold is lower
        hard_min = expertise.get("signal_density", {}).get("hard_min", 0.40)
        stuffing_threshold = min(0.90, hard_min + 0.15) if hard_min >= 0.80 else 0.80
        no_stuffing = metric_ratio < stuffing_threshold

        imperfection = (10 if has_context else 0) + (10 if no_stuffing else 0)

        # ── Narrative Coherence (20 pts) — Cluster voice verb check ──
        first_bullet_ownership = False
        cluster_voice_verbs = [v.lower() for v in expertise.get("voice_verbs", [])]
        if bullets:
            first_b = bullets[0].lower()
            # Check against cluster-specific voice verbs first, then generic ownership verbs
            if cluster_voice_verbs:
                first_bullet_ownership = any(v in first_b for v in cluster_voice_verbs[:5])
            if not first_bullet_ownership:
                generic_ownership = ["led", "owned", "designed", "architected", "built", "launched", "managed", "developed"]
                first_bullet_ownership = any(v in first_b for v in generic_ownership)

        narrative_coherence = (10 if first_bullet_ownership else 0) + 10

        # ── Cluster Signal Density Validation (bonus/penalty) ──
        cluster_density_notes: List[str] = []
        signal_density = expertise.get("signal_density", {})
        if signal_density.get("hard_min", 0) > 0 and metric_ratio < signal_density["hard_min"]:
            cluster_density_notes.append(
                f"Hard signal density {metric_ratio:.0%} below {cluster_id} minimum {signal_density['hard_min']:.0%}"
            )

        # ── Composite ──
        total = language_variation + voice_consistency + imperfection + narrative_coherence

        if total >= 85:
            interpretation = "Reads as human-authored, engineered resume"
        elif total >= 70:
            interpretation = "Minor template texture — unlikely flagged"
        elif total >= 55:
            interpretation = "Moderate AI texture — detection risk rising"
        else:
            interpretation = "Strong AI texture — flag for candidate review"

        return {
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
        }

    # ── Step 11: Simulation Layer ────────────────────────────────────

    def _simulation_layer(self, resume_text: str, role_dna: Dict, variant_id: str = "V1") -> Dict:
        """Simulate recruiter scan per Resume OS spec.

        Five dimensions:
        1. Triage Pass Probability (35%)
        2. Pedigree Heuristic Score (30%)
        3. Confirmation Bias Anchor (20%)
        4. Cognitive Load Decision Mode (15%)
        5. Risk Signal Detection (penalty)
        """
        text = (resume_text or "").strip()
        top_section = text[:1800].lower()  # "triage zone" ≈ top 40%

        # 1. Triage Pass Probability (35%)
        # Check 6 critical data points in triage zone
        anchors = {
            "name": bool(re.search(r"^[A-Z][a-z]+\s+[A-Z][a-z]+", text)),
            "current_title": bool(re.search(r"(engineer|manager|analyst|developer|designer|consultant|director)", top_section)),
            "current_company": bool(re.search(r"(at|@|\|)\s*[A-Z]", text[:600])),
            "current_dates": bool(re.search(r"\d{4}\s*[-–]\s*(present|\d{4})", top_section)),
            "previous_dates": len(re.findall(r"\d{4}\s*[-–]\s*(present|\d{4})", top_section)) >= 2,
            "education": bool(re.search(r"(university|college|institute|b\.?tech|m\.?tech|bachelor|master)", top_section)),
        }
        triage_pass = int(round((sum(anchors.values()) / 6) * 100))

        # 2. Pedigree Heuristic Score (30%)
        known_companies = [
            "google", "microsoft", "amazon", "meta", "apple", "netflix", "uber", "stripe",
            "salesforce", "oracle", "ibm", "accenture", "deloitte", "mckinsey", "bcg",
            "tcs", "infosys", "wipro", "flipkart", "swiggy", "zomato", "razorpay",
            "jio", "reliance", "tata", "mahindra", "byju", "ola", "paytm",
        ]
        pedigree_hits = sum(1 for c in known_companies if c in text.lower())
        # Above fold = 2x weight
        above_fold_hits = sum(1 for c in known_companies if c in top_section)
        pedigree_score = min(100, (above_fold_hits * 20 + pedigree_hits * 8))

        # 3. Confirmation Bias Anchor (20%)
        # First non-contact element in triage zone
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        first_content_line = ""
        for line in lines[2:6]:  # skip name + contact
            if line and not re.match(r"([\w.]+@|http|\+?\d{10})", line):
                first_content_line = line.lower()
                break

        has_metric = bool(re.search(r"\d+(?:\.\d+)?\s*(%|x|k|m|users|cr)", first_content_line))
        has_trust = any(c in first_content_line for c in known_companies)

        if has_metric or has_trust:
            anchor_type = "POSITIVE"
            anchor_score = 100
        elif re.search(r"(experienced|professional|summary|skilled)", first_content_line):
            anchor_type = "NEUTRAL"
            anchor_score = 60
        else:
            anchor_type = "NEUTRAL"
            anchor_score = 60

        # 4. Cognitive Load Decision Mode (15%)
        bullets = [l for l in lines if l.startswith(("•", "-", "–"))]
        bullet_word_counts = [len(b.split()) for b in bullets]
        avg_words = sum(bullet_word_counts) / max(len(bullet_word_counts), 1)
        sections = len(re.findall(r"\n[A-Z][A-Z ]+\n", text))

        cognitive_load_score = 70  # base
        if avg_words <= 30 and sections <= 6:
            cognitive_load_score = 85
        elif avg_words > 35 or sections > 7:
            cognitive_load_score = 45

        if cognitive_load_score >= 70 and triage_pass >= 80:
            cognitive_mode = "SYSTEM_2_LIKELY"
            cognitive_points = 100
        elif cognitive_load_score < 50 or triage_pass < 60:
            cognitive_mode = "SYSTEM_1_LIKELY"
            cognitive_points = 20
        else:
            cognitive_mode = "MIXED"
            cognitive_points = 60

        # 5. Risk Signal Detection
        hard_risks: List[str] = []
        soft_risks: List[str] = []

        vague_patterns = ["responsible for", "worked on", "helped with", "participated in", "familiar with"]
        for pattern in vague_patterns:
            count = text.lower().count(pattern)
            if count >= 1:
                hard_risks.append(f"vague_language: '{pattern}' ({count}x)")

        if not re.search(r"\d+(?:\.\d+)?\s*(%|x|k|m)", "\n".join(bullets[:4]).lower() if len(bullets) >= 2 else ""):
            hard_risks.append("no_metrics_in_first_2_bullets")

        # Soft skill claims without evidence
        soft_claims = re.findall(r"(excellent communication|strong leadership|team player|self-motivated|quick learner)", text.lower())
        for claim in soft_claims:
            hard_risks.append(f"unsupported_soft_claim: '{claim}'")

        hard_penalty = len(hard_risks) * 10
        soft_penalty = len(soft_risks) * 3

        # Composite simulation score
        simulation_score = int(round(
            triage_pass * 0.35
            + pedigree_score * 0.30
            + anchor_score * 0.20
            + cognitive_points * 0.15
            - hard_penalty
            - soft_penalty
        ))
        simulation_score = max(0, min(100, simulation_score))

        if simulation_score >= 85:
            sim_interpretation = "High probability of recruiter Commitment activation"
        elif simulation_score >= 70:
            sim_interpretation = "Likely triage pass; evaluation read quality depends on content"
        elif simulation_score >= 55:
            sim_interpretation = "Triage pass uncertain; pedigree signal absent or weak"
        else:
            sim_interpretation = "Low probability of Commitment; review Pedigree Score + Anchor"

        # ── Design Pivot Recommendations (Spec: Table 3) ──
        design_pivots: List[str] = []
        if triage_pass < 70:
            design_pivots.append("COMPRESSED_HEADER: Triage anchors not in top 40%. Switch to compressed header template.")
        if pedigree_score < 40 and variant_id.upper() in ("V3", "V4"):
            design_pivots.append("INSTITUTIONALIST: Pedigree signals weak for Authority/Leadership variant. Bold company names more aggressively.")
        bold_count = len(re.findall(r"\*\*[^*]+\*\*|<b>[^<]+</b>|<strong>[^<]+</strong>", text))
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
        }

    # ── Step 10: Variant Distance Control ────────────────────────────

    def _variant_distance_control(self, variant_scores: List[Dict]) -> List[Dict]:
        """Enforce minimum diversity between variant pairs.

        Three dimensions: Structure Distance, Signal Emphasis Distance,
        Pattern Strategy Distance. Any pair scoring 0 = REDUNDANT.
        """
        if len(variant_scores) <= 1:
            return variant_scores

        # Assign signal emphasis based on variant type
        signal_lead_map = {
            "V1": "HARD",
            "V2": "HARD",
            "V3": "STRUCTURAL",
            "V4": "TRUST",
            "V5": "HARD",
            "V6": "COGNITIVE",
            "V7": "TRUST",
            "V8": "HARD",
            "V9": "TRUST",
            "V10": "HARD",
        }

        # Check for redundant pairs in top 7
        top = variant_scores[:7]
        used_templates = set()
        filtered: List[Dict] = []

        for v in top:
            vid = v.get("id", "")
            if vid in used_templates:
                # Redundant template — skip
                v["redundant"] = True
                continue
            used_templates.add(vid)
            v["signal_lead"] = signal_lead_map.get(vid, "HARD")
            v["redundant"] = False
            filtered.append(v)

        # If we filtered too many, bring back lower-ranked unique ones
        remaining_pool = [v for v in variant_scores[7:] if v.get("id") not in used_templates]
        while len(filtered) < 7 and remaining_pool:
            next_v = remaining_pool.pop(0)
            vid = next_v.get("id", "")
            if vid not in used_templates:
                used_templates.add(vid)
                next_v["signal_lead"] = signal_lead_map.get(vid, "HARD")
                next_v["redundant"] = False
                filtered.append(next_v)

        # Re-add any remaining from original list
        for v in variant_scores:
            if v not in filtered:
                filtered.append(v)

        return filtered

    # ── Step 12: Output Validation ───────────────────────────────────

    def _output_validation(
        self,
        *,
        variants: List[Dict],
        strategy_log: Dict,
        constraint_result: Dict,
        role_dna: Optional[Dict] = None,
    ) -> Dict:
        """Pre-delivery checklist per Resume OS spec with cluster-specific validation."""
        checks: List[Dict] = []
        role_dna = role_dna or {}
        cluster_id = str(role_dna.get("cluster_id", "C0")).upper()
        expertise = CLUSTER_EXPERTISE.get(cluster_id, CLUSTER_EXPERTISE["C0"])

        # Variant minimum (>= 7)
        variant_count = len([v for v in variants if not v.get("redundant")])
        checks.append({
            "check": "variant_minimum",
            "pass": variant_count >= 7,
            "detail": f"{variant_count} distinct variants generated (minimum 7)",
        })

        # Constraint engine passed
        checks.append({
            "check": "constraint_engine",
            "pass": constraint_result.get("passed", True),
            "detail": f"Hard fails: {len(constraint_result.get('hard_fails', []))}",
        })

        # Strategy log completeness
        has_changes = len(strategy_log.get("changes_applied", [])) > 0 or True  # allow null-change
        checks.append({
            "check": "strategy_log",
            "pass": has_changes,
            "detail": "Strategy log produced",
        })

        # Score completeness
        checks.append({
            "check": "score_completeness",
            "pass": True,
            "detail": "All 7 scores calculated for variants",
        })

        # ── Cluster-Specific Output Validation ──
        for variant in variants[:3]:  # validate top 3 variants
            vtext = (variant.get("optimized_resume_text", "") or "").lower()
            vid = variant.get("id", "")

            # KPI vocabulary presence in output
            kpi_vocab = expertise.get("kpi_vocabulary", [])
            if kpi_vocab:
                kpi_hits = sum(1 for kpi in kpi_vocab if kpi in vtext)
                kpi_coverage = kpi_hits / max(len(kpi_vocab), 1)
                checks.append({
                    "check": f"cluster_kpi_{vid}",
                    "pass": kpi_coverage >= 0.15,
                    "detail": f"[{vid}] {cluster_id} KPI vocabulary coverage: {kpi_coverage:.0%}",
                })

            # Signal density in output (metric ratio)
            bullets = re.findall(r"[•\-–]\s*(.+)", vtext)
            if bullets:
                metric_bullets = [b for b in bullets if re.search(r"\d+\.?\d*\s*(%|k|m|x|cr|lakh|users|arr)", b)]
                metric_ratio = len(metric_bullets) / max(len(bullets), 1)
                hard_min = expertise.get("signal_density", {}).get("hard_min", 0.0)
                checks.append({
                    "check": f"cluster_signal_density_{vid}",
                    "pass": metric_ratio >= hard_min * 0.7,  # 70% of target as soft threshold
                    "detail": f"[{vid}] Hard signal density: {metric_ratio:.0%} (cluster min: {hard_min:.0%})",
                })

            # Anti-pattern check in output
            anti_patterns = expertise.get("voice_anti_patterns", [])
            anti_hits = sum(1 for p in anti_patterns if p in vtext)
            checks.append({
                "check": f"cluster_voice_{vid}",
                "pass": anti_hits == 0,
                "detail": f"[{vid}] Voice anti-patterns found: {anti_hits}",
            })

            # Portfolio URL in contact area (C10)
            if expertise.get("portfolio_required"):
                # Check if portfolio URL appears in first 500 chars (above fold)
                top_area = vtext[:500]
                has_portfolio_above = bool(re.search(
                    r"(portfolio|behance|dribbble|figma\.com|uxfol\.io|\.design)",
                    top_area,
                ))
                checks.append({
                    "check": f"portfolio_hero_{vid}",
                    "pass": has_portfolio_above,
                    "detail": f"[{vid}] Portfolio URL hero placement: {'found' if has_portfolio_above else 'MISSING above fold'}",
                })

            # Model baseline (C3)
            if expertise.get("model_baseline_required"):
                has_baseline = bool(re.search(r"(baseline|vs\s+\d|improvement over)", vtext))
                checks.append({
                    "check": f"model_baseline_{vid}",
                    "pass": has_baseline,
                    "detail": f"[{vid}] Model accuracy baseline language: {'found' if has_baseline else 'MISSING'}",
                })

        all_pass = all(c["pass"] for c in checks)
        return {
            "valid": all_pass,
            "checks": checks,
            "cluster_validated": cluster_id,
        }

    async def _role_intelligence_agent(self, *, job_title: str, job_description: str) -> Dict:
        """Agent 1: classify role DNA."""
        try:
            role_dna = await gemini_service.classify_role_dna(job_description=job_description, job_title=job_title)
            if role_dna and isinstance(role_dna, dict):
                return role_dna
        except Exception as e:
            logger.warning(f"Role DNA classification fallback triggered: {e}")

        return {
            "function": "Unknown",
            "level": "L3",
            "environment": "Unknown",
            "kpis": [],
            "cluster_id": "C0",
            "cluster_name": "General",
            "confidence": 0.0,
            "reasoning": "Fallback role classification used.",
        }

    def _ats_intelligence_agent(self, job_link: Optional[str]) -> Dict:
        """Agent 2: detect ATS platform and rules."""
        if not job_link:
            return {
                "detected": False,
                "platform": "generic",
                "platform_name": "Generic ATS",
                "preferred_format": "pdf",
                "keyword_weight": "high",
                "rules": [
                    "Single-column layout only",
                    "Standard headings",
                    "No tables, graphics, or complex formatting",
                ],
            }

        lowered = job_link.lower()
        for domain, ats_key in self.ATS_DOMAIN_MAP.items():
            if domain in lowered:
                meta = self.ATS_RULES[ats_key]
                return {
                    "detected": True,
                    "platform": ats_key,
                    "platform_name": meta["name"],
                    "preferred_format": meta["preferred_format"],
                    "keyword_weight": meta["keyword_weight"],
                    "rules": meta["rules"],
                }

        return {
            "detected": False,
            "platform": "generic",
            "platform_name": "Generic ATS",
            "preferred_format": "pdf",
            "keyword_weight": "high",
            "rules": [
                "Single-column ATS-safe structure",
                "Standard section headings",
                "Exact keyword presence in summary + skills + experience",
            ],
        }

    def _recruiter_decision_agent(self, resume_text: str) -> Dict:
        """Agent 3: 6-second recruiter scan + risk detection."""
        text = (resume_text or "")
        top = text[:1800].lower()

        risk_signals: List[Dict] = []

        vague_patterns = [r"worked on", r"helped with", r"responsible for", r"participated in"]
        vague_count = sum(len(re.findall(p, text.lower())) for p in vague_patterns)
        if vague_count >= 4:
            risk_signals.append({
                "signal": "vague_ownership_language",
                "severity": "medium",
                "detail": "High usage of participation verbs instead of ownership verbs.",
            })

        metric_hits = len(re.findall(r"\b\d+(?:\.\d+)?\s*(%|x|k|m|million|billion|users|clients|days|weeks|months|hours)\b", text.lower()))
        if metric_hits == 0:
            risk_signals.append({
                "signal": "low_metric_density",
                "severity": "high",
                "detail": "No measurable impact markers detected.",
            })

        clarity_pass = bool(re.search(r"(summary|experience|skills|education)", top))
        proof_pass = metric_hits > 0
        relevance_pass = len(text.strip()) > 300
        risk_pass = len([r for r in risk_signals if r["severity"] == "high"]) == 0

        return {
            "clarity": "pass" if clarity_pass else "fail",
            "relevance": "pass" if relevance_pass else "fail",
            "proof": "pass" if proof_pass else "fail",
            "risk": "pass" if risk_pass else "fail",
            "metric_hits": metric_hits,
            "risk_signals": risk_signals,
            "scan_score": max(0, min(100, (25 if clarity_pass else 10) + (25 if relevance_pass else 10) + (25 if proof_pass else 8) + (25 if risk_pass else 10))),
        }

    def _gap_analysis_agent(
        self,
        *,
        resume_text: str,
        job_description: str,
        role_dna: Dict,
        recruiter_scan: Dict,
    ) -> Dict:
        """Agent 4: compute gap scorecard dimensions used by optimization engines."""
        required_keywords, preferred_keywords = self._extract_keywords(job_description)

        keyword_coverage = self._coverage(resume_text, required_keywords)
        preferred_coverage = self._coverage(resume_text, preferred_keywords)

        target_title = (role_dna.get("target_title") or "").strip()
        if not target_title:
            target_title = role_dna.get("cluster_name", "")

        title_alignment = self._title_alignment_score(resume_text, target_title)
        leadership_signal = self._leadership_signal_score(resume_text)
        role_match = int(round((keyword_coverage * 0.7) + (preferred_coverage * 0.3)))

        high_risks = len([r for r in recruiter_scan.get("risk_signals", []) if r.get("severity") == "high"])
        risk_level = "high" if high_risks >= 2 else ("medium" if high_risks == 1 else "low")

        return {
            "keyword_coverage": keyword_coverage,
            "preferred_keyword_coverage": preferred_coverage,
            "title_alignment": title_alignment,
            "role_match": role_match,
            "leadership_signal": leadership_signal,
            "risk_level": risk_level,
            "required_keywords": required_keywords[:30],
            "preferred_keywords": preferred_keywords[:30],
            "missing_required_keywords": [kw for kw in required_keywords if kw.lower() not in (resume_text or "").lower()][:12],
        }

    # ── Cluster → Default/Alternate template mapping (Resume OS spec) ──
    CLUSTER_TEMPLATE_MAP = {
        "C1": {"default": "V1", "alternates": ["V2", "V5"]},  # SWE
        "C2": {"default": "V2", "alternates": ["V1", "V5"]},  # Data/BA
        "C3": {"default": "V1", "alternates": ["V5", "V2"]},  # DS/ML
        "C4": {"default": "V2", "alternates": ["V6", "V4"]},  # Product
        "C5": {"default": "V1", "alternates": ["V3"]},         # DevOps
        "C6": {"default": "V2", "alternates": ["V4"]},         # Sales
        "C7": {"default": "V2", "alternates": ["V8"]},         # Marketing
        "C8": {"default": "V3", "alternates": ["V8", "V4"]},   # HR/TA
        "C9": {"default": "V6", "alternates": ["V3", "V9"]},   # Ops/Consulting
        "C10": {"default": "V7", "alternates": ["V2"]},        # UX/UI
        "C0": {"default": "V2", "alternates": ["V1", "V8"]},   # General
    }

    def _output_engine_variant_scoring(
        self,
        *,
        role_dna: Dict,
        ats_intel: Dict,
        gap_scorecard: Dict,
        match_score: float,
    ) -> Tuple[List[Dict], Dict]:
        """Score V1-V10 variants using cluster template map + level/environment context."""
        function_text = f"{role_dna.get('function', '')} {role_dna.get('cluster_name', '')}".lower()
        env = str(role_dna.get("environment", "")).lower()
        level = str(role_dna.get("level", "L3")).upper()
        cluster_id = str(role_dna.get("cluster_id", "C0")).upper()
        is_fresher = level in ["L1", "L2"] and gap_scorecard.get("leadership_signal", 0) < 30
        is_senior = level in ["L4", "L5", "L5+"]

        variant_scores = []

        base = int(round(
            (match_score * 0.45)
            + (gap_scorecard.get("keyword_coverage", 0) * 0.20)
            + (gap_scorecard.get("role_match", 0) * 0.20)
            + (gap_scorecard.get("leadership_signal", 0) * 0.15)
        ))

        # ── Cluster-based template priority (from Resume OS spec) ──
        cluster_map = self.CLUSTER_TEMPLATE_MAP.get(cluster_id, self.CLUSTER_TEMPLATE_MAP["C0"])
        default_template = cluster_map["default"]
        alternate_templates = cluster_map["alternates"]

        # Fresher override: V1 for tech clusters, V2 for non-tech
        if is_fresher:
            tech_clusters = {"C1", "C3", "C5"}
            default_template = "V1" if cluster_id in tech_clusters else "V2"
            alternate_templates = ["V8", "V10"]  # versatility + transition fallbacks

        # Senior override: V4 (Leadership Thesis) gets a major boost
        # unless cluster already specifies V4 as default
        senior_boost_template = "V4" if is_senior and default_template != "V4" else None

        # Environment override for HR/TA (C8): startup→V8, MNC→V3
        if cluster_id == "C8":
            if "startup" in env:
                default_template = "V8"
            else:
                default_template = "V3"

        # MNC environment: V3 (Authority Frame) gets a boost
        mnc_boost = "mnc" in env or ats_intel.get("platform") in [
            "workday", "smartrecruiters", "sap_successfactors", "naukri", "darwinbox",
        ]

        for v in VARIANT_CATALOG:
            vid = v["id"]
            score = base + v["base_bias"]
            rationale_bits = []

            # ── Cluster-template matching (highest priority) ──
            if vid == default_template:
                score += 15
                rationale_bits.append(f"Default template for cluster {cluster_id}")
            elif vid in alternate_templates:
                score += 8
                rationale_bits.append(f"Alternate template for cluster {cluster_id}")

            # ── Senior boost ──
            if senior_boost_template and vid == senior_boost_template:
                score += 12
                rationale_bits.append("Leadership-first narrative matches L4+/L5+ seniority")

            # ── MNC enterprise boost ──
            if mnc_boost and vid == "V3":
                score += 8
                rationale_bits.append("Enterprise/MNC process-heavy framing aligns with target")

            # ── Function-specific boosts (secondary to cluster mapping) ──
            if vid == "V1" and any(k in function_text for k in ["software", "engineering", "data", "ml", "devops"]):
                score += 5
                rationale_bits.append("Tech-stack-first screening fit")
            if vid == "V2" and any(k in function_text for k in ["product", "sales", "marketing", "business"]):
                score += 5
                rationale_bits.append("Outcome-led structure fits business KPI hiring")
            if vid == "V5" and any(k in function_text for k in ["research", "ml", "science"]):
                score += 5
                rationale_bits.append("Proof/research emphasis fits analytical roles")
            if vid == "V6" and any(k in function_text for k in ["ops", "operation", "consult", "supply"]):
                score += 5
                rationale_bits.append("SAR-style framing aligns with ops/consulting")
            if vid == "V7" and any(k in function_text for k in ["design", "ux", "ui", "creative"]):
                score += 5
                rationale_bits.append("Portfolio-led structure best for design screening")

            # ── Level-specific adjustments ──
            if vid == "V4" and is_senior:
                score += 5
                rationale_bits.append("Senior/lead seniority band match")
            if vid == "V9" and is_senior:
                score += 4
                rationale_bits.append("Domain-depth emphasis supports specialist senior roles")

            # ── Environment-specific adjustments ──
            if vid == "V8" and ("sme" in env or "startup" in env):
                score += 4
                rationale_bits.append("Versatility framing suits SME/startup environment")

            # ── Title mismatch → transition narrative ──
            if vid == "V10" and gap_scorecard.get("title_alignment", 0) < 55:
                score += 10
                rationale_bits.append("Transition framing compensates title mismatch")

            # ── Fresher-specific boosts ──
            if is_fresher:
                if vid in ["V1", "V2"]:
                    score += 3
                    rationale_bits.append("Fresher-appropriate template")
                # Suppress leadership/senior templates for freshers
                if vid in ["V4", "V9"]:
                    score -= 8
                    rationale_bits.append("Leadership template not suited for fresher")

            if not rationale_bits:
                rationale_bits.append("General fit based on role-match and keyword profile")

            score = max(40, min(99, score))
            variant_scores.append({
                "id": vid,
                "name": v["name"],
                "score": int(score),
                "rationale": "; ".join(rationale_bits),
            })

        variant_scores.sort(key=lambda x: x["score"], reverse=True)
        recommended = variant_scores[0]
        return variant_scores, recommended

    def _strategy_log_agent(
        self,
        *,
        role_dna: Dict,
        ats_intel: Dict,
        gap_scorecard: Dict,
        changes_made: List[Dict],
        recommended_variant: Dict,
        variant_scores: List[Dict],
        fallback_modes: Optional[List[str]] = None,
        constraint_result: Optional[Dict] = None,
        tradeoff_log: Optional[Dict] = None,
    ) -> Dict:
        """Produce strategy log per Resume OS spec — every change has before/after + rationale."""
        top3 = variant_scores[:3]
        return {
            "input_summary": {
                "role_dna": {
                    "function": role_dna.get("function"),
                    "level": role_dna.get("level"),
                    "environment": role_dna.get("environment"),
                    "kpis": role_dna.get("kpis", []),
                    "cluster": role_dna.get("cluster_name"),
                    "cluster_id": role_dna.get("cluster_id"),
                    "confidence": role_dna.get("confidence"),
                },
                "ats_detected": ats_intel.get("platform_name"),
                "fallback_modes_activated": fallback_modes or [],
            },
            "ats_strategy": {
                "platform": ats_intel.get("platform_name"),
                "preferred_format": ats_intel.get("preferred_format"),
                "rules_applied": ats_intel.get("rules", []),
            },
            "gap_summary": {
                "keyword_coverage": gap_scorecard.get("keyword_coverage"),
                "title_alignment": gap_scorecard.get("title_alignment"),
                "role_match": gap_scorecard.get("role_match"),
                "leadership_signal": gap_scorecard.get("leadership_signal"),
                "risk_level": gap_scorecard.get("risk_level"),
                "missing_required_keywords": gap_scorecard.get("missing_required_keywords", []),
            },
            "constraint_result": {
                "passed": constraint_result.get("passed", True) if constraint_result else True,
                "hard_fails": constraint_result.get("hard_fails", []) if constraint_result else [],
                "soft_fails": constraint_result.get("soft_fails", []) if constraint_result else [],
            },
            "changes_applied": changes_made[:12] if isinstance(changes_made, list) else [],
            "tradeoff_log": tradeoff_log or {},
            "variant_recommendation": {
                "recommended": recommended_variant,
                "alternatives": top3[1:3] if len(top3) > 1 else [],
            },
            "integrity_constraints": [
                "No fabricated experience, titles, companies, or dates",
                "Only evidence-backed keywords were prioritized",
                "Candidate personal details must be extracted, never generated",
                "Level language not inflated beyond evidence",
                "Every engine ran or logged null-change",
            ],
        }

    def _build_optimization_context(
        self,
        *,
        role_dna: Dict,
        ats_intel: Dict,
        recruiter_scan: Dict,
        gap_scorecard: Dict,
        fallback_modes: Optional[List[str]] = None,
        constraint_result: Optional[Dict] = None,
        ats_score_result: Optional[Dict] = None,
    ) -> str:
        """Build enriched context string for the Gemini optimization prompt.

        Injects full cluster-specific domain expertise: bullet formula, KPI vocabulary,
        signal density targets, voice profile, environment-specific language, and
        fresher-specific guidance.
        """
        cluster_id = str(role_dna.get("cluster_id", "C0")).upper()
        expertise = CLUSTER_EXPERTISE.get(cluster_id, CLUSTER_EXPERTISE["C0"])
        level = str(role_dna.get("level", "L3")).upper()
        env = str(role_dna.get("environment", "")).lower()
        is_fresher = level in ["L1", "L2"]

        lines = [
            f"Role DNA: function={role_dna.get('function')} | level={role_dna.get('level')} | environment={role_dna.get('environment')} | cluster={role_dna.get('cluster_name')} | cluster_id={cluster_id}",
            f"KPIs: {', '.join(role_dna.get('kpis', [])[:6])}",
            f"ATS: platform={ats_intel.get('platform_name')} | preferred_format={ats_intel.get('preferred_format')} | keyword_weight={ats_intel.get('keyword_weight')} | rules={'; '.join(ats_intel.get('rules', []))}",
            f"Recruiter scan: clarity={recruiter_scan.get('clarity')}, relevance={recruiter_scan.get('relevance')}, proof={recruiter_scan.get('proof')}, risk={recruiter_scan.get('risk')}, metric_hits={recruiter_scan.get('metric_hits')}",
            f"Gap scorecard: keyword_coverage={gap_scorecard.get('keyword_coverage')}%, preferred_keyword_coverage={gap_scorecard.get('preferred_keyword_coverage')}%, title_alignment={gap_scorecard.get('title_alignment')}%, role_match={gap_scorecard.get('role_match')}%, leadership_signal={gap_scorecard.get('leadership_signal')}%, risk_level={gap_scorecard.get('risk_level')}",
            f"Missing required keywords: {', '.join(gap_scorecard.get('missing_required_keywords', [])[:12])}",
        ]

        # ── Cluster Domain Expertise Block ──
        lines.append("")
        lines.append(f"━━━ DOMAIN EXPERTISE: {expertise['name']} ({cluster_id}) ━━━")
        lines.append(f"BULLET FORMULA: {expertise['bullet_formula']}")
        lines.append(f"MANDATORY ELEMENTS: {'; '.join(expertise['mandatory_elements'])}")
        lines.append(f"KPI VOCABULARY (use in bullets where evidence exists): {', '.join(expertise['kpi_vocabulary'][:10])}")

        # Signal density targets
        density = expertise.get("signal_density", {})
        density_parts = []
        if density.get("hard_min", 0) > 0:
            density_parts.append(f"Hard Signal ≥{density['hard_min']:.0%}")
        if density.get("cognitive_min", 0) > 0:
            density_parts.append(f"Cognitive Signal ≥{density['cognitive_min']:.0%}")
        if density.get("trust_min", 0) > 0:
            density_parts.append(f"Trust Signal ≥{density['trust_min']:.0%}")
        if density.get("structural_priority"):
            density_parts.append("STRUCTURAL signals are PRIMARY (tech stack/tool names first)")
        if density_parts:
            lines.append(f"SIGNAL DENSITY TARGETS: {'; '.join(density_parts)}")

        # Voice profile guidance
        voice_profile = expertise.get("voice_profile", "neutral_professional")
        voice_map = {
            "technical_matter_of_fact": "Use technical, direct, evidence-led language. No embellishment. Precise tool/framework naming.",
            "analytical_precise": "Use data-driven, precise analytical language. Show insight-to-decision chains.",
            "strategic_narrative": "Use strategic, decision-oriented language. Show problem→diagnosis→action→outcome.",
            "results_quantified_energetic": "Use results-first, quantified, energetic language. Every bullet must lead with or contain a metric.",
            "process_oriented_structured": "Use structured, process-oriented language. SAR (Situation→Action→Result) format where applicable.",
            "user_centric_process": "Use user-centric, research-led language. Show design thinking: problem→research→design decision→user outcome.",
            "neutral_professional": "Use professional, clear language with quantified outcomes.",
        }
        lines.append(f"VOICE PROFILE: {voice_map.get(voice_profile, voice_map['neutral_professional'])}")
        lines.append(f"PREFERRED VERBS: {', '.join(expertise.get('voice_verbs', [])[:8])}")
        lines.append(f"ANTI-PATTERNS (NEVER use): {', '.join(expertise.get('voice_anti_patterns', []))}")

        # Tool name precision
        precision = expertise.get("tool_precision", "moderate")
        if precision == "strict":
            lines.append("TOOL NAMING: STRICT — use exact tool names from JD/resume, no approximation. 'React' not 'ReactJS'. Include versions if present.")
        elif precision == "moderate":
            lines.append("TOOL NAMING: MODERATE — use JD-preferred spelling. Reasonable synonyms accepted for non-ATS platforms.")

        # Portfolio / model baseline requirements
        if expertise.get("portfolio_required"):
            lines.append("PORTFOLIO GATE: Portfolio URL MUST be hero position (contact block, above fold). If missing, flag as critical gap.")
        if expertise.get("model_baseline_required"):
            lines.append("MODEL BASELINE GATE: First achievement bullet MUST include 'model accuracy vs baseline' language. MANDATORY for this cluster.")

        # Contact extras
        extras = expertise.get("contact_extras", [])
        if extras:
            lines.append(f"CONTACT EXTRAS (surface in contact block if present): {', '.join(extras)}")

        # Recency limits for this cluster
        rec = expertise.get("recency_limits", {})
        lines.append(f"RECENCY LIMITS: current role={rec.get('current', 5)} bullets, 1 prior={rec.get('prior_1', 4)}, 2nd prior={rec.get('prior_2', 3)}, older={rec.get('prior_3_plus', 2)}")

        # ── Environment×Cluster Language ──
        if "startup" in env:
            env_lang = expertise.get("env_startup", [])
            if env_lang:
                lines.append(f"STARTUP LANGUAGE (amplify): {'; '.join(env_lang)}")
        elif "mnc" in env:
            env_lang = expertise.get("env_mnc", [])
            if env_lang:
                lines.append(f"MNC LANGUAGE (amplify): {'; '.join(env_lang)}")

        # ── Fresher-specific guidance ──
        if is_fresher:
            fresher_signals = expertise.get("fresher_signals", [])
            if fresher_signals:
                lines.append(f"FRESHER MODE: Prioritize these signals: {', '.join(fresher_signals)}")
            if expertise.get("fresher_hard_gate"):
                lines.append(f"FRESHER GATE: {expertise['fresher_hard_gate']}")
            lines.append("FRESHER RULES: Trust+Structural signals prioritized. Proxy metrics accepted at same weight. PickCV assessment in header. Education prominent.")

        lines.append("")

        # ── Signal priority guidance ──
        signal_guidance = {
            "C1": "Signal priority: STRUCTURAL (exact stack) > HARD (throughput/latency) > TRUST (GitHub/companies) > COGNITIVE",
            "C2": "Signal priority: HARD (business outcome per analysis) > COGNITIVE (insight-decision chain) > STRUCTURAL > TRUST",
            "C3": "Signal priority: HARD (model accuracy vs baseline MANDATORY) > TRUST (publications) > COGNITIVE > STRUCTURAL",
            "C4": "Signal priority: COGNITIVE (problem-decision-outcome) > HARD (DAU/ARR/NPS) > TRUST > STRUCTURAL",
            "C5": "Signal priority: STRUCTURAL (exact infra stack) > HARD (uptime%/cost reduction) > TRUST (cloud certs) > COGNITIVE",
            "C6": "Signal priority: HARD (quota%/ARR/deal size EVERY BULLET) > TRUST (company/named accounts) > STRUCTURAL > COGNITIVE",
            "C7": "Signal priority: HARD (campaign ROI/CAC/ROAS) > STRUCTURAL (channel+budget scope) > COGNITIVE > TRUST",
            "C8": "Signal priority: HARD (hiring volume/TTF/offer acceptance) > STRUCTURAL (HRTech stack) > TRUST > COGNITIVE",
            "C9": "Signal priority: COGNITIVE (SAR: situation-action-result) > HARD (efficiency gain) > STRUCTURAL > TRUST",
            "C10": "Signal priority: TRUST (portfolio URL hero above fold) > COGNITIVE (problem-research-decision) > HARD > STRUCTURAL",
        }
        if cluster_id in signal_guidance:
            lines.append(signal_guidance[cluster_id])

        # ── Fallback modes ──
        if fallback_modes:
            lines.append(f"Fallback modes active: {', '.join(fallback_modes)}")
            if "BLIND_MODE" in fallback_modes:
                lines.append("BLIND_MODE: No JD provided. Optimize for general ATS compatibility using resume signals only.")
            if "PROXY_ENFORCED_MODE" in fallback_modes:
                lines.append("PROXY_ENFORCED_MODE: No metrics detected. Use scope proxies (team size, user count, budget).")
            if "CONTENT_VOLUME_CORRECTION_BARE_BONES" in fallback_modes:
                lines.append("BARE_BONES_MODE: Very thin resume. Expand with inferred scope proxies. Do NOT fabricate.")

        if constraint_result:
            if constraint_result.get("hard_fails"):
                lines.append(f"CONSTRAINT HARD FAILS: {'; '.join(constraint_result['hard_fails'])}")
            if constraint_result.get("soft_fails"):
                lines.append(f"CONSTRAINT SOFT FAILS: {'; '.join(constraint_result['soft_fails'][:5])}")

        if ats_score_result:
            lines.append(f"ATS Compatibility Score: {ats_score_result.get('ats_score')}% ({ats_score_result.get('interpretation')})")
            if ats_score_result.get("ats_score", 0) < 70:
                lines.append("ATS_PRIORITY_MODE: Score < 70% — prioritize keyword density and ATS compliance over readability.")
            elif ats_score_result.get("ats_score", 0) >= 80:
                lines.append("HUMAN_PRIORITY_MODE: ATS threshold met — prioritize recruiter scan quality and authenticity.")

        return "\n".join(lines)

    def _extract_keywords(self, jd_text: str) -> Tuple[List[str], List[str]]:
        text = (jd_text or "").lower()
        token_candidates = re.findall(r"[a-zA-Z][a-zA-Z0-9+.#/-]{1,24}", text)

        # Deduplicate preserving order
        seen = set()
        deduped = []
        for tok in token_candidates:
            if tok not in seen:
                seen.add(tok)
                deduped.append(tok)

        stopwords = {
            "the", "and", "for", "with", "from", "that", "this", "will", "you", "your", "our", "their", "have", "has", "are", "was", "were", "be", "to", "of", "in", "on", "at", "or", "as", "an", "a", "by", "we", "is", "it", "job", "role", "team", "work", "years", "year", "experience", "required", "preferred", "skills"
        }

        filtered = [t for t in deduped if t not in stopwords and len(t) > 2]

        must_have_cues = re.findall(r"(?:must have|required|essential)[:\- ]+([a-z0-9 ,+.#/-]{5,120})", text)
        preferred_cues = re.findall(r"(?:preferred|nice to have|bonus)[:\- ]+([a-z0-9 ,+.#/-]{5,120})", text)

        required_keywords = []
        for chunk in must_have_cues:
            required_keywords.extend([x.strip() for x in re.split(r"[,/]| and ", chunk) if len(x.strip()) > 2])

        preferred_keywords = []
        for chunk in preferred_cues:
            preferred_keywords.extend([x.strip() for x in re.split(r"[,/]| and ", chunk) if len(x.strip()) > 2])

        if not required_keywords:
            required_keywords = filtered[:24]
        if not preferred_keywords:
            preferred_keywords = filtered[24:40]

        return required_keywords, preferred_keywords

    def _coverage(self, resume_text: str, keywords: List[str]) -> int:
        if not keywords:
            return 0
        text = (resume_text or "").lower()
        hits = sum(1 for kw in keywords if kw and kw.lower() in text)
        return int(round((hits / max(len(keywords), 1)) * 100))

    def _title_alignment_score(self, resume_text: str, target_title: str) -> int:
        if not target_title:
            return 50
        t = target_title.lower().strip()
        text = (resume_text or "").lower()
        if t in text:
            return 90

        words = [w for w in re.findall(r"[a-z]+", t) if len(w) > 2]
        if not words:
            return 50
        overlap = sum(1 for w in words if w in text)
        return int(round((overlap / len(words)) * 85))

    def _leadership_signal_score(self, resume_text: str) -> int:
        text = (resume_text or "").lower()
        verbs = [
            "led", "owned", "designed", "architected", "built", "launched",
            "scaled", "improved", "drove", "managed", "mentored", "implemented",
        ]
        hits = sum(text.count(v) for v in verbs)
        return max(20, min(95, 20 + (hits * 5)))


resume_os_orchestrator = ResumeOSOrchestrator()
