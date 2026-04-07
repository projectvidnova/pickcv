import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import InlineResumeEditor from '../optimized-resume/components/InlineResumeEditor';
import { ResumeData, DynamicTemplateConfig, PersonaAngle } from '../optimized-resume/types';
import { getVariantTemplates } from '../optimized-resume/components/themes';
import { authFetch } from '../../services/authFetch';

/** Word-level diff: returns JSX with changed words highlighted */
function renderWordDiff(original: string, rewritten: string): { origNodes: ReactNode; newNodes: ReactNode } {
  const origWords = original.split(/(\s+)/);
  const newWords = rewritten.split(/(\s+)/);
  const origSet = new Set(origWords.filter(w => w.trim()));
  const newSet = new Set(newWords.filter(w => w.trim()));

  const origNodes = origWords.map((word, i) => {
    if (!word.trim()) return word;
    return newSet.has(word)
      ? <span key={i}>{word}</span>
      : <span key={i} className="bg-red-100 text-red-700 px-0.5 rounded">{word}</span>;
  });

  const newNodes = newWords.map((word, i) => {
    if (!word.trim()) return word;
    return origSet.has(word)
      ? <span key={i}>{word}</span>
      : <span key={i} className="bg-emerald-100 text-emerald-700 px-0.5 rounded">{word}</span>;
  });

  return { origNodes, newNodes };
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
    };
    setResumeData(transformed);
    return transformed;
  };

  /* ─── Compression API call ─── */
  const handleCompress = async () => {
    if (!selectedVariant?.resume_data || !optimizationData) return;
    setIsCompressing(true);

    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/resume/compress-variant`, {
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
                    Agentic Resume OS
                  </span>
                  <span className="text-xs text-gray-500">Recommended Variant</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {optimizationData.resume_os.recommended_variant.id} · {optimizationData.resume_os.recommended_variant.name}
                  </span>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Score {optimizationData.resume_os.recommended_variant.score}%
                  </span>
                </div>

                {optimizationData.resume_os?.role_dna && (
                  <p className="text-xs text-gray-600 mb-1.5">
                    Role DNA: {optimizationData.resume_os.role_dna.function || 'Unknown'} · {optimizationData.resume_os.role_dna.level || 'L3'} · {optimizationData.resume_os.role_dna.environment || 'Unknown'} · {optimizationData.resume_os.role_dna.cluster_name || 'General'}
                  </p>
                )}

                <p className="text-xs text-gray-600 leading-relaxed">
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
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setShowComparison(true)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  showComparison
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="ri-layout-column-line mr-1.5"></i>
                Before & After
              </button>
              <button
                onClick={() => setShowComparison(false)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !showComparison
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="ri-edit-2-line mr-1.5"></i>
                Editor
              </button>
            </div>
          </div>

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

              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: Original Resume */}
                <div>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Original Resume</h3>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 text-sm leading-relaxed text-gray-700 max-h-[800px] overflow-y-auto">
                    {optimizationData.original_resume_text ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 leading-relaxed">
                        {optimizationData.original_resume_text}
                      </pre>
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 leading-relaxed">
                        {(() => {
                          const changeOriginals = (optimizationData.changes_made || [])
                            .map(c => c.original)
                            .filter(Boolean);
                          const compOriginals = (optimizationData.comparison?.detailed_changes || [])
                            .map(c => c.before)
                            .filter(Boolean);
                          const allOriginals = [...changeOriginals, ...compOriginals].filter((v, i, a) => a.indexOf(v) === i);
                          return allOriginals.length > 0
                            ? allOriginals.map((text, idx) => (
                                <div key={idx} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
                                  {text}
                                </div>
                              ))
                            : <span className="text-gray-400 italic">Original resume text not available for comparison. Use the Editor view to see your optimized resume.</span>;
                        })()}
                      </pre>
                    )}
                  </div>
                </div>

                {/* RIGHT: Optimized Resume */}
                <div>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Optimized Resume</h3>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 p-6 sm:p-8 text-sm leading-relaxed max-h-[800px] overflow-y-auto">
                    {/* Summary */}
                    {resumeData.summary && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Professional Summary</h4>
                        <p className="text-gray-800 leading-relaxed">{resumeData.summary}</p>
                      </div>
                    )}
                    {/* Experience */}
                    {resumeData.experience?.map((exp, idx) => (
                      <div key={idx} className="mb-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          {exp.role} {exp.company ? `at ${exp.company}` : ''} {exp.period ? `· ${exp.period}` : ''}
                        </h4>
                        <ul className="space-y-1.5">
                          {exp.bullets?.map((bullet: string, bIdx: number) => (
                            <li key={bIdx} className="text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-500 before:font-bold">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {/* Skills */}
                    {resumeData.skills?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {resumeData.skills.map((skill: string, idx: number) => (
                            <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {skill}
                            </span>
                          ))}
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
                  </div>
                </div>
              </div>

              {/* Detailed Changes List */}
              {(optimizationData.changes_made?.length > 0 || optimizationData.comparison?.detailed_changes?.length > 0) && (
                <div className="max-w-6xl mx-auto mt-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <i className="ri-git-commit-line text-teal-500"></i>
                    What Changed & Why
                  </h3>
                  <div className="space-y-3">
                    {/* Show changes_made from step 3 (has requirement_matched) */}
                    {(optimizationData.changes_made || []).slice(0, 8).map((change, idx) => (
                      <div key={`cm-${idx}`} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-teal-700">{idx + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-bold text-gray-500 uppercase">{change.section}</span>
                              {change.requirement_matched && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                                  JD: {change.requirement_matched}
                                </span>
                              )}
                            </div>
                            {change.original && change.rewritten ? (() => {
                              const { origNodes, newNodes } = renderWordDiff(change.original, change.rewritten);
                              return (
                                <div className="space-y-2 mb-1">
                                  <div className="text-xs leading-relaxed p-2 rounded-lg bg-red-50/60 border border-red-100/60">
                                    <span className="text-[10px] font-bold text-red-400 uppercase mr-1.5">Before:</span>
                                    <span className="text-gray-500">{origNodes}</span>
                                  </div>
                                  <div className="text-sm leading-relaxed p-2 rounded-lg bg-emerald-50/60 border border-emerald-100/60">
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase mr-1.5">After:</span>
                                    <span className="text-gray-800">{newNodes}</span>
                                  </div>
                                </div>
                              );
                            })() : (
                              <>
                                {change.original && (
                                  <div className="text-xs text-gray-400 line-through mb-1">{change.original}</div>
                                )}
                                {change.rewritten && (
                                  <div className="text-sm text-gray-800 mb-1">{change.rewritten}</div>
                                )}
                                {!change.rewritten && change.what_changed && (
                                  <div className="text-sm text-gray-800 mb-1">{change.what_changed}</div>
                                )}
                              </>
                            )}
                            <p className="text-xs text-gray-500">{change.why}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Fallback: show comparison.detailed_changes */}
                    {(!optimizationData.changes_made?.length) && (optimizationData.comparison?.detailed_changes || []).slice(0, 7).map((change, idx) => {
                      const { origNodes, newNodes } = renderWordDiff(change.before, change.after);
                      return (
                        <div key={`dc-${idx}`} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-2 rounded-lg bg-red-50/60 border border-red-100/60">
                              <span className="text-[10px] font-bold text-red-400 uppercase mb-1 block">Before</span>
                              <p className="text-sm text-gray-500">{origNodes}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100/60">
                              <span className="text-[10px] font-bold text-emerald-500 uppercase mb-1 block">After</span>
                              <p className="text-sm text-gray-800">{newNodes}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-start gap-2">
                            <i className="ri-lightbulb-line text-amber-500 text-sm mt-0.5"></i>
                            <p className="text-xs text-gray-500">{change.reason} — {change.impact}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Keywords Added */}
              {optimizationData.keywords_added?.length > 0 && (
                <div className="max-w-6xl mx-auto mt-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <i className="ri-key-2-line text-amber-500"></i>
                    Keywords Added
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {optimizationData.keywords_added.map((kw, idx) => (
                      <span key={idx} className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ Editor View (existing) ═══ */}
          {!showComparison && resumeData && (
            <InlineResumeEditor data={resumeData} onDataChange={setResumeData} initialTemplateId={recommendedTemplate} variantId={variantId} variantRationale={variantRationale} onPageCountChange={handlePageCountChange} activeDynamicConfig={activeDynamicConfig} dynamicConfigs={dynamicConfigs} dynamicLoading={dynamicLoading} onDynamicTemplateSelect={handleDynamicTemplateSelect} changesMade={optimizationData?.changes_made} keywordsAdded={optimizationData?.keywords_added} />
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
