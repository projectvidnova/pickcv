const steps = [
  {
    number: '01',
    icon: 'ri-upload-cloud-2-line',
    title: 'Upload Resume',
    description: 'Drop your existing resume (PDF or DOCX). No signup needed to get started.',
    gradient: 'from-teal-500 to-teal-600',
    shadow: 'shadow-teal-500/30',
  },
  {
    number: '02',
    icon: 'ri-radar-line',
    title: 'ATS Detection',
    description: 'Our AI scans for ATS compatibility issues, missing keywords, and format problems.',
    gradient: 'from-cyan-500 to-cyan-600',
    shadow: 'shadow-cyan-500/30',
  },
  {
    number: '03',
    icon: 'ri-key-2-line',
    title: 'Keyword Injection',
    description: '6–12 high-impact keywords are woven naturally into your resume content.',
    gradient: 'from-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-500/30',
  },
  {
    number: '04',
    icon: 'ri-magic-line',
    title: 'Resume Optimization',
    description: 'Bullets are rewritten with achievement-driven language and quantified impact.',
    gradient: 'from-green-500 to-green-600',
    shadow: 'shadow-green-500/30',
  },
  {
    number: '05',
    icon: 'ri-bar-chart-fill',
    title: 'ATS Scoring',
    description: 'A real-time score shows exactly how your resume performs against ATS filters.',
    gradient: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/30',
  },
  {
    number: '06',
    icon: 'ri-download-cloud-2-line',
    title: 'Download Optimized Resume',
    description: 'Get your ATS-ready resume in seconds — formatted, optimized, and interview-ready.',
    gradient: 'from-orange-500 to-red-500',
    shadow: 'shadow-orange-500/30',
  },
];

export default function OptimisationProcess() {
  return (
    <section id="how-it-works" className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-medium mb-4">
            <i className="ri-flashlight-fill text-amber-500"></i>
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            6 AI Steps That{' '}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Transform Your Resume
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From upload to optimized — our AI handles everything in under 30 seconds.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group glass-card rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 relative"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shrink-0 shadow-lg ${step.shadow}`}
                >
                  <i className={`${step.icon} text-xl`}></i>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Step {step.number}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                    {step.title}
                  </h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed pl-16">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
