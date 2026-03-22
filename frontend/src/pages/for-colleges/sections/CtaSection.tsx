

export default function CtaSection() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden mesh-bg-subtle">
      <div className="orb orb-teal absolute top-10 right-20 w-80 h-80 pointer-events-none" />
      <div className="orb orb-emerald absolute bottom-10 left-20 w-80 h-80 pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-12 lg:p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-8 shadow-xl shadow-teal-500/25">
              <i className="ri-graduation-cap-line"></i>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 tracking-tight">
              Are you ready foran AI Native
              <br />
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                placement cell?
              </span>
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed mb-10 max-w-xl mx-auto">
              Join institutions across India using PickCV to streamline campus placements, empower students, and connect with verified recruiters.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-10">
              <button
                onClick={() => alert('🚀 Coming Soon! We\'re building something amazing for colleges. Stay tuned!')}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold whitespace-nowrap cursor-pointer transition-all hover:scale-[1.02] bg-gradient-to-r from-teal-600 to-emerald-500 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 text-base"
              >
                <i className="ri-school-line"></i>
                Register Your Institution
              </button>
              <button
                onClick={() => alert('🚀 Coming Soon! We\'re building something amazing for colleges. Stay tuned!')}
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-all glass hover:bg-white/80 text-gray-700 text-base"
              >
                Sign In
                <i className="ri-arrow-right-line text-sm"></i>
              </button>
            </div>

            <div className="flex items-center justify-center flex-wrap gap-8">
              {[
                { icon: 'ri-shield-check-fill', color: 'text-green-500', text: 'Admin-verified in < 24h' },
                { icon: 'ri-user-star-line', color: 'text-teal-500', text: 'Unlimited students' },
                { icon: 'ri-customer-service-2-line', color: 'text-emerald-500', text: 'Dedicated support' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-500">
                  <i className={`${item.icon} ${item.color} text-lg`}></i>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
