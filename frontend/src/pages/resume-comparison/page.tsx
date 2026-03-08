import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';

interface OptimizationData {
  resumeId: number;
  job_title: string;
  optimized_resume: string;
  changes_made: Array<{
    section: string;
    what_changed: string;
    why: string;
  }>;
  key_improvements: string[];
  keywords_added: string[];
  match_score: number;
  ats_optimized: boolean;
  comparison: {
    summary: string;
    detailed_changes: Array<{
      before: string;
      after: string;
      reason: string;
      impact: string;
    }>;
  };
}

type TemplateId = 'classic' | 'modern' | 'minimal' | 'executive' | 'creative' | 'compact';

export default function ResumeComparisonPage() {
  const navigate = useNavigate();
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('modern');
  const [activeTab, setActiveTab] = useState<'changes' | 'preview'>('changes');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Get optimization data from session storage
    const data = sessionStorage.getItem('optimizationData');
    if (data) {
      setOptimizationData(JSON.parse(data));
    } else {
      // Redirect to home if no optimization data
      navigate('/');
    }
  }, [navigate]);

  const handleDownloadResume = async () => {
    if (!optimizationData) return;
    
    setIsDownloading(true);
    try {
      // Create a blob from the resume text
      const element = document.createElement('a');
      const file = new Blob([optimizationData.optimized_resume], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `optimized-resume-${optimizationData.job_title.replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download resume');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!optimizationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-500 animate-spin">
              <div className="w-8 h-8 rounded-full border-4 border-transparent border-t-white"></div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen mesh-bg">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-medium mb-6">
              <i className="ri-check-double-line text-teal-500"></i>
              Resume Optimized Successfully
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Your Resume is Ready
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              We've analyzed your resume and optimized it for <span className="font-semibold text-teal-600">{optimizationData.job_title}</span>
            </p>

            {/* Match Score */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="glass-card rounded-2xl p-6">
                <div className="text-4xl font-bold text-teal-600 mb-2">
                  {optimizationData.match_score}%
                </div>
                <p className="text-sm text-gray-600">Job Match Score</p>
              </div>
              
              <div className="glass-card rounded-2xl p-6">
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  {optimizationData.keywords_added?.length || 0}
                </div>
                <p className="text-sm text-gray-600">Keywords Added</p>
              </div>

              {optimizationData.ats_optimized && (
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-shield-check-fill text-2xl text-emerald-500"></i>
                    <span className="text-lg font-bold text-emerald-600">ATS Ready</span>
                  </div>
                  <p className="text-sm text-gray-600">Applicant Tracking System</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('changes')}
              className={`px-6 py-3 font-semibold text-sm transition-all ${
                activeTab === 'changes'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-git-commit-line mr-2"></i>
              What Changed & Why
            </button>
            
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 font-semibold text-sm transition-all ${
                activeTab === 'preview'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-eye-line mr-2"></i>
              Preview
            </button>
          </div>

          {/* Content */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Changes */}
            {activeTab === 'changes' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Changes Made</h2>
                
                {optimizationData.changes_made && optimizationData.changes_made.length > 0 ? (
                  <div className="space-y-4">
                    {optimizationData.changes_made.map((change, idx) => (
                      <div key={idx} className="glass-card rounded-xl p-6 border border-white/20 hover:border-teal-300/50 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-teal-100">
                              <span className="text-sm font-bold text-teal-600">{idx + 1}</span>
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900 mb-2 capitalize">
                              {change.section}
                            </h3>
                            
                            <p className="text-sm text-gray-700 mb-3">
                              <strong className="text-gray-900">What changed:</strong> {change.what_changed}
                            </p>
                            
                            <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                              <i className="ri-lightbulb-line mr-2"></i>
                              <strong>Why:</strong> {change.why}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No specific changes tracked</p>
                  </div>
                )}

                {/* Key Improvements */}
                {optimizationData.key_improvements && optimizationData.key_improvements.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Key Improvements</h3>
                    <div className="space-y-2">
                      {optimizationData.key_improvements.map((improvement, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <i className="ri-check-line text-emerald-600 mt-0.5 flex-shrink-0"></i>
                          <span className="text-sm text-emerald-900">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords Added */}
                {optimizationData.keywords_added && optimizationData.keywords_added.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Keywords Added for Better Matching</h3>
                    <div className="flex flex-wrap gap-2">
                      {optimizationData.keywords_added.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-full bg-teal-100 text-teal-700 text-sm font-medium"
                        >
                          <i className="ri-hashtag mr-1"></i>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Right: Preview or Template Selection */}
            {activeTab === 'changes' ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Template</h2>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'classic', name: 'Classic', icon: 'ri-file-text-line' },
                    { id: 'modern', name: 'Modern', icon: 'ri-artboard-line' },
                    { id: 'minimal', name: 'Minimal', icon: 'ri-layout-line' },
                    { id: 'executive', name: 'Executive', icon: 'ri-briefcase-line' },
                    { id: 'creative', name: 'Creative', icon: 'ri-palette-line' },
                    { id: 'compact', name: 'Compact', icon: 'ri-compress-line' },
                  ].map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id as TemplateId)}
                      className={`p-4 rounded-xl border-2 transition-all text-center group ${
                        selectedTemplate === template.id
                          ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/20'
                          : 'border-gray-200 hover:border-teal-300 bg-white'
                      }`}
                    >
                      <div className={`text-3xl mb-2 transition-colors ${
                        selectedTemplate === template.id ? 'text-teal-600' : 'text-gray-400 group-hover:text-teal-500'
                      }`}>
                        <i className={template.icon}></i>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-8 p-6 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <i className="ri-information-line mr-2 font-bold"></i>
                    <strong>Template Note:</strong> The optimized resume will maintain ATS-friendly formatting across all templates.
                  </p>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownloadResume}
                  disabled={isDownloading}
                  className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <i className={`${isDownloading ? 'ri-loader-4-line animate-spin' : 'ri-download-2-line'} text-lg`}></i>
                  {isDownloading ? 'Downloading...' : 'Download Resume'}
                </button>

                <button
                  onClick={() => navigate('/resume-builder')}
                  className="w-full py-3.5 rounded-xl bg-white border-2 border-gray-200 text-gray-900 font-bold hover:border-teal-300 hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
                >
                  <i className="ri-edit-line text-lg"></i>
                  Edit in Resume Builder
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Optimized Resume Preview</h2>
                <div className="glass-card rounded-2xl p-8 bg-white h-full max-h-[600px] overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                    {optimizationData.optimized_resume}
                  </div>
                </div>
                
                <button
                  onClick={handleDownloadResume}
                  disabled={isDownloading}
                  className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <i className={`${isDownloading ? 'ri-loader-4-line animate-spin' : 'ri-download-2-line'} text-lg`}></i>
                  {isDownloading ? 'Downloading...' : 'Download Resume'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
