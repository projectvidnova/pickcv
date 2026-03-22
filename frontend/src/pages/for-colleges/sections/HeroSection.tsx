
type CollegeAction = 'register' | 'signin';

interface HeroSectionProps {
  onOpenComingSoon: (action: CollegeAction) => void;
}


export default function HeroSection({ onOpenComingSoon }: HeroSectionProps) {
  return (
    <section className="relative min-h-[95vh] flex items-center overflow-hidden mesh-bg">
      {/* Decorative orbs */}
      <div className="orb orb-teal absolute top-20 left-10 w-72 h-72 pointer-events-none" />
      <div className="orb orb-emerald absolute bottom-20 right-10 w-96 h-96 pointer-events-none" />
      <div className="orb orb-cyan absolute top-40 right-1/4 w-64 h-64 pointer-events-none" />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 animate-fade-in-up">
                <i className="ri-graduation-cap-line"></i>
                Pick Camp
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.08] animate-fade-in-up">
                Transform your
                <br />
                <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  placement cell
                </span>
                <br />
                with AI
              </h1>

              <p className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed animate-fade-in-up">
                Empower your students with AI-optimized resumes, verified recruiter access, and a complete campus placement management system — built for Indian institutions.
              </p>

              <div className="flex flex-wrap gap-4 mb-12 animate-fade-in-up">
                <button
                  onClick={() => onOpenComingSoon('register')}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold cursor-pointer whitespace-nowrap transition-all hover:scale-[1.02] bg-gradient-to-r from-teal-600 to-emerald-500 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 text-lg"
                >
                  <i className="ri-school-line"></i>
                  Register Your Institution
                </button>
                <button
                  onClick={() => onOpenComingSoon('signin')}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold cursor-pointer whitespace-nowrap transition-all glass hover:bg-white/80 text-gray-700 text-lg"
                >
                  Sign In
                  <i className="ri-arrow-right-line text-sm"></i>
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 animate-fade-in-up">
                {[
                  { icon: 'ri-shield-check-fill', color: 'text-green-500', text: 'Admin verified' },
                  { icon: 'ri-lock-line', color: 'text-teal-500', text: 'Student data privacy' },
                  { icon: 'ri-customer-service-2-line', color: 'text-emerald-500', text: 'Dedicated support' },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-500">
                    <i className={`${badge.icon} ${badge.color} text-lg`}></i>
                    <span className="text-sm font-medium">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right visual */}
            <div className="relative hidden lg:flex justify-center">
              <div className="relative">
                {/* Student profile cards floating */}
                <div className="glass-card rounded-3xl p-8 w-[380px] animate-float-slow">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">P</div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">Placement Dashboard</div>
                      <div className="text-sm text-gray-500">2024-25 Academic Year</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { label: 'Students', value: '1,247', color: 'text-teal-600' },
                      { label: 'Placed', value: '892', color: 'text-emerald-600' },
                      { label: 'Companies', value: '64', color: 'text-cyan-600' },
                      { label: 'Avg Package', value: '₹8.4L', color: 'text-green-600' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl p-3 glass text-center">
                        <div className={`text-xl font-extrabold ${stat.color} leading-none mb-1`}>{stat.value}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 rounded-xl p-3 bg-green-50 border border-green-100">
                    <i className="ri-line-chart-line text-green-500 text-lg"></i>
                    <span className="text-sm text-green-700 font-medium">71.5% placement rate — 12% ↑ from last year</span>
                  </div>
                </div>

                {/* Floating student card */}
                <div className="absolute -bottom-8 -left-12 glass-card rounded-2xl p-4 w-52 animate-float-delayed shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">AP</div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Aditi Patel</div>
                      <div className="text-[10px] text-gray-500">CSE · 3rd Year</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <span className="text-xs font-bold text-teal-600">92%</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Resume ATS Score</div>
                </div>

                {/* Floating recruiter card */}
                <div className="absolute -top-6 -right-10 glass-card rounded-2xl p-4 w-48 animate-float shadow-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-building-2-fill text-teal-500"></i>
                    <span className="text-xs font-bold text-gray-800">New Recruiter</span>
                  </div>
                  <div className="text-[10px] text-gray-600">Infosys just signed up for campus recruitment</div>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[9px] text-green-600 font-medium">Verified · Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 glass border-t border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: 'AI-Powered', label: 'Resume Builder', icon: 'ri-sparkling-line' },
            { value: '99%', label: 'ATS Compatibility', icon: 'ri-file-user-line' },
            { value: 'Verified', label: 'Recruiter Access', icon: 'ri-building-2-line' },
            { value: 'Real-Time', label: 'Placement Analytics', icon: 'ri-line-chart-line' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 flex items-center justify-center">
                <i className={`${stat.icon} text-teal-600 text-lg`}></i>
              </div>
              <div>
                <div className="text-xl font-extrabold text-gray-900 leading-none">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
