
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface ResumeCustomizeModalProps {
  jobTitle: string;
  company: string;
  jobDescription: string;
  onClose: () => void;
}

type Stage = 'source' | 'processing' | 'result';
type ResumeSource = 'existing' | 'upload' | 'scratch';

interface SavedResume {
  id: string;
  name: string;
  uploadedAt: string;
  size: string;
  isDefault?: boolean;
}

const processingSteps = [
  { icon: 'ri-file-search-line', label: 'Analyzing job requirements', detail: 'Extracting key skills & keywords' },
  { icon: 'ri-brain-line', label: 'Matching your experience', detail: 'Aligning your background to the role' },
  { icon: 'ri-edit-2-line', label: 'Rewriting bullet points', detail: 'Adding impact metrics & action verbs' },
  { icon: 'ri-shield-check-line', label: 'ATS optimization', detail: 'Ensuring clean, parseable formatting' },
];

// Mock saved resumes — replace with real data when backend is connected
const MOCK_SAVED_RESUMES: SavedResume[] = [
  { id: 'r1', name: 'Sarah_Mitchell_Resume.pdf', uploadedAt: '2 days ago', size: '142 KB', isDefault: true },
  { id: 'r2', name: 'Resume_SeniorDev_2024.pdf', uploadedAt: '1 week ago', size: '198 KB' },
  { id: 'r3', name: 'Resume_FullStack_Tailored.docx', uploadedAt: '3 weeks ago', size: '87 KB' },
];

export default function ResumeCustomizeModal({
  jobTitle,
  company,
  onClose,
}: ResumeCustomizeModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('source');
  const [source, setSource] = useState<ResumeSource | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(MOCK_SAVED_RESUMES[0]?.id ?? '');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern');

  const hasExistingResumes = MOCK_SAVED_RESUMES.length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) setUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) setUploadedFile(file);
  };

  const canProceed = () => {
    if (!source) return false;
    if (source === 'existing' && !selectedResumeId) return false;
    if (source === 'upload' && !uploadedFile) return false;
    return true;
  };

  const startProcessing = () => {
    setStage('processing');
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProcessingStep(step);
      if (step >= processingSteps.length) {
        clearInterval(interval);
        setTimeout(() => setStage('result'), 700);
      }
    }, 1100);
  };

  const handleProceed = () => {
    if (source === 'scratch') {
      onClose();
      navigate('/resume-builder');
      return;
    }
    startProcessing();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '#';
    link.download = `Optimized_Resume_${company.replace(/\s+/g, '_')}.pdf`;
    link.click();
  };

  const handleViewFull = () => {
    onClose();
    navigate('/optimized-resume');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmerProgress {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .modal-enter { animation: fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .shimmer-bar {
          background: linear-gradient(90deg, #0d9488 0%, #5eead4 45%, #10b981 100%);
          background-size: 200% auto;
          animation: shimmerProgress 1.6s linear infinite;
        }
        .float-badge { animation: floatBadge 2.5s ease-in-out infinite; }
        .resume-list::-webkit-scrollbar { width: 4px; }
        .resume-list::-webkit-scrollbar-track { background: transparent; }
        .resume-list::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 99px; }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/70 backdrop-blur-sm"
        onClick={stage !== 'processing' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg modal-enter">
        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-teal-400/15 via-emerald-400/10 to-transparent blur-2xl pointer-events-none" />

        <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/20">

          {/* ── Header ── */}
          <div
            className="relative px-6 pt-5 pb-5 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0c1628 0%, #0f3d38 55%, #063328 100%)' }}
          >
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 70%)' }} />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #10b981)', boxShadow: '0 4px 14px rgba(13,148,136,0.5)' }}
                >
                  <i className="ri-file-edit-line text-white text-lg"></i>
                </div>
                <div>
                  <p className="text-xs font-black text-teal-300 uppercase tracking-widest leading-none">Customize Resume</p>
                  <p className="text-white font-bold text-sm mt-0.5 leading-snug">
                    {jobTitle}
                    <span className="text-white/50 font-normal"> · {company}</span>
                  </p>
                </div>
              </div>
              {stage !== 'processing' && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer shrink-0 mt-0.5"
                >
                  <i className="ri-close-line text-base"></i>
                </button>
              )}
            </div>

            {/* Stage indicator */}
            <div className="relative flex items-center gap-2 mt-4">
              {(['source', 'processing', 'result'] as Stage[]).map((s, i) => {
                const stageIndex = ['source', 'processing', 'result'].indexOf(stage);
                const isDone = i < stageIndex;
                const isActive = s === stage;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      isActive ? 'bg-teal-500/30 text-teal-200 border border-teal-500/40' :
                      isDone ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/25'
                    }`}>
                      {isDone
                        ? <i className="ri-check-line text-xs"></i>
                        : <span className="w-3.5 h-3.5 flex items-center justify-center rounded-full border border-current text-[9px]">{i + 1}</span>
                      }
                      <span className="capitalize">{s === 'source' ? 'Choose Resume' : s === 'processing' ? 'Optimizing' : 'Download'}</span>
                    </div>
                    {i < 2 && <div className={`w-4 h-px ${isDone ? 'bg-emerald-500/50' : 'bg-white/15'}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-6 py-5">

            {/* STAGE: SOURCE SELECTION */}
            {stage === 'source' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">Which resume should we tailor?</h2>
                  <p className="text-sm text-gray-500 mt-0.5">We'll customize it specifically for this role at {company}</p>
                </div>

                <div className="space-y-3">

                  {/* ── Option 1: Use existing resumes ── */}
                  {hasExistingResumes && (
                    <div
                      className={`rounded-xl border-2 transition-all ${
                        source === 'existing'
                          ? 'border-teal-500 bg-teal-50/60 shadow-md shadow-teal-500/10'
                          : 'border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      {/* Header row — click to select this option */}
                      <button
                        onClick={() => setSource('existing')}
                        className="w-full text-left p-4 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-colors ${
                            source === 'existing' ? 'bg-teal-100' : 'bg-gray-100 group-hover:bg-teal-50'
                          }`}>
                            <i className={`ri-folder-open-line text-xl ${source === 'existing' ? 'text-teal-600' : 'text-gray-500'}`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-bold ${source === 'existing' ? 'text-teal-800' : 'text-gray-800'}`}>
                                Use a saved resume
                              </p>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                                {MOCK_SAVED_RESUMES.length} saved
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Pick from your previously uploaded resumes</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            source === 'existing' ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                          }`}>
                            {source === 'existing' && <i className="ri-check-line text-white text-xs"></i>}
                          </div>
                        </div>
                      </button>

                      {/* Resume list — shown when this option is selected */}
                      {source === 'existing' && (
                        <div className="px-4 pb-4">
                          <div className="resume-list space-y-2 max-h-44 overflow-y-auto pr-1">
                            {MOCK_SAVED_RESUMES.map((resume) => (
                              <button
                                key={resume.id}
                                onClick={() => setSelectedResumeId(resume.id)}
                                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                                  selectedResumeId === resume.id
                                    ? 'border-teal-400 bg-white shadow-sm shadow-teal-500/10'
                                    : 'border-gray-100 bg-white/70 hover:border-teal-200 hover:bg-white'
                                }`}
                              >
                                {/* File icon */}
                                <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${
                                  selectedResumeId === resume.id ? 'bg-teal-100' : 'bg-gray-100'
                                }`}>
                                  <i className={`${resume.name.endsWith('.docx') ? 'ri-file-word-line' : 'ri-file-pdf-line'} text-sm ${
                                    selectedResumeId === resume.id ? 'text-teal-600' : 'text-gray-500'
                                  }`}></i>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <p className={`text-xs font-semibold truncate ${
                                      selectedResumeId === resume.id ? 'text-teal-800' : 'text-gray-700'
                                    }`}>{resume.name}</p>
                                    {resume.isDefault && (
                                      <span className="shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full">Default</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-0.5">{resume.size} · {resume.uploadedAt}</p>
                                </div>

                                {/* Radio dot */}
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                  selectedResumeId === resume.id ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                                }`}>
                                  {selectedResumeId === resume.id && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Option 2: Upload new ── */}
                  <button
                    onClick={() => setSource('upload')}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                      source === 'upload'
                        ? 'border-teal-500 bg-teal-50/60 shadow-md shadow-teal-500/10'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-colors ${
                        source === 'upload' ? 'bg-teal-100' : 'bg-gray-100 group-hover:bg-teal-50'
                      }`}>
                        <i className={`ri-upload-cloud-2-line text-xl ${source === 'upload' ? 'text-teal-600' : 'text-gray-500'}`}></i>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${source === 'upload' ? 'text-teal-800' : 'text-gray-800'}`}>
                          Upload a different resume
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">PDF, DOCX, DOC, TXT · Max 5MB</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        source === 'upload' ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                      }`}>
                        {source === 'upload' && <i className="ri-check-line text-white text-xs"></i>}
                      </div>
                    </div>

                    {source === 'upload' && (
                      <div
                        className={`mt-3 rounded-xl border-2 border-dashed transition-all ${
                          isDragging ? 'border-teal-400 bg-teal-50' :
                          uploadedFile ? 'border-emerald-400 bg-emerald-50/50' :
                          'border-teal-200 bg-white hover:border-teal-400'
                        }`}
                        onClick={(e) => { e.stopPropagation(); if (!uploadedFile) fileInputRef.current?.click(); }}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        {uploadedFile ? (
                          <div className="flex items-center gap-3 px-4 py-3">
                            <i className="ri-file-text-fill text-emerald-500 text-xl shrink-0"></i>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">{uploadedFile.name}</p>
                              <p className="text-xs text-emerald-600 mt-0.5">{(uploadedFile.size / 1024).toFixed(0)} KB · Ready</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <i className="ri-close-line text-sm"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-5 text-center cursor-pointer">
                            <i className="ri-upload-cloud-2-line text-2xl text-teal-400 mb-1"></i>
                            <p className="text-xs font-semibold text-gray-600">
                              <span className="text-teal-600">Click to upload</span> or drag &amp; drop
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </button>

                  {/* ── Option 3: Build from scratch ── */}
                  <button
                    onClick={() => setSource('scratch')}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                      source === 'scratch'
                        ? 'border-teal-500 bg-teal-50/60 shadow-md shadow-teal-500/10'
                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-colors ${
                        source === 'scratch' ? 'bg-teal-100' : 'bg-gray-100 group-hover:bg-teal-50'
                      }`}>
                        <i className={`ri-file-add-line text-xl ${source === 'scratch' ? 'text-teal-600' : 'text-gray-500'}`}></i>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${source === 'scratch' ? 'text-teal-800' : 'text-gray-800'}`}>
                          Build from scratch
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Create a new resume with our AI Resume Builder</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        source === 'scratch' ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                      }`}>
                        {source === 'scratch' && <i className="ri-check-line text-white text-xs"></i>}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Proceed button */}
                <button
                  onClick={handleProceed}
                  disabled={!canProceed()}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                    canProceed()
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.01] cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {source === 'scratch'
                    ? <><i className="ri-arrow-right-line"></i> Go to Resume Builder</>
                    : <><i className="ri-sparkling-fill"></i> Customize for This Job</>
                  }
                </button>
              </div>
            )}

            {/* STAGE: PROCESSING */}
            {stage === 'processing' && (
              <div className="py-2">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'radial-gradient(circle at 35% 30%, #2dd4bf, #0d9488 60%, #134e4a)',
                        boxShadow: '0 10px 28px rgba(13,148,136,0.45)',
                      }}
                    >
                      <i className="ri-sparkling-2-fill text-white text-3xl animate-pulse"></i>
                    </div>
                    <div className="absolute -inset-2 rounded-2xl bg-teal-400/20 blur-xl animate-pulse" />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900">Tailoring Your Resume</h3>
                  <p className="text-xs text-gray-500 mt-1">Customizing for <strong>{jobTitle}</strong> at {company}</p>
                </div>

                <div className="space-y-2.5">
                  {processingSteps.map((step, index) => {
                    const isDone = processingStep > index;
                    const isActive = processingStep === index;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                          isDone ? 'bg-emerald-50 border-emerald-200' :
                          isActive ? 'bg-teal-50 border-teal-200 shadow-sm' :
                          'bg-gray-50 border-gray-100 opacity-40'
                        }`}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-all ${
                          isDone ? 'bg-emerald-500' : isActive ? 'bg-gradient-to-br from-teal-500 to-emerald-500' : 'bg-gray-200'
                        }`}>
                          {isDone
                            ? <i className="ri-check-line text-white text-sm"></i>
                            : <i className={`${step.icon} text-sm ${isActive ? 'text-white animate-pulse' : 'text-gray-400'}`}></i>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${isDone ? 'text-emerald-800' : isActive ? 'text-teal-800' : 'text-gray-500'}`}>
                            {step.label}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDone ? 'text-emerald-600' : isActive ? 'text-teal-600' : 'text-gray-400'}`}>
                            {step.detail}
                          </p>
                        </div>
                        {isActive && (
                          <div className="flex gap-1 shrink-0">
                            {[0, 150, 300].map((delay) => (
                              <div key={delay} className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce"
                                style={{ animationDelay: `${delay}ms` }} />
                            ))}
                          </div>
                        )}
                        {isDone && <span className="text-[10px] font-bold text-emerald-600 shrink-0">Done</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Progress</span>
                    <span className="font-bold text-teal-600">{Math.round((processingStep / processingSteps.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 shimmer-bar"
                      style={{ width: `${(processingStep / processingSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STAGE: RESULT */}
            {stage === 'result' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-3">
                  <div className="float-badge w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: 'linear-gradient(135deg, #0d9488, #10b981)', boxShadow: '0 8px 24px rgba(13,148,136,0.4)' }}>
                    <i className="ri-check-double-line text-white text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">Resume Customized!</h3>
                  <p className="text-sm text-gray-500 mt-1 text-center">
                    Tailored for <strong className="text-gray-700">{jobTitle}</strong> at <strong className="text-gray-700">{company}</strong>
                  </p>
                </div>

                {/* Score */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                      <circle cx="28" cy="28" r="22" fill="none"
                        stroke="url(#scoreGrad)" strokeWidth="5"
                        strokeDasharray="138.2" strokeDashoffset="9.7"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0d9488" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black text-gray-900">93%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-teal-800">Excellent ATS Match</p>
                    <p className="text-xs text-teal-600 mt-0.5">93% keyword alignment with job description</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {['React', 'TypeScript', 'Agile', 'Leadership'].map(kw => (
                        <span key={kw} className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-semibold rounded-md">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Template picker */}
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Choose Template</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['modern', 'classic', 'minimal'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTemplate(t)}
                        className={`py-2.5 px-3 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer capitalize ${
                          selectedTemplate === t
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 text-gray-600 hover:border-teal-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div className="space-y-2">
                  {[
                    { icon: 'ri-check-double-line', text: '11 bullet points rewritten with metrics', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { icon: 'ri-bar-chart-grouped-line', text: '7 job-specific talent signals mapped', color: 'text-teal-600', bg: 'bg-teal-50' },
                    { icon: 'ri-shield-check-line', text: 'ATS formatting verified & cleaned', color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${item.bg}`}>
                      <div className={`w-6 h-6 flex items-center justify-center rounded-md bg-white ${item.color} shrink-0`}>
                        <i className={`${item.icon} text-xs`}></i>
                      </div>
                      <p className="text-xs text-gray-700 font-medium">{item.text}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white text-sm font-bold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-download-2-line text-base"></i>
                    Download PDF
                  </button>
                  <button
                    onClick={handleViewFull}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-bold hover:border-teal-300 hover:bg-teal-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-eye-line text-base"></i>
                    Full Preview
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {stage !== 'processing' && (
            <div className="px-6 pb-4 flex items-center justify-center gap-1.5">
              <i className="ri-lock-line text-gray-400 text-xs"></i>
              <p className="text-xs text-gray-400">Your data is processed securely and never stored</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
