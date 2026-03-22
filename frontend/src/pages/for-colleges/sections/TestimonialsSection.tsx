const testimonials = [
  {
    quote: "Before PickCV, our placement process was entirely manual — spreadsheets, emails, and chaos. Now everything is centralized, students build AI-optimized resumes, and recruiters come to us.",
    name: "Early Adopter",
    title: "Placement Director, Private Engineering College",
    initials: "EA",
    stat: "100%",
    statLabel: "digital placement cell",
  },
  {
    quote: "The bulk student onboarding via CSV saved us weeks of work. The AI ATS scoring ensures our students' resumes are competitive before they even apply. It's a complete game-changer.",
    name: "Beta User",
    title: "TPO, Autonomous University",
    initials: "BU",
    stat: "10x",
    statLabel: "faster onboarding",
  },
  {
    quote: "Recruiters love the verified student profiles. Our campus drives went from chaotic to seamless. The analytics dashboard helps me present data to management in minutes, not days.",
    name: "Early Adopter",
    title: "Placement Coordinator, Tier-1 Institute",
    initials: "EA",
    stat: "Zero",
    statLabel: "spreadsheets needed",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden mesh-bg-subtle">
      <div className="orb orb-emerald absolute bottom-0 -left-32 w-[450px] h-[450px] pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6">
            <i className="ri-double-quotes-l"></i>
            Trusted by Institutions
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
            What early adopters say
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Institutions already transforming their placement process with PickCV.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-7 max-w-7xl mx-auto">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass-card rounded-3xl p-8 flex flex-col">
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="ri-star-fill text-amber-400 text-sm"></i>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-6 flex-1 italic">&ldquo;{t.quote}&rdquo;</p>

              <div className="pt-5 border-t border-white/60">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 glass">
                  <span className="text-xl font-extrabold text-teal-600 leading-none">{t.stat}</span>
                  <span className="text-xs text-gray-500">{t.statLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
