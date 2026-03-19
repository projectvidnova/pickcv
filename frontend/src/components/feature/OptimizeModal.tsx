import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../services/authFetch';

interface OptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3;
type JDInputMode = 'paste' | 'link' | 'title';

const stepConfig = [
  {
    num: 1,
    label: 'Upload',
    sublabel: 'Your Resume',
    icon: 'ri-upload-cloud-2-line',
    color: '#0d9488',
    glow: 'rgba(13,148,136,0.5)',
    lightColor: '#ccfbf1',
  },
  {
    num: 2,
    label: 'Job Info',
    sublabel: 'Target Role',
    icon: 'ri-briefcase-3-line',
    color: '#059669',
    glow: 'rgba(5,150,105,0.5)',
    lightColor: '#d1fae5',
  },
  {
    num: 3,
    label: 'Optimize',
    sublabel: 'AI Magic',
    icon: 'ri-sparkling-2-fill',
    color: '#0f766e',
    glow: 'rgba(15,118,110,0.5)',
    lightColor: '#99f6e4',
  },
];

export default function OptimizeModal({ isOpen, onClose }: OptimizeModalProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jdMode, setJDMode] = useState<JDInputMode>('paste');
  const [jdPaste, setJDPaste] = useState('');
  const [jdLink, setJDLink] = useState('');
  const [jdTitle, setJDTitle] = useState('');
  const [processingStep, setProcessingStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingSteps = [
    { icon: 'ri-upload-cloud-2-line', label: 'Uploading resume', detail: 'Sending your file to our servers' },
    { icon: 'ri-file-search-line', label: 'Analyzing content', detail: 'Parsing resume & job requirements' },
    { icon: 'ri-sparkling-2-fill', label: 'AI optimization', detail: 'Rewriting for keywords & impact' },
    { icon: 'ri-shield-check-line', label: 'Finalizing results', detail: 'Scoring ATS compatibility' },
  ];

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

  const handleNext = () => {
    if (currentStep === 1 && uploadedFile) setCurrentStep(2);
    else if (currentStep === 2 && isJDValid()) {
      setCurrentStep(3);
      startProcessing();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1);
  };

  const isJDValid = () => {
    if (jdMode === 'paste') return jdPaste.trim().length > 0;
    if (jdMode === 'link') return jdLink.trim().length > 0;
    if (jdMode === 'title') return jdTitle.trim().length > 0;
    return false;
  };

  const startProcessing = async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Please sign in first to optimize your resume.');
      setCurrentStep(1);
      onClose();
      return;
    }

    try {
      // ── Step 1: Uploading resume ──
      setProcessingStep(1);

      const formData = new FormData();
      if (uploadedFile) {
        formData.append('file', uploadedFile);
        formData.append('title', uploadedFile.name.replace(/\.[^/.]+$/, ""));
      }

      console.log('Uploading resume with token:', token.substring(0, 20) + '...');
      const uploadResponse = await authFetch(`${import.meta.env.VITE_API_URL}/resume/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload resume (${uploadResponse.status}): ${errorText}`);
      }

      const uploadedResume = await uploadResponse.json();
      const resumeId = uploadedResume.id;

      // ── Step 2: Analyzing content ──
      setProcessingStep(2);

      let jobTitle = 'Target Role';
      let jobDescription: string | undefined;
      let jobLink: string | undefined;

      if (jdMode === 'title') {
        // Title-only mode: backend will generate a full JD from the title
        jobTitle = jdTitle;
        // Don't send a fake job_description — let the backend handle it
      } else if (jdMode === 'paste') {
        jobDescription = jdPaste;
        // Try to extract job title from the first meaningful line of the pasted JD
        const firstLine = jdPaste.trim().split('\n').find(l => l.trim().length > 3);
        if (firstLine && firstLine.trim().length < 100) {
          jobTitle = firstLine.trim();
        }
      } else if (jdMode === 'link') {
        jobLink = jdLink;
      }

      // Brief pause so step 2 is visible before the long AI call
      await new Promise(resolve => setTimeout(resolve, 600));

      // ── Step 3: AI optimization (the long call) ──
      setProcessingStep(3);

      const optimizeResponse = await authFetch(
        `${import.meta.env.VITE_API_URL}/resume/${resumeId}/optimize-for-job`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_title: jobTitle,
            job_description: jobDescription,
            job_link: jobLink
          })
        }
      );

      if (!optimizeResponse.ok) {
        const errorText = await optimizeResponse.text();
        console.error('Optimization failed:', optimizeResponse.status, errorText);
        throw new Error(`Failed to optimize resume (${optimizeResponse.status}): ${errorText}`);
      }

      const optimizationData = await optimizeResponse.json();

      // ── Step 4: Finalizing results (only reached when backend has responded) ──
      setProcessingStep(4);

      // Store optimization data for the comparison page
      sessionStorage.setItem('optimizationData', JSON.stringify({
        resumeId,
        ...optimizationData
      }));

      // Short delay to let the user see 100% before navigating
      await new Promise(resolve => setTimeout(resolve, 800));

      navigate('/resume-comparison', {
        state: { optimizedResume: { resumeId, ...optimizationData } }
      });
      handleClose();
    } catch (error) {
      console.error('Optimization error:', error);
      alert('Failed to optimize resume. Please try again.');
      setProcessingStep(0);
      setCurrentStep(2);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setJDPaste('');
    setJDLink('');
    setJDTitle('');
    setProcessingStep(0);
    onClose();
  };

  const handleCreateResume = () => {
    handleClose();
    navigate('/resume-builder');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseRing {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.55; }
          100% { transform: translate(-50%, -50%) scale(1.85); opacity: 0; }
        }
        @keyframes glowBreath {
          0%, 100% { opacity: 0.4; transform: scale(1.2); }
          50% { opacity: 0.85; transform: scale(1.45); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerBar {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .orb-float { animation: floatUp 2.6s ease-in-out infinite; }
        .pulse-ring-1 { animation: pulseRing 2s ease-out infinite; }
        .pulse-ring-2 { animation: pulseRing 2s ease-out 0.7s infinite; }
        .glow-breath { animation: glowBreath 2.2s ease-in-out infinite; }
        .animate-fade-in-up { animation: fadeInUp 0.38s ease-out both; }
        .shimmer-active {
          background: linear-gradient(90deg, #0d9488 0%, #5eead4 45%, #10b981 100%);
          background-size: 200% auto;
          animation: shimmerBar 1.8s linear infinite;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/75 backdrop-blur-md"
        onClick={currentStep !== 3 ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl animate-fade-in-up">
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-teal-400/20 via-emerald-400/10 to-transparent blur-2xl pointer-events-none" />

        <div className="relative rounded-3xl overflow-hidden" style={{
          background: '#ffffff',
          boxShadow: '0 32px 80px rgba(0,0,0,0.2), 0 8px 28px rgba(13,148,136,0.12)',
        }}>

          {/* ── Header ── */}
          <div className="relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #0c1628 0%, #0f3d38 50%, #063328 100%)',
          }}>
            {/* BG orbs */}
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 70%)' }} />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)' }} />

            {/* Brand row */}
            <div className="relative flex items-center justify-between px-7 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #10b981)', boxShadow: '0 3px 10px rgba(13,148,136,0.45)' }}>
                  <i className="ri-sparkling-2-fill text-white text-sm"></i>
                </div>
                <div>
                  <p className="text-xs font-black text-teal-300 uppercase tracking-widest leading-none">AI Resume Optimizer</p>
                  <p className="text-white/35 text-xs mt-0.5 leading-none">
                    {currentStep === 1 && 'Step 1 of 3 — Upload your resume'}
                    {currentStep === 2 && 'Step 2 of 3 — Tell us the role'}
                    {currentStep === 3 && 'Step 3 of 3 — Optimizing now'}
                  </p>
                </div>
              </div>
              {currentStep !== 3 && (
                <button onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-white/50 hover:text-white transition-all cursor-pointer shrink-0">
                  <i className="ri-close-line text-base"></i>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="mx-7 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

            {/* ── Step Nodes — centered with CSS grid ── */}
            <div className="relative px-8 pt-5 pb-6">

              {/* Connector lines layer — sits behind nodes */}
              <div className="absolute inset-x-8 pointer-events-none" style={{ top: 'calc(1.25rem + 26px)' }}>
                <div className="flex items-center h-0.5">
                  {/* Left line: from center of node 1 to center of node 2 */}
                  <div style={{ flex: 1, marginLeft: 26, marginRight: 26 }}>
                    <div className="relative w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-in-out"
                        style={{
                          width: currentStep > 1 ? '100%' : '0%',
                          background: currentStep > 1
                            ? 'linear-gradient(90deg, #0d9488, #10b981)'
                            : 'transparent',
                          boxShadow: currentStep > 1 ? '0 0 8px rgba(13,148,136,0.7)' : 'none',
                        }} />
                    </div>
                  </div>
                  {/* Center node placeholder */}
                  <div style={{ width: 52, flexShrink: 0 }} />
                  {/* Right line: from center of node 2 to center of node 3 */}
                  <div style={{ flex: 1, marginLeft: 26, marginRight: 26 }}>
                    <div className="relative w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-in-out"
                        style={{
                          width: currentStep > 2 ? '100%' : '0%',
                          background: currentStep > 2
                            ? 'linear-gradient(90deg, #0d9488, #10b981)'
                            : 'transparent',
                          boxShadow: currentStep > 2 ? '0 0 8px rgba(13,148,136,0.7)' : 'none',
                        }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nodes — use grid so center node is truly centered */}
              <div className="relative grid grid-cols-3">
                {stepConfig.map((step) => {
                  const isDone = currentStep > step.num;
                  const isActive = currentStep === step.num;

                  return (
                    <div key={step.num} className="flex flex-col items-center">
                      {/* Sphere container */}
                      <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>

                        {/* Glow backdrop */}
                        {(isActive || isDone) && (
                          <div className="absolute inset-0 rounded-full pointer-events-none glow-breath"
                            style={{
                              background: isDone ? 'rgba(5,150,105,0.35)' : step.glow,
                              filter: 'blur(10px)',
                            }} />
                        )}

                        {/* Pulse rings (active only) */}
                        {isActive && (
                          <>
                            <div className="pulse-ring-1 absolute rounded-full pointer-events-none"
                              style={{ width: 52, height: 52, top: '50%', left: '50%', background: step.glow }} />
                            <div className="pulse-ring-2 absolute rounded-full pointer-events-none"
                              style={{ width: 52, height: 52, top: '50%', left: '50%', background: step.glow }} />
                          </>
                        )}

                        {/* 3D Sphere */}
                        <div
                          className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-500 ${isActive ? 'orb-float' : ''}`}
                          style={{
                            width: 52,
                            height: 52,
                            background: isDone
                              ? 'radial-gradient(circle at 33% 27%, #86efac, #16a34a 52%, #052e16)'
                              : isActive
                              ? `radial-gradient(circle at 33% 27%, #5eead4, ${step.color} 52%, #0a2e28)`
                              : 'radial-gradient(circle at 33% 27%, #4b5563, #1f2937 52%, #111827)',
                            boxShadow: isDone
                              ? '0 6px 22px rgba(22,163,74,0.5), 0 2px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)'
                              : isActive
                              ? `0 6px 26px ${step.glow}, 0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.22)`
                              : '0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                          }}
                        >
                          {/* Specular highlight */}
                          <div className="absolute pointer-events-none"
                            style={{ width: 15, height: 9, top: 8, left: 11, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.42) 0%, transparent 100%)', filter: 'blur(1.5px)' }} />

                          {isDone
                            ? <i className="ri-check-line text-white text-xl" style={{ fontWeight: 900 }}></i>
                            : <i className={`${step.icon} text-lg ${isActive ? 'text-white' : 'text-slate-500'}`}></i>
                          }
                        </div>
                      </div>

                      {/* Label */}
                      <div className="mt-2.5 text-center">
                        <p className={`text-xs font-extrabold tracking-wide leading-none transition-colors ${
                          isActive ? 'text-teal-300' : isDone ? 'text-emerald-400' : 'text-slate-500'
                        }`}>{step.label}</p>
                        <p className={`text-xs mt-1 leading-none transition-colors ${
                          isActive ? 'text-white/45' : isDone ? 'text-emerald-500/55' : 'text-slate-600'
                        }`}>{step.sublabel}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-7 py-6">

            {/* ── STEP 1: Upload ── */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Upload Your Resume</h2>
                  <p className="text-sm text-gray-500 mt-0.5">We'll tailor it precisely to the job you want</p>
                </div>

                {/* Upload Zone */}
                <div
                  className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? 'border-teal-400 bg-teal-50/80'
                      : uploadedFile
                      ? 'border-emerald-400 bg-emerald-50/60'
                      : 'border-gray-200 bg-gray-50/80 hover:border-teal-300 hover:bg-teal-50/40'
                  }`}
                  onClick={() => !uploadedFile && fileInputRef.current?.click()}
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
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-100 shrink-0">
                        <i className="ri-file-text-fill text-emerald-600 text-2xl"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">
                          <i className="ri-check-line mr-1"></i>
                          {(uploadedFile.size / 1024).toFixed(0)} KB · Ready to optimize
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                      >
                        <i className="ri-close-line text-base"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-9 px-6 text-center">
                      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 mb-4 shadow-lg shadow-teal-500/25">
                        <i className="ri-upload-cloud-2-line text-white text-2xl"></i>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">
                        <span className="text-teal-600">Click to upload</span> or drag &amp; drop
                      </p>
                      <p className="text-xs text-gray-400">PDF, DOC, DOCX, TXT · Max 5MB</p>
                    </div>
                  )}
                </div>

                {/* Supported formats */}
                <div className="flex items-center gap-2 flex-wrap">
                  {['PDF', 'DOCX', 'DOC', 'TXT'].map((fmt) => (
                    <span key={fmt} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">{fmt}</span>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">supported formats</span>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Create Resume CTA */}
                <button
                  onClick={handleCreateResume}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-teal-300 bg-white hover:bg-teal-50/40 transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-teal-100 transition-colors shrink-0">
                    <i className="ri-file-add-line text-gray-500 group-hover:text-teal-600 text-lg transition-colors"></i>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-teal-700 transition-colors">Don't have a resume?</p>
                    <p className="text-xs text-gray-500 mt-0.5">Build one from scratch with our AI Resume Creator</p>
                  </div>
                  <i className="ri-arrow-right-line text-gray-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all text-lg shrink-0"></i>
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={!uploadedFile}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
                    uploadedFile
                      ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20 hover:shadow-xl hover:scale-[1.01]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue to Job Details
                  <i className="ri-arrow-right-line text-base"></i>
                </button>
              </div>
            )}

            {/* ── STEP 2: Job Info ── */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Target Job Details</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Tell us about the role you're applying for</p>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                  {([
                    { key: 'paste', icon: 'ri-file-text-line', label: 'Paste JD' },
                    { key: 'link', icon: 'ri-link', label: 'Job Link' },
                    { key: 'title', icon: 'ri-briefcase-line', label: 'Job Title' },
                  ] as { key: JDInputMode; icon: string; label: string }[]).map((mode) => (
                    <button
                      key={mode.key}
                      onClick={() => setJDMode(mode.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        jdMode === mode.key
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <i className={`${mode.icon} text-sm`}></i>
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div>
                  {jdMode === 'paste' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Job Description</label>
                      <textarea
                        value={jdPaste}
                        onChange={(e) => setJDPaste(e.target.value)}
                        placeholder="Paste the full job description here. The more detail, the better the optimization..."
                        className="w-full h-40 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 resize-none transition-all"
                      />
                      {jdPaste.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1 text-right">{jdPaste.length} characters</p>
                      )}
                    </div>
                  )}
                  {jdMode === 'link' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Job Posting URL</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400">
                          <i className="ri-link text-base"></i>
                        </div>
                        <input
                          type="url"
                          value={jdLink}
                          onChange={(e) => setJDLink(e.target.value)}
                          placeholder="https://linkedin.com/jobs/view/..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Supports LinkedIn, Indeed, Glassdoor, and more</p>
                    </div>
                  )}
                  {jdMode === 'title' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Job Title</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400">
                          <i className="ri-briefcase-line text-base"></i>
                        </div>
                        <input
                          type="text"
                          value={jdTitle}
                          onChange={(e) => setJDTitle(e.target.value)}
                          placeholder="e.g. Senior Product Manager at Google"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">We'll use industry-standard keywords for this role</p>
                    </div>
                  )}
                </div>

                {/* Info tip */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="ri-lightbulb-flash-line text-teal-500 text-base"></i>
                  </div>
                  <p className="text-xs text-teal-700 leading-relaxed">
                    <strong>Tip:</strong> Pasting the full job description gives the best results — we extract exact keywords employers are screening for.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleBack}
                    className="px-5 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
                  >
                    <i className="ri-arrow-left-line"></i>Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!isJDValid()}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
                      isJDValid()
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.01]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <i className="ri-sparkling-fill text-base"></i>
                    Start Optimization
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Processing ── */}
            {currentStep === 3 && (
              <div className="py-2">
                {/* Animated icon */}
                <div className="flex flex-col items-center mb-7">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/30"
                      style={{
                        background: 'radial-gradient(circle at 35% 30%, #2dd4bf, #0d9488 60%, #134e4a)',
                        boxShadow: '0 12px 32px rgba(13,148,136,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
                      }}>
                      <i className="ri-sparkling-2-fill text-white text-4xl animate-pulse"></i>
                    </div>
                    <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-teal-400/20 to-emerald-400/20 blur-xl animate-pulse" />
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">Optimizing Your Resume</h3>
                  <p className="text-sm text-gray-500 mt-1">AI is working its magic...</p>
                </div>

                {/* Processing steps */}
                <div className="space-y-3">
                  {processingSteps.map((step, index) => {
                    const stepNum = index + 1;
                    const isDone = processingStep > stepNum;
                    const isActive = processingStep === stepNum;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-500 ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-200'
                            : isActive
                            ? 'bg-teal-50 border-teal-200 shadow-sm'
                            : 'bg-gray-50 border-gray-100 opacity-50'
                        }`}
                      >
                        <div className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-all duration-300 ${
                          isDone ? 'bg-emerald-500' : isActive ? 'bg-gradient-to-br from-teal-500 to-emerald-500' : 'bg-gray-200'
                        }`}>
                          {isDone
                            ? <i className="ri-check-line text-white text-base font-bold"></i>
                            : <i className={`${step.icon} text-base ${isActive ? 'text-white animate-pulse' : 'text-gray-400'}`}></i>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${isDone ? 'text-emerald-800' : isActive ? 'text-teal-800' : 'text-gray-500'}`}>
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
                        {isDone && <span className="text-xs font-bold text-emerald-600 shrink-0">Done</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Progress</span>
                    <span className="font-bold text-teal-600">{Math.round((processingStep / 4) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${(processingStep / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {currentStep !== 3 && (
            <div className="px-7 pb-5 flex items-center justify-center gap-2">
              <i className="ri-lock-line text-gray-400 text-xs"></i>
              <p className="text-xs text-gray-400">Your data is processed securely and never stored</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
