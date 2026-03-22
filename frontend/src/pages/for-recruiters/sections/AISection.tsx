const comingSoon = [
  { icon: 'ri-sort-desc', title: 'AI Candidate Ranking', desc: 'Auto-rank applicants by job-fit using semantic matching.' },
  { icon: 'ri-user-search-line', title: 'Smart Candidate Matching', desc: 'AI recommends top candidates from talent pool for each job.' },
  { icon: 'ri-file-edit-line', title: 'AI JD Generator', desc: 'Generate complete job descriptions from just a job title.' },
  { icon: 'ri-questionnaire-line', title: 'Interview Question AI', desc: "Auto-generate role-specific questions from JD + resume." },
  { icon: 'ri-lightbulb-flash-line', title: 'AI Screening Insights', desc: "AI summary of each candidate's strengths, weaknesses, and fit." },
  { icon: 'ri-funds-line', title: 'Salary Benchmarking AI', desc: 'Market-based salary suggestions powered by AI data.' },
  { icon: 'ri-time-line', title: 'Predictive Hiring Analytics', desc: 'Time-to-hire predictions and bottleneck identification.' },
  { icon: 'ri-mail-ai-line', title: 'Automated Communication', desc: 'AI-drafted personalized emails for each pipeline stage.' },
];

export default function AISection() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(13,148,136,0.2)_0%,_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.15)_0%,_transparent_50%)]"></div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <i className="ri-robot-2-line"></i>
            AI-Powered Recruitment
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
            Intelligence that works
            <br />
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              while you sleep
            </span>
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            Every candidate is scored, ranked, and analyzed by Gemini AI — so you spend time on people, not paperwork.
          </p>
        </div>

        <div className="max-w-7xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-400 text-center mb-8">Live Now</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: 'ri-sparkling-fill',
                title: 'AI ATS Score',
                desc: "Every candidate's resume is analyzed by Gemini AI and scored for ATS compatibility. See the score instantly in your pipeline.",
                color: 'from-teal-500 to-teal-600',
                stat: '96',
                statLabel: 'avg ATS score',
              },
              {
                icon: 'ri-search-eye-line',
                title: 'Keyword Match Analysis',
                desc: 'AI identifies missing keywords and skill gaps in candidate resumes compared to your job description.',
                color: 'from-emerald-500 to-emerald-600',
                stat: '12',
                statLabel: 'keywords matched',
              },
              {
                icon: 'ri-magic-line',
                title: 'Resume Optimization Engine',
                desc: 'Candidates optimize their resumes against your JD using AI — meaning you receive better-matched applications automatically.',
                color: 'from-cyan-500 to-teal-500',
                stat: '4.2x',
                statLabel: 'better match rate',
              },
            ].map((f, idx) => (
              <div key={idx} className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-sm hover:border-teal-500/30 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white text-2xl mb-5`}>
                  <i className={f.icon}></i>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <div className="text-3xl font-extrabold text-white leading-none">{f.stat}</div>
                  <div className="text-sm text-gray-400 mb-0.5">{f.statLabel}</div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 text-center mb-8">Coming Soon</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {comingSoon.map((item, idx) => (
              <div key={idx} className="rounded-2xl p-5 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 relative group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-gray-400 text-lg shrink-0 group-hover:from-teal-600/30 group-hover:to-emerald-600/30 group-hover:text-teal-400 transition-all duration-300">
                    <i className={item.icon}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-bold text-white leading-tight">{item.title}</h4>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/20 whitespace-nowrap shrink-0">Soon</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
