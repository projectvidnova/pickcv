const steps = [
  {
    number: '01',
    icon: 'ri-school-line',
    title: 'Register your institution',
    description: 'Sign up as a placement officer. Provide college details, AICTE/UGC info, and verify via email. Admin reviews and approves within 24 hours.',
    highlights: ['Email verification', 'Admin-reviewed approval', 'Secure institutional access'],
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    number: '02',
    icon: 'ri-user-add-line',
    title: 'Onboard students',
    description: 'Bulk upload students via CSV or invite them individually. Each student gets AI-powered resume building, ATS scoring, and profile optimization tools automatically.',
    highlights: ['CSV bulk upload', 'AI resume builder for students', 'Automatic ATS scoring'],
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    number: '03',
    icon: 'ri-building-2-line',
    title: 'Connect with recruiters',
    description: "Verified recruiters browse your students' profiles, shortlist candidates, and schedule campus drives — all through the platform. You stay in control.",
    highlights: ['Verified recruiter access', 'Campus drive scheduling', 'Full placement tracking'],
    color: 'from-cyan-500 to-teal-500',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
  },
  {
    number: '04',
    icon: 'ri-trophy-line',
    title: 'Track & report placements',
    description: 'Monitor placement rates, average packages, branch-wise analytics, and generate reports for management and accreditation. Everything in real-time.',
    highlights: ['Real-time analytics', 'Exportable reports', 'Year-over-year comparison'],
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(13,148,136,0.2)_0%,_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.15)_0%,_transparent_50%)]"></div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <i className="ri-route-line"></i>
            How It Works
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
            Your digital placement cell
            <br />
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              in 4 simple steps
            </span>
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            From registration to reporting — it's designed to be simple for busy placement officers.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-sm hover:border-teal-500/30 transition-all duration-300 hover:-translate-y-1 relative">
                <div className="absolute -top-3 left-6">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-xs font-black shadow-lg`}>
                    {step.number}
                  </div>
                </div>

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} bg-opacity-20 flex items-center justify-center mt-3 mb-5`} style={{ background: `linear-gradient(135deg, rgba(13,148,136,0.15), rgba(16,185,129,0.15))` }}>
                  <i className={`${step.icon} text-teal-400 text-2xl`}></i>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">{step.description}</p>

                <ul className="space-y-2">
                  {step.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                        <i className="ri-check-line text-teal-400 text-[10px]"></i>
                      </div>
                      <span className="text-sm text-gray-400">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
