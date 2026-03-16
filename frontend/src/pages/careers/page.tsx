import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-6">
            <i className="ri-briefcase-line" />
            Careers at PickCV
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Build the Future of<br />
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Career Technology
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            We're on a mission to help millions of job seekers worldwide. Want to be part of the journey?
          </p>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mx-auto mb-6">
              <i className="ri-time-line text-4xl text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">We're Growing — Stay Tuned!</h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              We're a small but mighty team right now, and we're getting ready to expand. Keep watching this space — exciting roles in <span className="font-semibold text-gray-700">engineering, design, AI/ML, and marketing</span> are coming soon.
            </p>
            <div className="h-px bg-gray-100 mb-6" />
            <h3 className="text-sm font-bold text-gray-700 mb-4">What it's like to work with us</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              {[
                { icon: 'ri-remote-control-line', title: 'Remote-First', desc: 'Work from anywhere in India. We believe in outcomes, not office hours.' },
                { icon: 'ri-rocket-2-line', title: 'Early-Stage Impact', desc: 'Join early. Shape the product, the culture, and the company from the ground up.' },
                { icon: 'ri-brain-line', title: 'Cutting-Edge AI', desc: 'Work with the latest AI models — Gemini, LLMs, and more. Ship real AI products.' },
                { icon: 'ri-heart-pulse-line', title: 'People-First Culture', desc: 'Flexible hours, learning budgets, and a team that genuinely cares.' },
              ].map((p, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50">
                  <i className={`${p.icon} text-lg text-teal-600 mt-0.5 flex-shrink-0`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-px bg-gray-100 my-6" />
            <p className="text-sm text-gray-500">
              Can't wait? Drop us a line at{' '}
              <a href="mailto:connect@pickcv.com" className="text-teal-600 font-semibold hover:underline">
                connect@pickcv.com
              </a>{' '}
              — we'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
