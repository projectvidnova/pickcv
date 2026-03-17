import { useState } from 'react';
import OptimizeModal from '../../../components/feature/OptimizeModal';

const useCases = [
  {
    icon: 'ri-briefcase-4-line',
    title: 'Applying for a New Job?',
    description:
      'Upload your resume + paste the job description. Our AI tailors keywords, tone, and formatting to that specific role.',
    gradient: 'from-teal-500 to-teal-600',
    shadow: 'shadow-teal-500/30',
  },
  {
    icon: 'ri-refresh-line',
    title: 'Switching Careers?',
    description:
      'We highlight transferable skills and rewrite your experience to match your new target industry.',
    gradient: 'from-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-500/30',
  },
  {
    icon: 'ri-graduation-cap-line',
    title: 'Fresh Graduate?',
    description:
      'Turn projects, internships, and coursework into professional ATS-ready bullet points that recruiters notice.',
    gradient: 'from-cyan-500 to-cyan-600',
    shadow: 'shadow-cyan-500/30',
  },
];

export default function HowItWorks() {
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);

  return (
    <>
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-medium mb-4">
              <i className="ri-user-star-fill text-amber-500"></i>
              Built For You
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              No Matter Where You Are in Your{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Career
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're a fresher, mid-career pro, or career switcher — PickCV adapts to your stage.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((item, i) => (
              <div
                key={i}
                className="group glass-card rounded-2xl p-8 hover:scale-[1.02] transition-all duration-300 text-center"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mx-auto mb-5 shadow-lg ${item.shadow}`}
                >
                  <i className={`${item.icon} text-2xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <button
              onClick={() => setIsOptimizeModalOpen(true)}
              className="px-10 py-4 rounded-xl text-base font-semibold bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.01] transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <i className="ri-upload-cloud-2-line text-lg"></i>
              Upload Your Resume Now
              <i className="ri-arrow-right-line text-lg"></i>
            </button>
            <p className="text-sm text-gray-500 mt-3">
              <i className="ri-lock-unlock-line text-teal-500 mr-1"></i>
              No signup required • Results in 30 seconds
            </p>
          </div>
        </div>
      </section>
      <OptimizeModal isOpen={isOptimizeModalOpen} onClose={() => setIsOptimizeModalOpen(false)} />
    </>
  );
}
