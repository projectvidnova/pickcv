import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold mb-6">
            <i className="ri-team-line" />
            About PickCV
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Empowering Every Job Seeker<br />
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              to Land Their Dream Job
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            We believe talent deserves opportunity — and a great resume is the bridge between the two.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Mission */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-teal-500/20">
              <i className="ri-rocket-2-line text-2xl text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To democratize career success by giving every job seeker — regardless of background, experience level, or location — access to intelligent, AI-powered tools that create professional, ATS-optimized resumes in minutes.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We're on a mission to eliminate the resume gap. No one should lose out on a job because they didn't know the right format or the right keywords. PickCV levels the playing field.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
              <i className="ri-eye-line text-2xl text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To become the world's most trusted career companion — a platform where building a resume, finding the right job, and preparing for interviews all happen seamlessly in one place.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We envision a future where AI doesn't replace the human touch in hiring — it enhances it. Where candidates present their authentic best selves, and recruiters find the perfect match faster.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent to-teal-50/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What We Stand For</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: 'ri-user-heart-line', title: 'People First', desc: 'Every feature we build starts with one question: does this genuinely help the job seeker?' },
              { icon: 'ri-shield-check-line', title: 'ATS Expertise', desc: 'We obsess over applicant tracking systems so our users don\'t have to. Every template is ATS-tested.' },
              { icon: 'ri-sparkling-2-line', title: 'AI with Integrity', desc: 'Our AI enhances your story — it never fabricates. Your experience, your words, amplified.' },
              { icon: 'ri-global-line', title: 'Accessible to All', desc: 'Great career tools shouldn\'t cost a fortune. We\'re building PickCV to be accessible to everyone, everywhere.' },
              { icon: 'ri-speed-line', title: 'Speed Matters', desc: 'Job hunting is stressful enough. We help you create a polished resume in minutes, not hours.' },
              { icon: 'ri-lock-line', title: 'Privacy & Trust', desc: 'Your data is yours. We never sell personal information or share resumes with third parties.' },
            ].map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-teal-200 transition-all">
                <i className={`${v.icon} text-2xl text-teal-600 mb-3 block`} />
                <h3 className="text-base font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            PickCV was born from a simple frustration: why is creating a good resume still so hard in 2026? We watched talented friends and family struggle with formatting, keyword optimization, and ATS rejections — losing out on jobs they were perfectly qualified for.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            So we built something better. Powered by Google's Gemini AI and designed with real recruiters' insights, PickCV transforms the way people create resumes. Upload your existing resume, paste a job description, and watch AI tailor your experience to match — all while keeping your authentic voice.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We're a small, passionate team at <span className="font-semibold text-gray-700">Bhoomer Digital Solutions Private Limited</span>, headquartered in Andhra Pradesh, India — building for the world.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
