
import { useState, useEffect } from 'react';
import AuthModal from '../../../components/feature/AuthModal';
import OptimizeModal from '../../../components/feature/OptimizeModal';

export default function Hero() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);

  const steps = [
    { icon: 'ri-upload-cloud-2-line', title: 'Upload Resume', description: 'Drop your PDF/DOCX', color: 'from-teal-500 to-teal-600', pillColor: 'bg-teal-100 text-teal-700', detail: 'No signup needed' },
    { icon: 'ri-radar-line', title: 'ATS Detection', description: 'Scan for issues', color: 'from-cyan-500 to-cyan-600', pillColor: 'bg-cyan-100 text-cyan-700', detail: 'Real-time analysis' },
    { icon: 'ri-key-2-line', title: 'Keyword Injection', description: '6–12 keywords added', color: 'from-emerald-500 to-emerald-600', pillColor: 'bg-emerald-100 text-emerald-700', detail: 'Role-specific match' },
    { icon: 'ri-download-cloud-2-line', title: 'Get Hired', description: 'Download & apply', color: 'from-green-500 to-emerald-600', pillColor: 'bg-green-100 text-green-700', detail: '94% ATS score' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        .hero-card-active {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(28px) saturate(200%);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1.5px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 16px 48px rgba(13, 148, 136, 0.18), inset 0 1px 0 rgba(255,255,255,1);
        }
      `}</style>

      <section className="relative min-h-screen pt-20 lg:pt-0 overflow-hidden mesh-bg">
        {/* Orbs */}
        <div className="orb orb-teal absolute top-20 left-10 w-80 h-80 pointer-events-none" />
        <div className="orb orb-emerald absolute bottom-20 right-10 w-96 h-96 pointer-events-none" />
        <div className="orb orb-cyan absolute top-1/2 left-1/3 w-64 h-64 pointer-events-none" />

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="min-h-screen flex items-center py-16 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center w-full max-w-7xl mx-auto">

              {/* Left Content */}
              <div className="max-w-2xl lg:pr-8">
                <div className="inline-flex items-center gap-2 glass-badge text-red-600 px-5 py-2.5 rounded-full text-sm font-medium mb-8">
                  <i className="ri-error-warning-fill text-red-500"></i>
                  70% of resumes are rejected by ATS before a human sees them
                </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.2] tracking-tight mb-6">
                  From Resume →<br />
                  <span className="inline-flex items-baseline">
                    Get 
                    <span 
                      className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent inline-block pl-3 pr-12 pt-2 pb-10 align-middle" 
                      style={{ fontFamily: "'Pacifico', cursive", lineHeight: "1.6" }}
                    >
                      Hired
                    </span>
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
                  Your resume is failing ATS. We fix that in 30 seconds.
                  AI-powered optimization that gets you past every filter and into interviews.
                </p>

                {/* 3-Step Visual Flow */}
                <div className="glass-card rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between gap-4">
                    {/* Step 1: Upload */}
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-teal-500/30">
                        <i className="ri-upload-cloud-2-line text-2xl"></i>
                      </div>
                      <p className="text-sm font-bold text-gray-900">Upload</p>
                      <p className="text-xs text-gray-500 mt-1">Your Resume</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center -mt-8">
                      <i className="ri-arrow-right-line text-2xl text-teal-400"></i>
                    </div>

                    {/* Step 2: Optimize */}
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-emerald-500/30">
                        <i className="ri-sparkling-fill text-2xl"></i>
                      </div>
                      <p className="text-sm font-bold text-gray-900">Optimize</p>
                      <p className="text-xs text-gray-500 mt-1">AI-Powered</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center -mt-8">
                      <i className="ri-arrow-right-line text-2xl text-emerald-400"></i>
                    </div>

                    {/* Step 3: Apply */}
                    <div className="flex-1 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-green-500/30">
                        <i className="ri-briefcase-4-line text-2xl"></i>
                      </div>
                      <p className="text-sm font-bold text-gray-900">Apply</p>
                      <p className="text-xs text-gray-500 mt-1">Get Hired</p>
                    </div>
                  </div>
                </div>

                {/* Get Started Button */}
                <button
                  onClick={() => setIsOptimizeModalOpen(true)}
                  className="w-full py-4 rounded-xl text-base font-semibold bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap mb-6"
                >
                  <i className="ri-upload-cloud-2-line text-lg"></i>
                  Upload → Get up to 94% ATS Match
                  <i className="ri-arrow-right-line text-lg"></i>
                </button>

                {/* Micro Stats */}
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="ri-flashlight-fill text-amber-500 text-lg"></i>
                    <span className="text-sm font-medium">Results in 30 seconds</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="ri-lock-unlock-line text-teal-500 text-lg"></i>
                    <span className="text-sm font-medium">No signup required</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="ri-shield-check-fill text-green-500 text-lg"></i>
                    <span className="text-sm font-medium">ATS safe</span>
                  </div>
                </div>
              </div>

              {/* Right Visual */}
              <div className="relative hidden lg:block">
                <div className="relative">
                  {/* Central Resume Card */}
                  <div className="relative glass-card rounded-3xl p-8 max-w-md mx-auto z-10 float-slow">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/30">
                        AS
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">Adithya Sharma</h3>
                        <p className="text-teal-600 font-medium">Product Manager</p>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <i className="ri-check-line"></i>Hired
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience</span>
                        </div>
                        <div className="rounded-xl p-3 glass">
                          <p className="text-sm font-semibold text-gray-800">Senior PM at Razorpay</p>
                          <p className="text-xs text-gray-500">2021 - Present</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-teal-100/80 text-teal-700 rounded-full text-xs font-medium">Strategy</span>
                          <span className="px-3 py-1 bg-emerald-100/80 text-emerald-700 rounded-full text-xs font-medium">Analytics</span>
                          <span className="px-3 py-1 bg-green-100/80 text-green-700 rounded-full text-xs font-medium">Leadership</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -top-4 -right-4 bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-teal-500/30 flex items-center gap-2 animate-pulse">
                      <i className="ri-sparkling-fill"></i>AI Enhanced
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-xl flex items-center gap-2 whitespace-nowrap">
                      <i className="ri-briefcase-fill text-amber-400"></i>₹24 LPA Offer Received
                    </div>
                  </div>

                  {/* Floating Step Cards */}
                  {steps.map((step, index) => {
                    const positions = [
                      '-top-4 -left-16',
                      'top-8 -right-12',
                      '-bottom-4 -left-12',
                      'bottom-8 -right-8',
                    ];
                    return (
                      <div
                        key={index}
                        className={`absolute ${positions[index]} rounded-2xl p-4 w-56 transition-all duration-500 cursor-pointer ${activeStep === index ? 'hero-card-active scale-105 z-20' : 'glass scale-100 z-10'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-xl shadow-md transition-all duration-300 ${activeStep === index ? 'animate-bounce' : ''}`}>
                            <i className={step.icon}></i>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{step.title}</p>
                            <p className="text-xs text-gray-500">{step.description}</p>
                          </div>
                        </div>
                        <div className={`mt-2 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${activeStep === index ? step.pillColor : 'text-gray-500'}`}
                          style={activeStep !== index ? { background: 'rgba(255,255,255,0.45)' } : {}}>
                          {step.detail}
                        </div>
                      </div>
                    );
                  })}

                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
                      </linearGradient>
                    </defs>
                    <path d="M 100 80 Q 150 120 200 140" fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4,4" />
                    <path d="M 380 120 Q 330 150 300 170" fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4,4" />
                    <path d="M 80 280 Q 130 250 180 230" fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4,4" />
                    <path d="M 360 300 Q 310 260 280 240" fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4,4" />
                  </svg>

                  <div className="absolute top-1/4 -left-16 w-32 h-32 bg-teal-300/20 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-1/4 -right-16 w-40 h-40 bg-emerald-300/20 rounded-full blur-3xl"></div>
                </div>

                {/* Journey Step Indicators */}
                <div className="mt-10 flex justify-center items-center gap-3">
                  {steps.map((step, index) => (
                    <button key={index} onClick={() => setActiveStep(index)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap cursor-pointer ${
                        activeStep === index ? 'bg-gray-900 text-white shadow-lg' :
                        activeStep > index ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                      style={activeStep <= index && activeStep !== index ? { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.7)' } : {}}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        activeStep === index ? 'bg-white text-gray-900' : activeStep > index ? 'bg-teal-500 text-white' : 'bg-gray-300 text-white'
                      }`}>
                        {activeStep > index ? <i className="ri-check-line"></i> : index + 1}
                      </div>
                      <span className="text-sm font-medium">{step.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Visual */}
              <div className="lg:hidden flex flex-col items-center gap-6">
                <div className="glass-card rounded-2xl p-6 max-w-sm w-full relative">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">AS</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Adithya Sharma</h3>
                      <p className="text-teal-600 text-sm font-medium">Product Manager</p>
                    </div>
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Hired</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-teal-100/80 text-teal-700 rounded-full text-xs font-medium">Strategy</span>
                    <span className="px-3 py-1 bg-emerald-100/80 text-emerald-700 rounded-full text-xs font-medium">Analytics</span>
                    <span className="px-3 py-1 bg-green-100/80 text-green-700 rounded-full text-xs font-medium">Leadership</span>
                  </div>
                  <div className="pt-4 border-t border-white/50 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Job Match</span>
                    <span className="text-sm font-bold text-teal-600">98% Match</span>
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
                    <i className="ri-briefcase-fill text-amber-400"></i>₹24 LPA Offer
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
                  {steps.map((step, index) => (
                    <div key={index} onClick={() => setActiveStep(index)}
                      className={`rounded-xl p-4 transition-all duration-500 cursor-pointer ${index === activeStep ? 'hero-card-active' : 'glass'}`}>
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-2 shadow-md`}>
                        <i className={`${step.icon} text-lg`}></i>
                      </div>
                      <p className="text-sm font-bold text-gray-800 mb-1">{step.title}</p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <OptimizeModal isOpen={isOptimizeModalOpen} onClose={() => setIsOptimizeModalOpen(false)} />
    </>
  );
}