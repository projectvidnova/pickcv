import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import InlineResumeEditor from '../optimized-resume/components/InlineResumeEditor';
import { ResumeData } from '../optimized-resume/types';
import { getVariantTemplates } from '../optimized-resume/components/themes';
import { authFetch } from '../../services/authFetch';

interface DeprioritizeOption {
  id: string;
  label: string;
  description: string;
}

interface OptimizationData {
  resumeId: number;
  job_title: string;
  optimized_resume: string;
  changes_made: Array<{ section: string; what_changed: string; why: string }>;
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
}

export default function ResumeComparisonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'changes'>('editor');

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

  // Full (original) data preserved for switching between views
  const [fullResumeData, setFullResumeData] = useState<ResumeData | null>(null);

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
      name: apiData.name || 'Your Name',
      title: apiData.title || 'Professional',
      email: apiData.email || 'your.email@example.com',
      phone: apiData.phone || '(555) 123-4567',
      linkedin: apiData.linkedin || 'linkedin.com/in/yourname',
      location: apiData.location || 'City, State',
      summary: apiData.professional_summary || apiData.summary || 'Professional summary',
      experience: Array.isArray(apiData.experience)
        ? apiData.experience.map((exp: any) => ({
            role: exp.role || exp.title || 'Position',
            company: exp.company || 'Company',
            location: exp.location || 'Location',
            period: exp.period || exp.dates || '2020 - Present',
            bullets: Array.isArray(exp.bullets)
              ? exp.bullets
              : Array.isArray(exp.achievements)
              ? exp.achievements
              : Array.isArray(exp.responsibilities)
              ? exp.responsibilities
              : ['Responsibility description'],
          }))
        : [],
      skills: Array.isArray(apiData.skills)
        ? apiData.skills
        : Array.isArray(apiData.skills?.technical)
        ? apiData.skills.technical
        : typeof apiData.skills === 'string'
        ? apiData.skills.split(',').map((s: string) => s.trim())
        : ['Skill 1', 'Skill 2', 'Skill 3'],
      education: Array.isArray(apiData.education)
        ? apiData.education.map((edu: any) => ({
            degree: edu.degree || 'Degree',
            school: edu.school || edu.institution || 'University',
            period: edu.period || edu.year || '2020',
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

  const currentPageEstimate = selectedVariant?.page_estimate || 
    (resumeData ? Math.ceil((resumeData.experience?.length || 1) * 1.2) : 1);

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
            {currentPageEstimate > 1 && (
              <div className="mt-5 max-w-3xl mx-auto bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                      <i className="ri-pages-line text-violet-600 text-lg"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Your resume is {currentPageEstimate} pages
                      </p>
                      <p className="text-xs text-gray-500">
                        Optimize it to fewer pages while keeping the most impactful content
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentPageEstimate > 2 && (
                      <button
                        onClick={() => { setTargetPages(2); setShowCompressModal(true); }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-white text-violet-700 border border-violet-200 hover:bg-violet-50 transition-all shadow-sm"
                      >
                        <i className="ri-compress-line mr-1.5"></i>Optimize to 2 pages
                      </button>
                    )}
                    <button
                      onClick={() => { setTargetPages(1); setShowCompressModal(true); }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-sm"
                    >
                      <i className="ri-compress-line mr-1.5"></i>Optimize to 1 page
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Version Switcher (after compression) ── */}
            {compressedData && (
              <div className="mt-4 max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-2 p-1 bg-gray-100 rounded-xl">
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
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-semibold text-amber-800 mb-1.5">
                      <i className="ri-information-line mr-1"></i>Compression applied:
                    </p>
                    <ul className="text-xs text-amber-700 space-y-0.5">
                      {compressionNotes.map((note, idx) => (
                        <li key={idx}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 justify-center">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'editor'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <i className="ri-edit-2-line mr-1.5"></i>Edit Resume
            </button>
            <button
              onClick={() => setActiveTab('changes')}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'changes'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <i className="ri-git-commit-line mr-1.5"></i>What Changed
            </button>
          </div>

          {/* Editor Tab */}
          {activeTab === 'editor' && resumeData && (
            <InlineResumeEditor data={resumeData} onDataChange={setResumeData} initialTemplateId={recommendedTemplate} variantId={variantId} variantRationale={variantRationale} />
          )}

          {activeTab === 'editor' && !resumeData && (
            <div className="text-center py-20">
              <i className="ri-file-warning-line text-5xl text-gray-300 mb-4 block"></i>
              <p className="text-gray-500">Unable to load resume data. Please try optimizing again.</p>
            </div>
          )}

          {/* Changes Tab */}
          {activeTab === 'changes' && (
            <div className="max-w-3xl mx-auto space-y-8">
              {optimizationData.changes_made && optimizationData.changes_made.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-git-commit-line text-teal-600"></i>
                    Changes Made
                  </h2>
                  <div className="space-y-3">
                    {optimizationData.changes_made.map((change, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-teal-200 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-teal-600">{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900 capitalize mb-1">
                              {change.section}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">{change.what_changed}</p>
                            <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                              <i className="ri-lightbulb-line"></i>
                              {change.why}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {optimizationData.key_improvements && optimizationData.key_improvements.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-rocket-line text-emerald-600"></i>
                    Key Improvements
                  </h2>
                  <div className="grid gap-2">
                    {optimizationData.key_improvements.map((imp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100"
                      >
                        <i className="ri-check-double-line text-emerald-600 mt-0.5 flex-shrink-0"></i>
                        <span className="text-sm text-emerald-900">{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {optimizationData.keywords_added && optimizationData.keywords_added.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-hashtag text-blue-600"></i>
                    Keywords Added
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {optimizationData.keywords_added.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center pt-4">
                <button
                  onClick={() => setActiveTab('editor')}
                  className="px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all shadow-lg"
                >
                  <i className="ri-edit-2-line mr-2"></i>
                  Edit Your Resume
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* ── Compression Modal ── */}
      {showCompressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <i className="ri-compress-line text-violet-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Optimize to {targetPages} {targetPages === 1 ? 'Page' : 'Pages'}</h3>
                    <p className="text-xs text-gray-500">Choose what to deprioritize for a more concise resume</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompressModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <i className="ri-close-line text-gray-500"></i>
                </button>
              </div>
            </div>

            {/* Deprioritization Options */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">What can be trimmed?</p>
                <div className="space-y-2">
                  {(optimizationData?.resume_os?.deprioritize_options || [
                    { id: 'older_experience', label: 'Older work experience (3+ years ago)', description: 'Remove or trim roles older than 3 years' },
                    { id: 'education_details', label: 'Education details', description: 'Keep only degree + school, drop coursework/GPA' },
                    { id: 'reduce_skills', label: 'Trim skills list', description: 'Keep only the top 8-10 most relevant skills' },
                    { id: 'shorten_summary', label: 'Shorten professional summary', description: 'Compress summary to 2-3 lines' },
                    { id: 'reduce_bullets', label: 'Fewer bullets per role', description: 'Keep only the top 2-3 highest-impact bullets per role' },
                    { id: 'trim_certifications', label: 'Remove certifications / projects', description: 'Drop certifications and projects sections' },
                  ]).map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedDeprioritize.includes(option.id)
                          ? 'border-violet-300 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDeprioritize.includes(option.id)}
                        onChange={() => toggleDeprioritize(option.id)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{option.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Free text */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Anything specific to deprioritize?
                </label>
                <textarea
                  value={customDeprioritize}
                  onChange={(e) => setCustomDeprioritize(e.target.value)}
                  placeholder='e.g. "Remove my internship from 2018" or "Less focus on education"'
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCompressModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCompress}
                disabled={isCompressing}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompressing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Compressing...
                  </span>
                ) : (
                  <>
                    <i className="ri-compress-line mr-1.5"></i>
                    Compress to {targetPages} {targetPages === 1 ? 'Page' : 'Pages'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
