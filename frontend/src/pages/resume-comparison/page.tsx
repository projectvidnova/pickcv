import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import InlineResumeEditor from '../optimized-resume/components/InlineResumeEditor';
import { ResumeData } from '../optimized-resume/types';

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
}

export default function ResumeComparisonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'changes'>('editor');

  useEffect(() => {
    const stateData = location.state?.optimizedResume;
    const sessionData = sessionStorage.getItem('optimizationData');

    if (stateData) {
      setOptimizationData(stateData);
      transformToResumeData(stateData);
    } else if (sessionData) {
      const parsed = JSON.parse(sessionData);
      setOptimizationData(parsed);
      transformToResumeData(parsed);
    } else {
      navigate('/');
    }
  }, [navigate, location.state]);

  const transformToResumeData = (apiData: any) => {
    if (!apiData) return;
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
  };

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
            <div className="flex items-center justify-center gap-6 mt-6">
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
              {optimizationData.ats_optimized && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 shadow-sm border border-emerald-100">
                  <i className="ri-shield-check-fill text-lg text-emerald-500"></i>
                  <span className="text-xs font-semibold text-emerald-700">ATS Ready</span>
                </div>
              )}
            </div>
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
            <InlineResumeEditor data={resumeData} onDataChange={setResumeData} />
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
    </main>
  );
}
