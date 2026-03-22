import { useState } from 'react';

const stats = [
  { value: 'AI-Powered', label: 'Resume Screening' },
  { value: '99%', label: 'ATS Accuracy' },
  { value: '4.2x', label: 'Faster Time-to-Hire' },
  { value: '< 24h', label: 'Company Approval' },
];

export default function HeroSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    { icon: 'ri-briefcase-4-line', text: 'Smart Job Management', color: 'from-teal-500 to-teal-600' },
    { icon: 'ri-kanban-view', text: 'Application Pipeline', color: 'from-emerald-500 to-emerald-600' },
    { icon: 'ri-calendar-schedule-line', text: 'Multi-Round Interviews', color: 'from-cyan-500 to-teal-500' },
    { icon: 'ri-file-text-line', text: 'Digital Offer Letters', color: 'from-green-500 to-emerald-600' },
  ];

  return (
    <>
      <style>{`
        @keyframes floatA { 0%, 100% { transform: translateY(0px) rotate(-1.5deg); } 50% { transform: translateY(-14px) rotate(-1.5deg); } }
        @keyframes floatB { 0%, 100% { transform: translateY(0px) rotate(2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
        @keyframes floatC { 0%, 100% { transform: translateY(0px) rotate(-0.5deg); } 50% { transform: translateY(-18px) rotate(-0.5deg); } }
        .card-float-a { animation: floatA 7s ease-in-out infinite; }
        .card-float-b { animation: floatB 5.5s ease-in-out 0.8s infinite; }
        .card-float-c { animation: floatC 6.5s ease-in-out 1.6s infinite; }
      `}</style>

      <section className="relative min-h-screen pt-20 lg:pt-0 overflow-hidden mesh-bg">
        <div className="orb orb-teal absolute top-24 left-8 w-96 h-96 pointer-events-none" />
        <div className="orb orb-emerald absolute bottom-16 right-8 w-[480px] h-[480px] pointer-events-none" />
        <div className="orb orb-cyan absolute top-1/2 left-1/2 -translate-x-1/2 w-72 h-72 pointer-events-none" />

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="min-h-screen flex items-center py-20 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center w-full max-w-7xl mx-auto">

              {/* Left Content */}
              <div className="max-w-2xl lg:pr-4">
                <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-medium mb-8">
                  <i className="ri-building-2-line text-teal-500"></i>
                  Full-cycle AI recruitment platform
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
                  Hire Smarter.
                  <br />
                  <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                    Hire Faster.
                  </span>
                  <br />
                  Hire Better.
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
                  From job posting to offer letter — PickCV is the AI-powered recruitment platform that finds, screens, and hires top talent in record time.
                </p>

                <div className="glass-card rounded-2xl p-5 mb-7">
                  <div className="grid grid-cols-2 gap-3">
                    {features.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveFeature(idx)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all duration-300 ${activeFeature === idx ? 'bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/60' : 'hover:bg-white/60'}`}
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-base shrink-0`}>
                          <i className={item.icon}></i>
                        </div>
                        <span className={`text-sm font-semibold leading-tight ${activeFeature === idx ? 'text-teal-700' : 'text-gray-700'}`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-8">
                  <button
                    onClick={() => alert('🚀 Coming Soon! We\'re building something amazing for recruiters. Stay tuned!')}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white text-sm font-semibold whitespace-nowrap cursor-pointer transition-all hover:scale-[1.02] bg-gradient-to-r from-teal-600 to-emerald-500 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
                  >
                    <i className="ri-building-2-line"></i>
                    Register Your Company
                  </button>
                  <button
                    onClick={() => alert('🚀 Coming Soon! We\'re building something amazing for recruiters. Stay tuned!')}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold whitespace-nowrap cursor-pointer transition-all glass hover:bg-white/80 text-gray-700"
                  >
                    Sign In
                    <i className="ri-arrow-right-line text-xs"></i>
                  </button>
                </div>

                <div className="flex items-center flex-wrap gap-6">
                  {[
                    { icon: 'ri-flashlight-fill', color: 'text-amber-500', text: '4.2x faster hiring' },
                    { icon: 'ri-robot-2-line', color: 'text-teal-500', text: 'AI-matched candidates' },
                    { icon: 'ri-shield-check-fill', color: 'text-green-500', text: 'Verified talent pool' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-600">
                      <i className={`${s.icon} ${s.color} text-lg`}></i>
                      <span className="text-sm font-medium">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Visual */}
              <div className="relative hidden lg:flex flex-col items-center justify-center min-h-[580px]">

                {/* Main pipeline card */}
                <div className="relative glass-card rounded-3xl p-7 w-[360px] z-20 card-float-a">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Application Pipeline</div>
                      <div className="text-base font-bold text-gray-900">Senior Frontend Engineer</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shrink-0">
                      <i className="ri-kanban-view text-lg"></i>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { stage: 'Applied', count: 84, color: 'bg-gray-400' },
                      { stage: 'Interview', count: 12, color: 'bg-teal-500' },
                      { stage: 'Offered', count: 3, color: 'bg-emerald-500' },
                    ].map((col) => (
                      <div key={col.stage} className="rounded-xl p-3 glass text-center">
                        <div className={`w-2 h-2 rounded-full ${col.color} mx-auto mb-2`}></div>
                        <div className="text-2xl font-extrabold text-gray-900 leading-none">{col.count}</div>
                        <div className="text-[10px] text-gray-500 mt-1 font-medium">{col.stage}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: 'Arjun Kapoor', role: 'React · Node', ats: 94 },
                      { name: 'Sneha Reddy', role: 'TypeScript · AWS', ats: 91 },
                    ].map((c) => (
                      <div key={c.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5 glass">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{c.name[0]}</div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-gray-900">{c.name}</div>
                          <div className="text-[10px] text-gray-500">{c.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-teal-600">{c.ats}%</div>
                          <div className="text-[10px] text-gray-400">ATS</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="absolute -top-3 -right-4 bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5">
                    <i className="ri-robot-2-line"></i>AI Ranked
                  </div>
                </div>

                {/* ATS score card */}
                <div className="absolute top-4 -right-8 glass-card rounded-2xl p-5 w-[210px] z-10 card-float-b">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm">
                      <i className="ri-sparkling-fill"></i>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">AI ATS Score</div>
                      <div className="text-[11px] text-gray-500">Priya Nair · SWE</div>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <div className="text-4xl font-extrabold text-gray-900 leading-none">96</div>
                    <div className="text-sm font-bold text-green-500 mb-1">/ 100</div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Keywords', score: 98, color: 'bg-emerald-500' },
                      { label: 'Format', score: 95, color: 'bg-teal-500' },
                      { label: 'Skills Match', score: 92, color: 'bg-green-500' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 w-16 shrink-0">{item.label}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.score}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-600">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Offer sent card */}
                <div className="absolute -bottom-2 -left-8 glass-card rounded-2xl p-5 w-[230px] z-10 card-float-c">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm">
                      <i className="ri-file-text-line"></i>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Offer Letter Sent</div>
                      <div className="text-[11px] text-gray-500">Rahul Verma · FullStack</div>
                    </div>
                  </div>
                  <div className="rounded-xl p-3 bg-green-50 border border-green-100 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="ri-check-double-line text-green-500 text-sm"></i>
                      <span className="text-xs font-bold text-green-700">Offer Accepted</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">₹18 LPA</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Start: 1st April, 2025</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">R</div>
                    <div className="flex-1">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                      </div>
                    </div>
                    <i className="ri-check-line text-green-500 text-sm"></i>
                  </div>
                </div>

                <div className="absolute top-1/4 -left-16 w-40 h-40 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 -right-16 w-48 h-48 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
              </div>

            </div>
          </div>
        </div>

        {/* Stat bar */}
        <div className="relative z-10 border-t border-white/50 bg-white/30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 flex items-center justify-center divide-x divide-white/50">
            {stats.map((s) => (
              <div key={s.label} className="px-10 text-center">
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
