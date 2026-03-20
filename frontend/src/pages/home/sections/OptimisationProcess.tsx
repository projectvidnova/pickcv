
import { useState } from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    number: '01',
    icon: 'ri-upload-cloud-2-line',
    title: 'Upload Resume',
    description: 'Drop your existing resume (PDF or DOCX). No signup needed to get started.',
    color: 'from-teal-500 to-teal-600',
    accent: 'teal',
    detail: 'Supports PDF, DOC, DOCX, TXT',
    visual: (
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg"
          style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.9)' }}>
          <i className="ri-file-text-fill text-3xl text-teal-500"></i>
          <div className="space-y-1 w-10">
            <div className="h-1 bg-teal-200 rounded-full w-full"></div>
            <div className="h-1 bg-gray-200 rounded-full w-3/4"></div>
            <div className="h-1 bg-gray-200 rounded-full w-full"></div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-teal-700"
          style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)' }}>
          <i className="ri-check-line"></i> Parsed successfully
        </div>
      </div>
    ),
  },
  {
    number: '02',
    icon: 'ri-briefcase-line',
    title: 'ATS Detection',
    description: 'Our AI scans for ATS compatibility issues, missing keywords, and format problems that get your resume rejected.',
    color: 'from-emerald-500 to-emerald-600',
    accent: 'emerald',
    detail: 'Works with any job board URL',
    visual: (
      <div className="flex flex-col gap-2 w-full max-w-[160px]">
        {['Leadership', 'Agile', 'Stakeholder Mgmt', 'Data-driven'].map((kw, i) => (
          <div key={kw} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.85)', animationDelay: `${i * 0.1}s` }}>
            <i className="ri-key-2-line text-emerald-500 text-xs"></i>
            <span className="text-gray-700">{kw}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '03',
    icon: 'ri-cpu-line',
    title: 'Keyword Injection',
    description: '6–12 high-impact keywords are woven naturally into your resume content — no stuffing, just smart placement.',
    color: 'from-cyan-500 to-cyan-600',
    accent: 'cyan',
    detail: 'Deep semantic keyword matching',
    visual: (
      <div className="flex flex-col gap-2.5 w-full max-w-[160px]">
        {[
          { label: 'Keyword Match', val: 62, color: 'bg-amber-400' },
          { label: 'ATS Score', val: 48, color: 'bg-red-400' },
          { label: 'Relevance', val: 71, color: 'bg-cyan-400' },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-600 font-medium">{item.label}</span>
              <span className="text-xs font-bold text-gray-700">{item.val}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.5)' }}>
              <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.val}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '04',
    icon: 'ri-edit-2-line',
    title: 'Resume Optimization',
    description: 'Bullets are rewritten with achievement-driven language and quantified impact. Weak verbs replaced with strong action words.',
    color: 'from-violet-500 to-purple-600',
    accent: 'violet',
    detail: 'Action verbs + natural keyword flow',
    visual: (
      <div className="flex flex-col gap-2 w-full max-w-[160px]">
        <div className="rounded-lg p-2.5 text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-red-400 line-through leading-relaxed">Worked on product features with team</span>
        </div>
        <div className="flex items-center justify-center">
          <i className="ri-arrow-down-line text-gray-400 text-sm"></i>
        </div>
        <div className="rounded-lg p-2.5 text-xs" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <span className="text-emerald-700 leading-relaxed font-medium">Led cross-functional team to ship 3 data-driven features, boosting retention 22%</span>
        </div>
      </div>
    ),
  },
  {
    number: '05',
    icon: 'ri-shield-check-line',
    title: 'ATS Scoring',
    description: 'A real-time score shows exactly how your resume performs against ATS filters used by 98% of Fortune 500 companies.',
    color: 'from-green-500 to-emerald-600',
    accent: 'green',
    detail: 'Tested against 50+ ATS systems',
    visual: (
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <i className="ri-shield-check-fill text-white text-2xl"></i>
        </div>
        <div className="flex flex-col gap-1 w-full max-w-[140px]">
          {['Format ✓', 'Headers ✓', 'Fonts ✓', 'Structure ✓'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs font-medium text-green-700 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(16,185,129,0.1)' }}>
              <i className="ri-check-line text-green-500"></i>{item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: '06',
    icon: 'ri-download-2-line',
    title: 'Download Optimized Resume',
    description: 'Get your ATS-ready resume in seconds — formatted, optimized, and interview-ready. Start applying with confidence.',
    color: 'from-amber-500 to-orange-500',
    accent: 'amber',
    detail: 'PDF ready in seconds',
    visual: (
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-20 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg"
            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.9)' }}>
            <i className="ri-file-text-fill text-3xl text-amber-500"></i>
            <div className="space-y-1 w-10">
              <div className="h-1 bg-amber-200 rounded-full w-full"></div>
              <div className="h-1 bg-gray-200 rounded-full w-3/4"></div>
              <div className="h-1 bg-gray-200 rounded-full w-full"></div>
            </div>
          </div>
          <div className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
            <span className="text-xs font-bold">94%</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <i className="ri-download-line"></i> Ready to download
        </div>
      </div>
    ),
  },
];

const accentMap: Record<string, { badge: string; connector: string; glow: string }> = {
  teal:    { badge: 'from-teal-500 to-teal-600',    connector: 'border-teal-200',    glow: 'rgba(20,184,166,0.12)' },
  emerald: { badge: 'from-emerald-500 to-emerald-600', connector: 'border-emerald-200', glow: 'rgba(16,185,129,0.12)' },
  cyan:    { badge: 'from-cyan-500 to-cyan-600',    connector: 'border-cyan-200',    glow: 'rgba(6,182,212,0.12)' },
  violet:  { badge: 'from-teal-600 to-emerald-500', connector: 'border-teal-200',    glow: 'rgba(20,184,166,0.12)' },
  green:   { badge: 'from-green-500 to-emerald-600', connector: 'border-green-200',  glow: 'rgba(34,197,94,0.12)' },
  amber:   { badge: 'from-amber-500 to-orange-500', connector: 'border-amber-200',   glow: 'rgba(245,158,11,0.12)' },
};

export default function OptimisationProcess() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <section id="optimisation-process" className="py-20 lg:py-28 relative overflow-hidden mesh-bg-subtle">
      {/* Background orbs */}
      <div className="orb orb-teal absolute -top-10 left-1/4 w-80 h-80 pointer-events-none opacity-60"></div>
      <div className="orb orb-emerald absolute bottom-10 right-1/4 w-96 h-96 pointer-events-none opacity-50"></div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6">
            <i className="ri-flashlight-fill text-amber-500"></i>
            How It Works
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 tracking-tight leading-[1.1]">
            6 AI Steps That
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent"> Transform Your Resume</span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            From upload to optimized — our AI handles everything in under 30 seconds.
          </p>
        </div>

        {/* Steps — alternating layout */}
        <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8">
          {steps.map((step, index) => {
            const accent = accentMap[step.accent];
            const isEven = index % 2 === 0;
            const isActive = activeStep === index;

            return (
              <div
                key={step.number}
                className="relative group cursor-pointer"
                onMouseEnter={() => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(null)}
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-[2.25rem] lg:left-1/2 top-full h-6 lg:h-8 w-0.5 border-l-2 border-dashed z-0"
                    style={{ borderColor: 'rgba(20,184,166,0.25)' }}></div>
                )}

                <div
                  className="relative glass-card rounded-3xl p-6 lg:p-8 transition-all duration-500 overflow-hidden"
                  style={{
                    transform: isActive ? 'translateY(-6px)' : 'translateY(0)',
                    boxShadow: isActive
                      ? `0 24px 48px -12px ${accent.glow}, 0 8px 24px -4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)`
                      : undefined,
                  }}
                >
                  {/* Glow bg */}
                  <div
                    className="absolute inset-0 rounded-3xl transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at ${isEven ? '10%' : '90%'} 50%, ${accent.glow}, transparent 70%)`, opacity: isActive ? 1 : 0 }}
                  ></div>

                  <div className={`relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-10 ${!isEven ? 'lg:flex-row-reverse' : ''}`}>

                    {/* Step badge + icon */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-2xl shadow-lg transition-all duration-500 ${isActive ? 'scale-110 rotate-3' : ''}`}>
                        <i className={step.icon}></i>
                      </div>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-sm font-bold shadow-md opacity-70`}>
                        {step.number}
                      </div>
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed mb-3 text-sm lg:text-base">{step.description}</p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600"
                        style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.85)' }}>
                        <i className="ri-information-line text-teal-500"></i>
                        {step.detail}
                      </div>
                    </div>

                    {/* Visual */}
                    <div className={`shrink-0 flex items-center justify-center w-full lg:w-48 transition-all duration-500 ${isActive ? 'scale-105' : 'scale-100'}`}>
                      {step.visual}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom stats bar */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 text-center">
              {[
                { icon: 'ri-timer-line', value: '< 30s', label: 'Optimisation time', color: 'text-teal-600' },
                { icon: 'ri-bar-chart-fill', value: '94%', label: 'Avg. ATS match score', color: 'text-emerald-600' },
                { icon: 'ri-key-2-line', value: '6–12', label: 'Keywords injected', color: 'text-cyan-600' },
                { icon: 'ri-briefcase-4-line', value: '3×', label: 'More interview callbacks', color: 'text-amber-600' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${stat.color}`}
                    style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <i className={`${stat.icon} text-xl`}></i>
                  </div>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-10 py-4 rounded-2xl text-base font-semibold shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all whitespace-nowrap"
          >
            <i className="ri-upload-cloud-2-line"></i>
            Upload Your Resume Now
            <i className="ri-arrow-right-line"></i>
          </Link>
          <p className="text-sm text-gray-500 mt-3">No sign-up required · Results in under 30 seconds</p>
        </div>

      </div>
    </section>
  );
}
