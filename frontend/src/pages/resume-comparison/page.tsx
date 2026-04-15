import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import InlineResumeEditor from '../optimized-resume/components/InlineResumeEditor';
import { ResumeData, DynamicTemplateConfig, PersonaAngle } from '../optimized-resume/types';
import { getVariantTemplates } from '../optimized-resume/components/themes';
import { authFetch } from '../../services/authFetch';
import { API_BASE_URL } from '../../config/api';

/** Build a set of rewritten bullet strings for quick lookup */
function buildChangeLookup(changes: OptimizationData['changes_made']) {
  const rewrittenSet = new Set<string>();
  const changeMap = new Map<string, { original?: string; why: string; section: string; requirement_matched?: string }>();
  for (const c of (changes || [])) {
    if (c.rewritten) {
      rewrittenSet.add(c.rewritten.trim());
      changeMap.set(c.rewritten.trim(), { original: c.original, why: c.why, section: c.section, requirement_matched: c.requirement_matched });
    }
  }
  return { rewrittenSet, changeMap };
}

interface DeprioritizeOption {
  id: string;
  label: string;
  description: string;
}

interface OptimizationData {
  resumeId: number;
  job_title: string;
  job_description?: string;
  original_resume_text?: string;
  optimized_resume: string;
  changes_made: Array<{ section: string; what_changed?: string; original?: string; rewritten?: string; why: string; requirement_matched?: string }>;
  key_improvements: string[];
  keywords_added: string[];
  match_score: number;
  ats_optimized: boolean;
  comparison: {
    summary: string;
    detailed_changes: Array<{ before: string; after: string; reason: string; impact: string }>;
  };
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
  professional_summary?: string;
  experience?: any[];
  skills?: any;
  education?: any[];
  resume_variants?: Array<{
    rank?: number;
    id: string;
    name: string;
    score: number;
    rationale?: string;
    section_order?: string[];
    recommended_file_format?: string;
    optimized_resume_text?: string;
    resume_data?: any;
    page_estimate?: number;
  }>;
  resume_os?: {
    role_dna?: {
      function?: string;
      level?: string;
      environment?: string;
      cluster_name?: string;
      cluster?: string;
      confidence?: number;
    };
    recommended_variant?: {
      id?: string;
      name?: string;
      score?: number;
      rationale?: string;
    };
    deprioritize_options?: DeprioritizeOption[];
  };
  jd_analysis?: any;
  evidence_map?: any[];
  overall_match_assessment?: any;
}

export default function ResumeComparisonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);


  // Page optimization state
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [showCompressModal, setShowCompressModal] = useState(false);
  const [targetPages, setTargetPages] = useState<1 | 2>(1);
  const [selectedDeprioritize, setSelectedDeprioritize] = useState<string[]>([]);
  const [customDeprioritize, setCustomDeprioritize] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedData, setCompressedData] = useState<ResumeData | null>(null);
  const [compressionNotes, setCompressionNotes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'full' | 'compressed'>('full');
  const [compressedPageEstimate, setCompressedPageEstimate] = useState<number | null>(null);

  // Recommended visual template based on backend variant
  const [recommendedTemplate, setRecommendedTemplate] = useState<string>('v1-stack-first');
  const [variantId, setVariantId] = useState<string | undefined>();
  const [variantRationale, setVariantRationale] = useState<string | undefined>();

  // Dynamic template configs (LLM-generated per-person templates)
  const [dynamicConfigs, setDynamicConfigs] = useState<Record<string, DynamicTemplateConfig>>({});
  const [dynamicLoading, setDynamicLoading] = useState<Record<string, boolean>>({});
  const [activeDynamicConfig, setActiveDynamicConfig] = useState<DynamicTemplateConfig | undefined>();

  // Side-by-side comparison view
  const [showComparison, setShowComparison] = useState(true);

  // Full (original) data preserved for switching between views
  const [fullResumeData, setFullResumeData] = useState<ResumeData | null>(null);

  // Actual rendered page count from InlineResumeEditor
  const [actualPageCount, setActualPageCount] = useState(1);
  const handlePageCountChange = useCallback((pages: number) => setActualPageCount(pages), []);

  // Callback for when TemplatePicker (inside editor) selects a dynamic template
  const handleDynamicTemplateSelect = useCallback((configKey: string | undefined) => {
    if (!configKey) {
      setActiveDynamicConfig(undefined);
    } else {
      setActiveDynamicConfig(dynamicConfigs[configKey]);
    }
  }, [dynamicConfigs]);

  // Smart deprioritize options derived from actual resume data
  const smartDeprioritizeOptions = useMemo(() => {
    if (!resumeData) return [];
    const opts: DeprioritizeOption[] = [];
    const expCount = resumeData.experience?.length || 0;
    if (expCount > 3) {
      const olderRoles = resumeData.experience.slice(2).map(e => e.company).join(', ');
      opts.push({
        id: 'older_experience',
        label: `Trim ${expCount - 2} older roles (${olderRoles})`,
        description: 'Condense older positions to one-line summaries or remove them',
      });
    }
    const maxBullets = Math.max(...(resumeData.experience?.map(e => e.bullets?.length || 0) || [0]));
    const avgBullets = resumeData.experience?.length
      ? Math.round(resumeData.experience.reduce((s, e) => s + (e.bullets?.length || 0), 0) / resumeData.experience.length)
      : 0;
    if (avgBullets > 3) {
      opts.push({
        id: 'reduce_bullets',
        label: `Reduce bullets (avg ${avgBullets} → 3 per role)`,
        description: `Keep only the highest-impact achievements for each position`,
      });
    } else if (maxBullets > 4) {
      opts.push({
        id: 'reduce_bullets',
        label: `Trim roles with ${maxBullets}+ bullets down to 3`,
        description: 'Keep only the highest-impact achievements',
      });
    }
    const skillCount = resumeData.skills?.length || 0;
    if (skillCount > 10) {
      opts.push({
        id: 'reduce_skills',
        label: `Compact skills list (${skillCount} → top 10)`,
        description: 'Keep only the most relevant skills for the target role',
      });
    }
    if ((resumeData.summary?.length || 0) > 200) {
      opts.push({
        id: 'shorten_summary',
        label: 'Shorten professional summary',
        description: `Currently ${Math.ceil((resumeData.summary?.length || 0) / 45)} lines — condense to 2-3 impactful lines`,
      });
    }
    if ((resumeData.education?.length || 0) > 1) {
      opts.push({
        id: 'education_details',
        label: `Simplify education (${resumeData.education.length} entries)`,
        description: 'Keep only degree + institution, drop extra details',
      });
    }
    opts.push({
      id: 'trim_certifications',
      label: 'Remove certifications / projects',
      description: 'Drop supplementary sections that aren\'t role-critical',
    });
    return opts;
  }, [resumeData]);

  useEffect(() => {
    const stateData = location.state?.optimizedResume;
    const sessionData = sessionStorage.getItem('optimizationData');

    if (stateData) {
      hydrateOptimizationData(stateData);
    } else if (sessionData) {
      const parsed = JSON.parse(sessionData);
      hydrateOptimizationData(parsed);
    } else {
      navigate('/');
    }
  }, [navigate, location.state]);

  /* ─── Fire 4 parallel dynamic template generation calls ─── */
  useEffect(() => {
    if (!fullResumeData || !variantId || !selectedVariant?.resume_data) return;

    const PERSONA_ANGLES: PersonaAngle[] = ['depth', 'impact', 'narrative', 'breadth'];
    const staticConfig = getVariantTemplates(variantId as any)[0];

    PERSONA_ANGLES.forEach((angle, idx) => {
      const slotIndex = idx + 2; // slots 2-5
      const configKey = `dynamic-${slotIndex}`;

      setDynamicLoading(prev => ({ ...prev, [configKey]: true }));

      authFetch(`${import.meta.env.VITE_API_URL}/resume/generate-dynamic-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: variantId,
          resume_data: selectedVariant.resume_data,
          persona_angle: angle,
          slot_index: slotIndex,
          role_dna: optimizationData?.resume_os?.role_dna || {},
          job_title: optimizationData?.job_title || '',
          job_description: optimizationData?.job_description || '',
          static_template_config: staticConfig ? { id: staticConfig.id, name: staticConfig.name, atsScore: staticConfig.atsScore } : {},
        }),
      })
        .then(res => res.json())
        .then(json => {
          // Backend returns config as top-level OR nested under .config
          const cfg = json.config || (json.layout ? json : null);
          if (cfg) {
            setDynamicConfigs(prev => ({ ...prev, [configKey]: cfg as DynamicTemplateConfig }));
          }
        })
        .catch(() => { /* silently fail — static templates remain */ })
        .finally(() => {
          setDynamicLoading(prev => ({ ...prev, [configKey]: false }));
        });
    });
  }, [fullResumeData, variantId, selectedVariant]);

  const hydrateOptimizationData = (data: OptimizationData) => {
    setOptimizationData(data);

    // Derive recommended visual template from the backend variant
    const vid = data.resume_os?.recommended_variant?.id;
    if (vid) {
      setVariantId(vid);
      setVariantRationale(data.resume_os?.recommended_variant?.rationale || undefined);
      const varTemplates = getVariantTemplates(vid as any);
      if (varTemplates.length > 0) {
        setRecommendedTemplate(varTemplates[0].id);
      }
    }

    const variants = Array.isArray(data.resume_variants) ? data.resume_variants : [];
    if (variants.length > 0 && variants[0]?.resume_data) {
      const recommendedId = data.resume_os?.recommended_variant?.id;
      const recommended = recommendedId
        ? variants.find((v) => v.id === recommendedId)
        : variants[0];
      const selected = recommended?.resume_data ? recommended : variants[0];
      setSelectedVariant(selected);
      const rd = transformToResumeData(selected.resume_data);
      if (rd) setFullResumeData(rd);
      return;
    }
    const rd = transformToResumeData(data);
    if (rd) setFullResumeData(rd);
  };

  const transformToResumeData = (apiData: any): ResumeData | null => {
    if (!apiData) return null;
    const transformed: ResumeData = {
      name: apiData.name || '',
      title: apiData.title || '',
      email: apiData.email || '',
      phone: apiData.phone || '',
      linkedin: apiData.linkedin || '',
      location: apiData.location || '',
      summary: apiData.professional_summary || apiData.summary || '',
      experience: Array.isArray(apiData.experience)
        ? apiData.experience.map((exp: any) => ({
            role: exp.role || exp.title || '',
            company: exp.company || '',
            location: exp.location || '',
            period: exp.period || exp.dates || '',
            bullets: Array.isArray(exp.bullets)
              ? exp.bullets
              : Array.isArray(exp.achievements)
              ? exp.achievements
              : Array.isArray(exp.responsibilities)
              ? exp.responsibilities
              : [],
          }))
        : [],
      skills: Array.isArray(apiData.skills)
        ? apiData.skills
        : Array.isArray(apiData.skills?.technical)
        ? apiData.skills.technical
        : typeof apiData.skills === 'string'
        ? apiData.skills.split(',').map((s: string) => s.trim())
        : [],
      education: Array.isArray(apiData.education)
        ? apiData.education.map((edu: any) => ({
            degree: edu.degree || '',
            school: edu.school || edu.institution || '',
            period: edu.period || edu.year || '',
          }))
        : [],
      certifications: Array.isArray(apiData.certifications) && apiData.certifications.length > 0
        ? apiData.certifications.map((c: any) => typeof c === 'string' ? c : c.name || c.title || '')
        : Array.isArray(apiData.certificates) && apiData.certificates.length > 0
        ? apiData.certificates.map((c: any) => typeof c === 'string' ? c : c.name || c.title || '')
        : [],
      achievements: Array.isArray(apiData.achievements) && apiData.achievements.length > 0
        ? apiData.achievements.map((a: any) => typeof a === 'string' ? a : a.description || a.title || '')
        : Array.isArray(apiData.awards) && apiData.awards.length > 0
        ? apiData.awards.map((a: any) => typeof a === 'string' ? a : a.description || a.title || '')
        : Array.isArray(apiData.certificates_and_achievements) && apiData.certificates_and_achievements.length > 0
        ? apiData.certificates_and_achievements.map((a: any) => typeof a === 'string' ? a : a.description || a.title || '')
        : [],
    };

    // Fallback: Parse certifications/achievements from original resume text if structured data is empty
    if ((!transformed.certifications || transformed.certifications.length === 0) ||
        (!transformed.achievements || transformed.achievements.length === 0)) {
      const rawText = optimizationData?.original_resume_text || apiData.optimized_resume || '';
      if (rawText) {
        const certAchMatch = rawText.match(/(?:certificates?\s+and\s+achievements?|certifications?|achievements?|awards?)\s*\n([\s\S]*?)(?=\n\s*(?:PROFESSIONAL SUMMARY|SUMMARY|EXPERIENCE|WORK EXPERIENCE|EDUCATION|SKILLS|TECHNICAL SKILLS|PROJECTS|PUBLICATIONS|LANGUAGES|INTERESTS|OBJECTIVE|PROFILE)\s*$|\n{3,}|$)/im);
        if (certAchMatch) {
          const lines = certAchMatch[1].split('\n')
            .map(l => l.replace(/^[-•·▪*+]\s*/, '').trim())
            .filter(l => l.length > 3);
          if (lines.length > 0) {
            if (!transformed.certifications?.length && !transformed.achievements?.length) {
              transformed.achievements = lines;
            } else if (!transformed.achievements?.length) {
              transformed.achievements = lines;
            }
          }
        }
      }
    }

    setResumeData(transformed);
    return transformed;
  };

  /* ─── Compression API call ─── */
  const handleCompress = async () => {
    if (!selectedVariant?.resume_data || !optimizationData) return;
    setIsCompressing(true);

    try {
      const res = await authFetch(`${API_BASE_URL}/resume/compress-variant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: selectedVariant.id || 'V1',
          variant_data: selectedVariant.resume_data,
          target_pages: targetPages,
          role_dna: optimizationData.resume_os?.role_dna || {},
          deprioritize: {
            categories: selectedDeprioritize,
            custom_text: customDeprioritize,
          },
        }),
      });

      if (!res.ok) throw new Error('Compression failed');

      const result = await res.json();
      const cd = transformToResumeData(result.resume_data);
      if (cd) {
        setCompressedData(cd);
        // Switch to compressed view but keep full data available
        setResumeData(cd);
        setViewMode('compressed');
      }
      setCompressionNotes(result.compression_notes || []);
      setCompressedPageEstimate(result.page_estimate || targetPages);
      setShowCompressModal(false);
    } catch (err) {
      console.error('Compression failed:', err);
      alert('Failed to compress resume. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  const switchToFullVersion = () => {
    if (fullResumeData) {
      setResumeData(fullResumeData);
      setViewMode('full');
    }
  };

  const switchToCompressedVersion = () => {
    if (compressedData) {
      setResumeData(compressedData);
      setViewMode('compressed');
    }
  };

  const toggleDeprioritize = (id: string) => {
    setSelectedDeprioritize((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const currentPageEstimate = actualPageCount || selectedVariant?.page_estimate || 1;

  if (!optimizationData) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-bg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-500 animate-spin">
            <div className="w-8 h-8 rounded-full border-4 border-transparent border-t-white"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Preparing your resume...</h2>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen mesh-bg">
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-medium mb-4">
              <i className="ri-check-double-line text-teal-500"></i>
              Resume Optimized Successfully
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Your Resume is Ready</h1>
            <p className="text-base text-gray-600 max-w-xl mx-auto">
              Optimized for{' '}
              <span className="font-semibold text-teal-600">{optimizationData.job_title}</span> · Click
              any text to edit directly
            </p>

            {/* Preview & Edit — positioned prominently */}
            {showComparison && (
              <div className="mt-4">
                <button
                  onClick={() => setShowComparison(false)}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md hover:shadow-lg hover:scale-[1.01]"
                >
                  <i className="ri-eye-line text-sm"></i>
                  Preview & Edit Resume
                  <i className="ri-arrow-right-s-line text-sm opacity-70"></i>
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-teal-600">{optimizationData.match_score}%</div>
                <span className="text-xs text-gray-500">Match</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-emerald-600">
                  {optimizationData.keywords_added?.length || 0}
                </div>
                <span className="text-xs text-gray-500">Keywords</span>
              </div>
              {!!optimizationData.resume_variants?.length && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-indigo-600">{optimizationData.resume_variants.length}</div>
                  <span className="text-xs text-gray-500">Variants</span>
                </div>
              )}
              {currentPageEstimate > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-violet-600">{viewMode === 'compressed' && compressedPageEstimate ? compressedPageEstimate : currentPageEstimate}</div>
                  <span className="text-xs text-gray-500">{(viewMode === 'compressed' && compressedPageEstimate ? compressedPageEstimate : currentPageEstimate) === 1 ? 'Page' : 'Pages'}</span>
                </div>
              )}
              {optimizationData.ats_optimized && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 shadow-sm border border-emerald-100">
                  <i className="ri-shield-check-fill text-lg text-emerald-500"></i>
                  <span className="text-xs font-semibold text-emerald-700">ATS Ready</span>
                </div>
              )}
            </div>

            {optimizationData.resume_os?.recommended_variant && (
              <div className="mt-5 max-w-3xl mx-auto bg-white/90 border border-teal-100 rounded-2xl p-4 text-left shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-teal-700 bg-teal-50 px-2 py-1 rounded-md">
                    <i className="ri-sparkling-2-fill mr-1"></i>AI Recommendation
                  </span>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {optimizationData.resume_os.recommended_variant.score}% Match
                  </span>
                </div>

                {optimizationData.resume_os?.role_dna && (
                  <p className="text-sm text-gray-700 mb-1.5">
                    We've optimized your resume for a <span className="font-semibold">{optimizationData.resume_os.role_dna.level || ''} {optimizationData.resume_os.role_dna.function || ''}</span> role
                    {optimizationData.resume_os.role_dna.environment ? ` in ${optimizationData.resume_os.role_dna.environment} environments` : ''}.
                  </p>
                )}

                <p className="text-xs text-gray-500 leading-relaxed">
                  {optimizationData.resume_os.recommended_variant.rationale}
                </p>
              </div>
            )}

            {/* ── Page Optimization Controls ── */}
            {currentPageEstimate > 1 && !compressedData && (
              <div className="mt-5 max-w-3xl mx-auto overflow-hidden rounded-2xl border border-violet-200 shadow-sm">
                {/* Header bar */}
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <i className="ri-file-copy-2-line text-violet-600 text-lg"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Your resume is {currentPageEstimate} pages
                        </p>
                        <p className="text-xs text-gray-500">
                          Recruiters spend ~6 seconds scanning. A concise resume gets more interviews.
                        </p>
                      </div>
                    </div>
                    {!showCompressModal ? (
                      <button
                        onClick={() => setShowCompressModal(true)}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-md hover:shadow-lg"
                      >
                        <i className="ri-magic-line mr-1.5"></i>Smart Compress
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowCompressModal(false)}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable compress panel */}
                {showCompressModal && (
                  <div className="bg-white px-5 py-5 border-t border-violet-100 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Step 1: Target page count */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Step 1 — Target length</p>
                      <div className="flex gap-2">
                        {currentPageEstimate > 2 && (
                          <button
                            onClick={() => setTargetPages(2)}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                              targetPages === 2
                                ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <i className="ri-file-copy-2-line mr-1.5"></i>
                            Fit to 2 pages
                          </button>
                        )}
                        <button
                          onClick={() => setTargetPages(1)}
                          className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                            targetPages === 1
                              ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <i className="ri-file-line mr-1.5"></i>
                          Fit to 1 page
                          <span className="ml-1.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">Recommended</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 2: Smart deprioritize options */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Step 2 — What can we trim?</p>
                      <p className="text-xs text-gray-400 mb-3">We analyzed your resume. Select what matters less for this role:</p>
                      <div className="space-y-2">
                        {smartDeprioritizeOptions.map((option) => (
                          <label
                            key={option.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedDeprioritize.includes(option.id)
                                ? 'border-violet-300 bg-violet-50/70 shadow-sm'
                                : 'border-gray-150 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedDeprioritize.includes(option.id)}
                              onChange={() => toggleDeprioritize(option.id)}
                              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{option.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Custom instructions */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Step 3 — Anything else? <span className="font-normal text-gray-400">(optional)</span></p>
                      <textarea
                        value={customDeprioritize}
                        onChange={(e) => setCustomDeprioritize(e.target.value)}
                        placeholder='e.g. "Remove my 2018 internship at XYZ Corp" or "Focus more on leadership and less on technical details"'
                        rows={2}
                        maxLength={500}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all resize-none placeholder:text-gray-400"
                      />
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-gray-400">
                        {selectedDeprioritize.length === 0 && !customDeprioritize.trim()
                          ? 'Select at least one option or add custom instructions'
                          : `${selectedDeprioritize.length} option${selectedDeprioritize.length !== 1 ? 's' : ''} selected`}
                      </p>
                      <button
                        onClick={handleCompress}
                        disabled={isCompressing || (selectedDeprioritize.length === 0 && !customDeprioritize.trim())}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {isCompressing ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Compressing to {targetPages} page{targetPages > 1 ? 's' : ''}...
                          </span>
                        ) : (
                          <>
                            <i className="ri-magic-line mr-1.5"></i>
                            Compress to {targetPages} {targetPages === 1 ? 'Page' : 'Pages'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Version Switcher (after compression) ── */}
            {compressedData && (
              <div className="mt-5 max-w-3xl mx-auto space-y-3">
                <div className="flex items-center justify-center gap-1 p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={switchToFullVersion}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      viewMode === 'full'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <i className="ri-file-list-3-line mr-1.5"></i>
                    Full Version ({currentPageEstimate} {currentPageEstimate === 1 ? 'page' : 'pages'})
                  </button>
                  <button
                    onClick={switchToCompressedVersion}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      viewMode === 'compressed'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <i className="ri-compress-line mr-1.5"></i>
                    Compressed ({compressedPageEstimate || targetPages} {(compressedPageEstimate || targetPages) === 1 ? 'page' : 'pages'})
                  </button>
                </div>

                {viewMode === 'compressed' && compressionNotes.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-semibold text-amber-800 mb-1.5">
                      <i className="ri-information-line mr-1"></i>What was trimmed:
                    </p>
                    <ul className="text-xs text-amber-700 space-y-0.5">
                      {compressionNotes.map((note, idx) => (
                        <li key={idx}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewMode === 'compressed' && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => { setCompressedData(null); setCompressionNotes([]); switchToFullVersion(); setShowCompressModal(false); setSelectedDeprioritize([]); setCustomDeprioritize(''); }}
                      className="text-xs text-gray-400 hover:text-violet-600 transition-colors underline underline-offset-2"
                    >
                      Try different compression settings
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          {!showComparison && (
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={() => setShowComparison(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 bg-white text-gray-700 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
              >
                <i className="ri-arrow-left-line text-gray-400"></i>
                Back to Before & After
              </button>
            </div>
          )}

          {/* ═══ Side-by-Side Comparison View ═══ */}
          {showComparison && resumeData && (
            <div className="mb-10">
              {/* Comparison Summary Banner */}
              {optimizationData.comparison?.summary && (
                <div className="max-w-6xl mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/60">
                  <p className="text-sm text-teal-800 leading-relaxed">
                    <i className="ri-sparkling-2-fill text-teal-500 mr-2"></i>
                    <span className="font-semibold">AI Summary:</span> {optimizationData.comparison.summary}
                  </p>
                </div>
              )}

              {(() => {
                const { rewrittenSet, changeMap } = buildChangeLookup(optimizationData.changes_made);
                const keywordSet = new Set((optimizationData.keywords_added || []).map(k => k.toLowerCase()));

                /* Parse original_resume_text into rough sections for a structured left panel */
                const parseOriginalText = (text: string) => {
                  const sectionRegex = /^(PROFESSIONAL SUMMARY|SUMMARY|EXPERIENCE|WORK EXPERIENCE|EDUCATION|SKILLS|TECHNICAL SKILLS|CERTIFICATIONS|PROJECTS|AWARDS|PUBLICATIONS|LANGUAGES|INTERESTS|OBJECTIVE|PROFILE)\s*$/im;
                  const lines = text.split('\n');
                  const sections: { heading: string; content: string[] }[] = [];
                  let current: { heading: string; content: string[] } = { heading: '', content: [] };

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    if (sectionRegex.test(trimmed)) {
                      if (current.heading || current.content.length) sections.push(current);
                      current = { heading: trimmed, content: [] };
                    } else {
                      current.content.push(trimmed);
                    }
                  }
                  if (current.heading || current.content.length) sections.push(current);
                  return sections;
                };

                /* Check if a bullet text was changed */
                const isChanged = (text: string) => rewrittenSet.has(text.trim());
                const getChangeInfo = (text: string) => changeMap.get(text.trim());

                /* Highlight keywords in a text string */
                const highlightText = (text: string, highlight: boolean) => {
                  if (!highlight) return <>{text}</>;
                  // Split words, highlight the ones that match added keywords
                  const words = text.split(/(\s+)/);
                  return <>{words.map((word, i) => {
                    if (!word.trim()) return word;
                    if (keywordSet.has(word.toLowerCase().replace(/[.,;:!?]/g, ''))) {
                      return <strong key={i} className="font-semibold italic">{word}</strong>;
                    }
                    return word;
                  })}</>;
                };

                return (
                  <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT: Original Resume — Structured */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Original Resume</h3>
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 text-sm leading-relaxed text-gray-700 max-h-[800px] overflow-y-auto">
                        {optimizationData.original_resume_text ? (() => {
                          const sections = parseOriginalText(optimizationData.original_resume_text);
                          return sections.length > 1 ? (
                            <div className="space-y-4">
                              {sections.map((sec, idx) => (
                                <div key={idx}>
                                  {sec.heading && (
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">{sec.heading}</h4>
                                  )}
                                  {sec.content.map((line, lIdx) => {
                                    const isBullet = /^[-•·▪]/.test(line) || /^\d+[.)]\s/.test(line);
                                    const cleanLine = line.replace(/^[-•·▪]\s*/, '').replace(/^\d+[.)]\s*/, '');
                                    return isBullet ? (
                                      <div key={lIdx} className="text-gray-600 pl-4 relative mb-1 before:content-['•'] before:absolute before:left-0 before:text-gray-400">
                                        {cleanLine}
                                      </div>
                                    ) : (
                                      <p key={lIdx} className="text-gray-600 mb-1">{line}</p>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Fallback: no clear sections found — show with cleaned whitespace */
                            <div className="space-y-2 text-gray-600">
                              {optimizationData.original_resume_text.split('\n').filter(l => l.trim()).map((line, idx) => (
                                <p key={idx} className="leading-relaxed">{line.trim()}</p>
                              ))}
                            </div>
                          );
                        })() : (
                          <div className="space-y-3 text-gray-500">
                            {(() => {
                              const originals = (optimizationData.changes_made || []).filter(c => c.original).map(c => ({ section: c.section, text: c.original! }));
                              return originals.length > 0 ? (
                                <>
                                  <p className="text-xs text-gray-400 italic mb-2">Reconstructed from change history</p>
                                  {originals.map((item, idx) => (
                                    <div key={idx} className="mb-2 pb-2 border-b border-gray-100 last:border-0">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase">{item.section}</span>
                                      <p className="text-gray-600 mt-0.5">{item.text}</p>
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <p className="text-gray-400 italic">Original resume text not available. Use "Preview & Edit" to see your optimized version.</p>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: Optimized Resume — With Inline Change Highlighting */}
                    <div>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                          <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Optimized Resume</h3>
                        </div>
                        {(rewrittenSet.size > 0 || keywordSet.size > 0) && (
                          <div className="flex items-center gap-3 text-[10px]">
                            {rewrittenSet.size > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-300"></span>
                                <span className="text-gray-500">{rewrittenSet.size} changed</span>
                              </span>
                            )}
                            {keywordSet.size > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm bg-amber-200 border border-amber-300"></span>
                                <span className="text-gray-500">{keywordSet.size} keywords</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 p-6 sm:p-8 text-sm leading-relaxed max-h-[800px] overflow-y-auto">
                        {/* Contact Info — match the left side */}
                        {(resumeData.name || resumeData.email || resumeData.phone) && (
                          <div className="mb-4 pb-3 border-b border-gray-100">
                            {resumeData.name && <h3 className="text-base font-bold text-gray-900">{resumeData.name}</h3>}
                            {resumeData.title && <p className="text-xs text-gray-500 mt-0.5">{resumeData.title}</p>}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                              {resumeData.email && <span><i className="ri-mail-line mr-1 text-gray-400"></i>{resumeData.email}</span>}
                              {resumeData.phone && <span><i className="ri-phone-line mr-1 text-gray-400"></i>{resumeData.phone}</span>}
                              {resumeData.linkedin && <span><i className="ri-linkedin-box-line mr-1 text-gray-400"></i>{resumeData.linkedin}</span>}
                              {resumeData.location && <span><i className="ri-map-pin-line mr-1 text-gray-400"></i>{resumeData.location}</span>}
                            </div>
                          </div>
                        )}
                        {/* Summary */}
                        {resumeData.summary && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Professional Summary</h4>
                            <p className="text-gray-800 leading-relaxed">{highlightText(resumeData.summary, true)}</p>
                          </div>
                        )}
                        {/* Experience */}
                        {resumeData.experience?.map((exp, idx) => (
                          <div key={idx} className="mb-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              {exp.role} {exp.company ? `at ${exp.company}` : ''} {exp.period ? `· ${exp.period}` : ''}
                            </h4>
                            <ul className="space-y-1.5">
                              {exp.bullets?.map((bullet: string, bIdx: number) => {
                                const changed = isChanged(bullet);
                                const info = changed ? getChangeInfo(bullet) : null;
                                return (
                                  <li
                                    key={bIdx}
                                    className={`pl-4 relative before:content-['•'] before:absolute before:left-0 before:font-bold group ${
                                      changed
                                        ? 'bg-emerald-50 border-l-2 border-emerald-400 pl-5 py-1 rounded-r-lg before:text-emerald-600'
                                        : 'text-gray-700 before:text-emerald-500'
                                    }`}
                                  >
                                    <span className={changed ? 'text-gray-800' : 'text-gray-700'}>
                                      {highlightText(bullet, true)}
                                    </span>
                                    {changed && (
                                      <span className="ml-1.5 inline-flex items-center text-[10px] text-emerald-600 font-medium">
                                        <i className="ri-edit-circle-line mr-0.5"></i>improved
                                      </span>
                                    )}
                                    {/* Tooltip on hover showing original + why */}
                                    {info && (
                                      <div className="hidden group-hover:block absolute left-0 right-0 top-full z-20 mt-1 p-3 bg-white rounded-xl shadow-xl border border-gray-200 text-xs">
                                        {info.original && (
                                          <div className="mb-2">
                                            <span className="font-bold text-red-400 uppercase text-[10px]">Before: </span>
                                            <span className="text-gray-500 line-through">{info.original}</span>
                                          </div>
                                        )}
                                        <div>
                                          <span className="font-bold text-teal-600 uppercase text-[10px]">Why: </span>
                                          <span className="text-gray-600">{info.why}</span>
                                        </div>
                                        {info.requirement_matched && (
                                          <div className="mt-1.5">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                                              JD Match: {info.requirement_matched}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                        {/* Capabilities — inline text per category */}
                        {resumeData.skills?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
                            <div className="space-y-1.5">
                              {(() => {
                                const categories: Record<string, string[]> = {};
                                const langKw = ['python', 'java', 'javascript', 'typescript', 'go', 'rust', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'css', 'r', 'scala', 'perl', 'bash'];
                                const fwKw = ['react', 'angular', 'vue', 'next', 'django', 'flask', 'spring', 'express', 'fastapi', 'node', '.net', 'tensorflow', 'pytorch', 'rails', 'laravel'];
                                const infraKw = ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'linux', 'nginx', 'redis', 'kafka', 'postgresql', 'mongodb', 'mysql', 'git'];
                                const softKw = ['leadership', 'communication', 'agile', 'scrum', 'management', 'collaboration', 'problem-solving', 'analytical', 'strategic', 'mentoring'];

                                for (const skill of resumeData.skills) {
                                  const lower = skill.toLowerCase();
                                  if (langKw.some(k => lower.includes(k))) {
                                    (categories['Languages'] ??= []).push(skill);
                                  } else if (fwKw.some(k => lower.includes(k))) {
                                    (categories['Frameworks'] ??= []).push(skill);
                                  } else if (infraKw.some(k => lower.includes(k))) {
                                    (categories['Tools & Infrastructure'] ??= []).push(skill);
                                  } else if (softKw.some(k => lower.includes(k))) {
                                    (categories['Professional Skills'] ??= []).push(skill);
                                  } else {
                                    (categories['Domain Expertise'] ??= []).push(skill);
                                  }
                                }

                                return Object.entries(categories).map(([cat, skills]) => (
                                  <p key={cat} className="text-sm text-gray-700 leading-relaxed">
                                    <span className="font-semibold text-gray-600">{cat}:</span>{' '}
                                    {skills.map((skill, idx) => {
                                      const isNew = keywordSet.has(skill.toLowerCase());
                                      return (
                                        <span key={idx}>
                                          {idx > 0 && ', '}
                                          {isNew
                                            ? <span className="font-semibold text-emerald-700">{skill}</span>
                                            : skill
                                          }
                                        </span>
                                      );
                                    })}
                                  </p>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                        {/* Education */}
                        {resumeData.education?.map((edu, idx) => (
                          <div key={idx} className="mb-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Education</h4>
                            <p className="text-gray-700">{edu.degree} — {edu.school} {edu.period ? `(${edu.period})` : ''}</p>
                          </div>
                        ))}

                        {/* Certifications */}
                        {resumeData.certifications && resumeData.certifications.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Certifications</h4>
                            <ul className="space-y-1">
                              {resumeData.certifications.map((cert, idx) => (
                                <li key={idx} className="text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-500 text-sm">
                                  {cert}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Achievements */}
                        {resumeData.achievements && resumeData.achievements.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Achievements</h4>
                            <ul className="space-y-1">
                              {resumeData.achievements.map((ach, idx) => (
                                <li key={idx} className="text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-500 text-sm">
                                  {ach}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Keywords woven into content — subtle inline note */}
                        {optimizationData.keywords_added?.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-400 leading-relaxed">
                              <i className="ri-sparkling-line text-emerald-400 mr-1"></i>
                              <span className="font-medium text-gray-500">{optimizationData.keywords_added.length} keywords integrated</span>
                              {' — '}
                              {optimizationData.keywords_added.map((kw, idx) => (
                                <span key={idx}>
                                  {idx > 0 && ', '}
                                  <span className="text-emerald-600 font-medium">{kw}</span>
                                </span>
                              ))}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* CTA moved to header */}

              {/* ═══ Skills Diff Section ═══ */}
              {resumeData?.skills?.length > 0 && (() => {
                // Extract original skills from raw text
                const originalSkills: string[] = [];
                if (optimizationData.original_resume_text) {
                  const text = optimizationData.original_resume_text;
                  // Find skills section in original text
                  const skillsMatch = text.match(/(?:SKILLS|TECHNICAL SKILLS|CORE SKILLS|KEY SKILLS)\s*\n([\s\S]*?)(?:\n(?:EDUCATION|EXPERIENCE|WORK EXPERIENCE|CERTIFICATIONS|PROJECTS|ACHIEVEMENTS|AWARDS)\s*\n|$)/i);
                  if (skillsMatch) {
                    const skillsBlock = skillsMatch[1];
                    // Parse comma-separated, pipe-separated, or line-by-line skills
                    skillsBlock.split(/[,|\n•·▪]/).forEach(s => {
                      const cleaned = s.replace(/^[-–—]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim();
                      if (cleaned && cleaned.length < 50 && cleaned.length > 1) {
                        originalSkills.push(cleaned);
                      }
                    });
                  }
                }

                const newSkills = resumeData.skills as string[];
                const originalSet = new Set(originalSkills.map(s => s.toLowerCase()));
                const newSet = new Set(newSkills.map(s => s.toLowerCase()));
                
                const added = newSkills.filter(s => !originalSet.has(s.toLowerCase()));
                const kept = newSkills.filter(s => originalSet.has(s.toLowerCase()));
                const removed = originalSkills.filter(s => !newSet.has(s.toLowerCase()));

                if (added.length === 0 && removed.length === 0) return null;

                return (
                  <div className="max-w-6xl mx-auto mt-6 p-5 rounded-2xl bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200/60">
                    <div className="flex items-center gap-2 mb-4">
                      <i className="ri-tools-line text-violet-500 text-lg" />
                      <h3 className="text-sm font-bold text-gray-800">Skills Diff</h3>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {originalSkills.length > 0 ? `${originalSkills.length} original` : 'Original skills extracted from resume'} → {newSkills.length} optimized
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Added Skills */}
                      {added.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <i className="ri-add-circle-line text-emerald-500 text-xs" />
                            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Added ({added.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {added.map((skill, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                                + {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Kept Skills */}
                      {kept.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <i className="ri-check-line text-gray-400 text-xs" />
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Kept ({kept.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {kept.map((skill, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] border border-gray-200">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Removed Skills */}
                      {removed.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <i className="ri-close-circle-line text-red-400 text-xs" />
                            <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">Removed ({removed.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {removed.map((skill, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-full bg-red-50 text-red-400 text-[11px] border border-red-200 line-through">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ═══ Editor View (existing) ═══ */}
          {!showComparison && resumeData && (
            <div className="animate-in fade-in duration-300">
              <InlineResumeEditor data={resumeData} onDataChange={setResumeData} initialTemplateId={recommendedTemplate} variantId={variantId} variantRationale={variantRationale} onPageCountChange={handlePageCountChange} activeDynamicConfig={activeDynamicConfig} dynamicConfigs={dynamicConfigs} dynamicLoading={dynamicLoading} onDynamicTemplateSelect={handleDynamicTemplateSelect} changesMade={optimizationData?.changes_made} keywordsAdded={optimizationData?.keywords_added} />
            </div>
          )}

          {!showComparison && !resumeData && (
            <div className="text-center py-20">
              <i className="ri-file-warning-line text-5xl text-gray-300 mb-4 block"></i>
              <p className="text-gray-500">Unable to load resume data. Please try optimizing again.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
