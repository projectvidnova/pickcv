import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StepBasicInfo from './components/StepBasicInfo';
import StepCareerTarget from './components/StepCareerTarget';
import StepSkills from './components/StepSkills';
import StepResumeUpload from './components/StepResumeUpload';
import JourneyTimeline from './components/JourneyTimeline';
import ResumePreview from './components/ResumePreview';
import { apiService } from '../../services/api';

interface OnboardingData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  graduationYear: string;
  currentSemester: string;
  targetRole: string;
  preferredLocations: string[];
  experienceLevel: string;
  workMode: string;
  skills: Array<{ name: string; years: number }>;
  resumeFile: File | null;
}

interface LocationState {
  fromGoogle?: boolean;
  fromLinkedIn?: boolean;
  prefill?: {
    name: string;
    email: string;
    phone: string;
  };
}

const STEP_META = [
  {
    step: 1,
    icon: 'ri-user-smile-line',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    badge: '1 of 4',
    headline: "Let's get to know you",
    sub: 'Your profile is the foundation — jobs, resume, and matches are all built around you.',
    accent: 'rose',
    stat: { icon: 'ri-timer-line', value: '2 min', label: 'avg. to complete' },
    insight: { icon: 'ri-bar-chart-grouped-line', text: 'Complete profiles get', highlight: '3× more job matches' },
  },
  {
    step: 2,
    icon: 'ri-focus-3-line',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    badge: '2 of 4',
    headline: 'Define your dream career',
    sub: 'Tell us where you want to go — our AI finds the fastest path to get you there.',
    accent: 'amber',
    stat: { icon: 'ri-briefcase-4-line', value: '10,000+', label: 'live job openings' },
    insight: { icon: 'ri-magic-line', text: 'Specific targets get', highlight: '5× better recommendations' },
  },
  {
    step: 3,
    icon: 'ri-sparkling-2-line',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-500',
    badge: '3 of 4',
    headline: 'Showcase your superpowers',
    sub: 'Skills are your currency. The more you add, the better we match you to roles where you thrive.',
    accent: 'teal',
    stat: { icon: 'ri-crosshair-2-line', value: '95%', label: 'match accuracy' },
    insight: { icon: 'ri-line-chart-line', text: '5+ skills increases interview chances by', highlight: '60%' },
  },
  {
    step: 4,
    icon: 'ri-file-text-line',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    badge: '4 of 4',
    headline: 'One last thing',
    sub: 'Upload your existing resume and our AI extracts everything instantly — or skip and we build one from scratch.',
    accent: 'slate',
    stat: { icon: 'ri-robot-2-line', value: '30 sec', label: 'AI extraction time' },
    insight: { icon: 'ri-file-search-line', text: 'AI auto-fills your', highlight: 'entire profile instantly' },
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LocationState) || {};

  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [leftPanel, setLeftPanel] = useState<'timeline' | 'preview'>('timeline');
  const [confettiActive, setConfettiActive] = useState(false);
  const [googleBannerVisible, setGoogleBannerVisible] = useState(!!locationState.fromGoogle);
  const [linkedinBannerVisible, setLinkedinBannerVisible] = useState(!!locationState.fromLinkedIn);

  const [formData, setFormData] = useState<OnboardingData>({
    name: locationState.prefill?.name || '',
    email: locationState.prefill?.email || '',
    phone: locationState.prefill?.phone || '',
    linkedin: '',
    location: '',
    graduationYear: '',
    currentSemester: '',
    targetRole: '',
    preferredLocations: [],
    experienceLevel: '',
    workMode: '',
    skills: [],
    resumeFile: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => setLastSaved(new Date()), 2000);
    return () => clearTimeout(timer);
  }, [formData]);

  const updateFormData = (data: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    setConfettiActive(true);
    setIsCompleting(true);
    // Save profile to backend
    try {
      await apiService.updateProfile({
        full_name: formData.name,
        phone: formData.phone,
        location: formData.location,
        linkedin_url: formData.linkedin,
        target_role: formData.targetRole,
        experience_level: formData.experienceLevel,
        work_mode: formData.workMode,
        graduation_year: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
        current_semester: formData.currentSemester ? parseInt(formData.currentSemester) : undefined,
        preferred_locations: formData.preferredLocations,
        skills: formData.skills.map(s => ({ name: s.name, years: s.years })),
      });
    } catch {
      // Profile save failed silently — user can edit from profile page
    }
    setTimeout(() => navigate('/profile'), 3500);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!(formData.name && formData.email && formData.location);
      case 2: return !!(formData.targetRole && formData.experienceLevel && formData.workMode);
      case 3: return formData.skills.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const meta = STEP_META[currentStep - 1];

  return (
    <div className="min-h-screen mesh-bg flex overflow-hidden">

      {/* ── Left Panel ── */}
      <div className="w-[420px] flex-shrink-0 flex flex-col border-r border-white/40 glass-section">
        <div className="flex items-center gap-1 px-4 pt-4 pb-2">
          <button
            onClick={() => setLeftPanel('timeline')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              leftPanel === 'timeline' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 glass'
            }`}
          >
            <div className="w-4 h-4 flex items-center justify-center"><i className="ri-route-line text-sm" /></div>
            Journey
          </button>
          <button
            onClick={() => setLeftPanel('preview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              leftPanel === 'preview' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 glass'
            }`}
          >
            <div className="w-4 h-4 flex items-center justify-center"><i className="ri-file-text-line text-sm" /></div>
            Resume Preview
            {(formData.name || formData.targetRole || formData.skills.length > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            )}
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {leftPanel === 'timeline' ? (
            <JourneyTimeline currentStep={currentStep} />
          ) : (
            <ResumePreview data={formData} currentStep={currentStep} />
          )}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)' }}>

        {/* ── Top Nav Bar ── */}
        <div className="flex items-center justify-between px-10 py-4 border-b border-white/40 sticky top-0 z-20 glass-nav">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <i className="ri-briefcase-4-fill text-white text-sm" />
            </div>
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">CareerAI</span>
          </div>

          <div className="flex items-center gap-3 flex-1 mx-10">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(4px)' }}>
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
              {Math.round(((currentStep - 1) / 3) * 100)}% done
            </span>
          </div>

          {lastSaved && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-checkbox-circle-fill text-emerald-500 text-sm" />
              </div>
              Saved
            </div>
          )}
        </div>

        {/* ── Google Sign-in Banner ── */}
        {googleBannerVisible && currentStep === 1 && (
          <div className="mx-10 mt-6 flex items-center justify-between gap-3 px-4 py-3 glass-strong border border-emerald-200/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800">Signed in with Google</p>
                <p className="text-xs text-emerald-600">We&apos;ve pre-filled your name and email. Please add your phone number and location to continue.</p>
              </div>
            </div>
            <button onClick={() => setGoogleBannerVisible(false)}
              className="w-6 h-6 flex items-center justify-center text-emerald-400 hover:text-emerald-600 flex-shrink-0 cursor-pointer">
              <i className="ri-close-line text-base" />
            </button>
          </div>
        )}

        {/* ── LinkedIn Sign-in Banner ── */}
        {linkedinBannerVisible && currentStep === 1 && (
          <div className="mx-10 mt-6 flex items-center justify-between gap-3 px-4 py-3 glass-strong border border-[#b3cce8]/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="ri-linkedin-fill text-white text-base" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#004182]">Signed in with LinkedIn</p>
                <p className="text-xs text-[#0A66C2]">We&apos;ve pre-filled your name and email from your LinkedIn profile. Please add your phone number and location to continue.</p>
              </div>
            </div>
            <button onClick={() => setLinkedinBannerVisible(false)}
              className="w-6 h-6 flex items-center justify-center text-[#0A66C2]/60 hover:text-[#004182] flex-shrink-0 cursor-pointer">
              <i className="ri-close-line text-base" />
            </button>
          </div>
        )}

        {/* ── Step Header ── */}
        <div className="px-10 pt-10 pb-6 max-w-2xl w-full mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
              <i className={`${meta.icon} text-lg ${meta.iconColor}`} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {meta.badge}</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2">{meta.headline}</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-lg">{meta.sub}</p>

          {/* Insight strip */}
          <div className="flex items-center gap-6 p-4 glass rounded-2xl">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className={`${meta.stat.icon} text-slate-700 text-base`} />
              </div>
              <div>
                <div className="text-base font-extrabold text-slate-900">{meta.stat.value}</div>
                <div className="text-[11px] text-slate-400">{meta.stat.label}</div>
              </div>
            </div>
            <div className="w-px h-8 bg-white/50" />
            <div className="flex items-center gap-2.5 flex-1">
              <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className={`${meta.insight.icon} text-slate-700 text-base`} />
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                {meta.insight.text}{' '}
                <span className="font-bold text-slate-800">{meta.insight.highlight}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Form Card ── */}
        <div className="flex-1 flex items-start justify-center px-10 pb-10">
          <div className="w-full max-w-2xl">
            <div className="glass-card rounded-2xl p-10">

              {currentStep === 1 && (
                <StepBasicInfo
                  data={{ name: formData.name, email: formData.email, phone: formData.phone, linkedin: formData.linkedin, location: formData.location, graduationYear: formData.graduationYear, currentSemester: formData.currentSemester }}
                  onChange={(data) => updateFormData(data)}
                />
              )}
              {currentStep === 2 && (
                <StepCareerTarget
                  data={{ targetRole: formData.targetRole, preferredLocations: formData.preferredLocations, experienceLevel: formData.experienceLevel, workMode: formData.workMode }}
                  onChange={(data) => updateFormData(data)}
                />
              )}
              {currentStep === 3 && (
                <StepSkills
                  data={{ skills: formData.skills }}
                  targetRole={formData.targetRole}
                  onChange={(data) => updateFormData(data)}
                />
              )}
              {currentStep === 4 && (
                <StepResumeUpload
                  data={{ file: formData.resumeFile, fileName: formData.resumeFile?.name || '', extracting: false, extracted: false }}
                  onChange={(data) => updateFormData({ resumeFile: data.file })}
                />
              )}

              {/* ── Navigation ── */}
              <div className="flex items-center justify-between mt-10 pt-8 border-t border-white/40">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-arrow-left-line" />
                  Back
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className={`rounded-full transition-all duration-300 ${
                        s === currentStep ? 'w-5 h-2 bg-slate-900' : s < currentStep ? 'w-2 h-2 bg-emerald-500' : 'w-2 h-2 bg-white/50'
                      }`} />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap ${
                      currentStep === 4
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-[1.02] shadow-emerald-100'
                        : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02]'
                    }`}
                  >
                    {currentStep === 4 ? (
                      <><i className="ri-rocket-2-line text-base" />Launch My Career</>
                    ) : (
                      <>Continue<i className="ri-arrow-right-line text-base" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Social proof strip ── */}
            <div className="mt-5 flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="flex -space-x-1.5">
                  {[
                    'https://readdy.ai/api/search-image?query=professional%20headshot%20young%20woman%20smiling%20confident%20office%20background&width=32&height=32&seq=sp1&orientation=squarish',
                    'https://readdy.ai/api/search-image?query=professional%20headshot%20young%20man%20smiling%20confident%20office%20background&width=32&height=32&seq=sp2&orientation=squarish',
                    'https://readdy.ai/api/search-image?query=professional%20headshot%20woman%20glasses%20smiling%20office%20background&width=32&height=32&seq=sp3&orientation=squarish',
                  ].map((src, i) => (
                    <img key={i} src={src} alt="user" className="w-7 h-7 rounded-full border-2 border-white/70 object-top object-cover" />
                  ))}
                </div>
                <span className="font-semibold text-gray-500">50,000+</span> people already hired
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <i className="ri-shield-check-fill text-emerald-500" />
                <span>Encrypted &amp; private</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <i className="ri-star-fill text-amber-400" />
                <span className="font-semibold text-gray-500">4.9/5</span> from 12k reviews
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Completion Overlay ── */}
      {isCompleting && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          {confettiActive && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="absolute w-2 h-2 rounded-sm animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}%`,
                    backgroundColor: ['#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#f97316'][i % 6],
                    animationDelay: `${Math.random() * 1.5}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          )}
          <div className="glass-modal rounded-3xl p-14 text-center max-w-sm w-full mx-4 relative">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
              <i className="ri-check-line text-5xl text-white" />
            </div>
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">You&apos;re all set!</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Your profile is live. We&apos;re already finding the best jobs for you...</p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
              Taking you to your dashboard
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
}
