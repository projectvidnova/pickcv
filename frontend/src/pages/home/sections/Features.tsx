const featureBlocks = [
  {
    category: 'Resume Intelligence',
    icon: 'ri-file-text-line',
    gradient: 'from-teal-500 to-teal-600',
    shadow: 'shadow-teal-500/30',
    features: [
      {
        icon: 'ri-bar-chart-fill',
        title: 'ATS Optimization',
        description: 'Real-time scoring against applicant tracking systems used by 98% of Fortune 500 companies.',
      },
      {
        icon: 'ri-key-2-fill',
        title: 'Keyword Injection',
        description: '6–12 role-specific keywords woven naturally into your resume — no keyword stuffing.',
      },
      {
        icon: 'ri-shield-star-fill',
        title: 'Resume Quality Score',
        description: 'Comprehensive analysis of formatting, impact language, and content completeness.',
      },
    ],
  },
  {
    category: 'Talent Signals',
    icon: 'ri-user-star-line',
    gradient: 'from-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-500/30',
    features: [
      {
        icon: 'ri-lightbulb-flash-fill',
        title: 'Skill Extraction',
        description: 'AI identifies and highlights both hard and soft skills from your experience.',
      },
      {
        icon: 'ri-compass-3-fill',
        title: 'Role Readiness',
        description: 'See exactly how prepared you are for your target role with gap analysis.',
      },
      {
        icon: 'ri-star-fill',
        title: 'Candidate Scoring',
        description: 'Know where you stand before recruiters do — actionable score breakdown.',
      },
    ],
  },
  {
    category: 'Career Engine',
    icon: 'ri-rocket-2-line',
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/30',
    features: [
      {
        icon: 'ri-search-eye-fill',
        title: 'Job Matching',
        description: 'AI-powered job recommendations based on your skills, experience, and preferences.',
      },
      {
        icon: 'ri-todo-fill',
        title: 'Application Tracker',
        description: 'Keep track of every application, interview, and follow-up in one place.',
      },
      {
        icon: 'ri-sparkling-fill',
        title: 'Personalized Tips',
        description: 'Get tailored recommendations to continuously improve your career profile.',
      },
    ],
  },
];

export default function Features() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-medium mb-4">
            <i className="ri-stack-fill text-amber-500"></i>
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Get Hired Faster
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three powerful modules. One mission — get you past ATS and into interviews.
          </p>
        </div>

        {/* Feature Blocks */}
        <div className="space-y-16">
          {featureBlocks.map((block, idx) => (
            <div key={idx}>
              {/* Block Header */}
              <div className="flex items-center gap-3 mb-8">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${block.gradient} flex items-center justify-center text-white shadow-lg ${block.shadow}`}
                >
                  <i className={`${block.icon} text-lg`}></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{block.category}</h3>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {block.features.map((feature, j) => (
                  <div
                    key={j}
                    className="group glass-card rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center text-teal-600 mb-4">
                      <i className={`${feature.icon} text-xl`}></i>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
