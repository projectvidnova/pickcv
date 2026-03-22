const steps = [
  {
    number: '01',
    icon: 'ri-building-2-line',
    title: 'Register your company',
    description: 'Two-step registration — personal details, then company details. Email verification and admin review within 24 hours. Welcome email with full access upon approval.',
    highlights: ['Email verification', 'Admin-reviewed approval', 'Access within 24 hours'],
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    number: '02',
    icon: 'ri-briefcase-4-line',
    title: 'Post jobs & get AI-matched candidates',
    description: "Create detailed job postings in minutes. Our AI instantly scores and ranks candidates from PickCV's talent pool, surfacing the best fits directly to your pipeline.",
    highlights: ['Instant AI candidate ranking', 'ATS score per applicant', 'Real-time application tracking'],
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    number: '03',
    icon: 'ri-trophy-line',
    title: 'Interview, offer, and hire',
    description: 'Coordinate multi-round interviews, collect structured feedback, and release digital offer letters — all from one platform. Candidates accept directly. Done.',
    highlights: ['Multi-round interview scheduling', 'Digital offer letters', 'Hire tracking & analytics'],
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden mesh-bg-subtle">
      <div className="orb orb-teal absolute top-20 -right-24 w-80 h-80 pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6">
            <i className="ri-route-line"></i>
            How It Works
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
            Up and running in 3 steps
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            From signup to your first hire — the process is intentionally simple.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-200 via-emerald-200 to-green-200 z-0 mx-20"></div>

            <div className="grid lg:grid-cols-3 gap-8 relative z-10">
              {steps.map((step, idx) => (
                <div key={idx} className="glass-card rounded-3xl p-8 relative">
                  <div className="absolute -top-4 left-8">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-xs font-black shadow-lg`}>
                      {step.number}
                    </div>
                  </div>

                  <div className={`w-16 h-16 ${step.bgColor} rounded-2xl flex items-center justify-center mt-4 mb-6`}>
                    <i className={`${step.icon} ${step.iconColor} text-3xl`}></i>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-5">{step.description}</p>

                  <ul className="space-y-2">
                    {step.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full ${step.bgColor} flex items-center justify-center shrink-0`}>
                          <i className={`ri-check-line ${step.iconColor} text-xs`}></i>
                        </div>
                        <span className="text-sm text-gray-600">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
