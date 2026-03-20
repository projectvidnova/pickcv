import { useState } from 'react';
import OptimizeModal from '../../../components/feature/OptimizeModal';

const steps = [
  {
    number: '01',
    icon: 'ri-briefcase-4-line',
    title: 'Applying for a New Job?',
    description: 'Upload your resume + paste the job description. Our AI tailors keywords, tone, and formatting to that specific role.',
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    illustration: 'brain',
  },
  {
    number: '02',
    icon: 'ri-refresh-line',
    title: 'Switching Careers?',
    description: 'We highlight transferable skills and rewrite your experience to match your new target industry.',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    illustration: 'target',
  },
  {
    number: '03',
    icon: 'ri-graduation-cap-line',
    title: 'Fresh Graduate?',
    description: 'Turn projects, internships, and coursework into professional ATS-ready bullet points that recruiters notice.',
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    illustration: 'course',
  },
];

export default function HowItWorks() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);

  return (
    <>
    <section id="how-it-works" className="py-16 lg:py-24 relative overflow-hidden mesh-bg-subtle">
      <div className="orb orb-teal absolute top-20 left-10 w-72 h-72 pointer-events-none"></div>
      <div className="orb orb-emerald absolute bottom-20 right-10 w-96 h-96 pointer-events-none"></div>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6">
            <i className="ri-user-star-fill text-amber-500"></i>
            Built For You
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            No Matter Where You Are in Your{' '}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Career
            </span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Whether you're a fresher, mid-career pro, or career switcher — PickCV adapts to your stage.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto perspective-1000">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group"
              onMouseEnter={() => setHoveredStep(index)}
              onMouseLeave={() => setHoveredStep(null)}
              style={{ transform: hoveredStep === index ? 'translateZ(20px)' : 'translateZ(0)', transition: 'transform 0.5s ease' }}
            >
              <div 
                className="relative glass-card rounded-3xl p-8 transition-all duration-500 preserve-3d h-full"
                style={{
                  transform: hoveredStep === index ? 'rotateX(5deg) rotateY(-5deg) translateY(-12px)' : 'rotateX(0deg) rotateY(0deg) translateY(0)',
                  boxShadow: hoveredStep === index ? '0 30px 60px -15px rgba(13,148,136,0.18), 0 20px 40px -10px rgba(0,0,0,0.08)' : undefined,
                }}
              >
                {/* Step Number Badge */}
                <div 
                  className={`absolute -top-6 left-8 w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center text-xl font-bold shadow-2xl transition-all duration-500`}
                  style={{ transform: hoveredStep === index ? 'translateY(-8px) rotateZ(-5deg)' : 'translateY(0) rotateZ(0)' }}
                >
                  {step.number}
                </div>

                {/* Illustration */}
                <div className="mb-6 mt-4 relative h-40 flex items-center justify-center">
                  {step.illustration === 'brain' && (
                    <div className="relative w-36 h-36 transition-transform duration-500"
                      style={{ transform: hoveredStep === index ? 'translateZ(30px) scale(1.1)' : 'translateZ(0) scale(1)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full shadow-2xl flex items-center justify-center">
                        <i className="ri-brain-line text-5xl text-white"></i>
                      </div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-cyan-300 rounded-full shadow-lg animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-teal-300 rounded-full shadow-lg animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  )}
                  {step.illustration === 'target' && (
                    <div className="relative w-36 h-36 transition-transform duration-500"
                      style={{ transform: hoveredStep === index ? 'translateZ(30px) rotateZ(10deg)' : 'translateZ(0) rotateZ(0)' }}>
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-200/60"></div>
                      <div className="absolute inset-3 rounded-full border-4 border-emerald-300/60"></div>
                      <div className="absolute inset-6 rounded-full border-4 border-emerald-400/60"></div>
                      <div className="absolute inset-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl flex items-center justify-center">
                        <i className="ri-refresh-line text-3xl text-white"></i>
                      </div>
                      <div className="absolute -top-1 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl"
                        style={{ transform: hoveredStep === index ? 'translateZ(50px) translateY(-8px)' : 'translateZ(0)', transition: 'transform 0.5s ease' }}>
                        <i className="ri-check-line font-bold"></i>
                      </div>
                    </div>
                  )}
                  {step.illustration === 'course' && (
                    <div className="relative w-36 h-36 transition-transform duration-500"
                      style={{ transform: hoveredStep === index ? 'translateZ(30px) scale(1.05)' : 'translateZ(0) scale(1)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full shadow-2xl flex items-center justify-center">
                        <i className="ri-graduation-cap-line text-5xl text-white"></i>
                      </div>
                      <div className="absolute -right-2 top-1/3 w-10 h-10 rounded-xl shadow-xl flex items-center justify-center glass"
                        style={{ transform: hoveredStep === index ? 'translateZ(40px) rotate(10deg)' : 'translateZ(0)', transition: 'transform 0.5s ease' }}>
                        <i className="ri-bar-chart-line text-cyan-500 text-xl"></i>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{step.description}</p>
                </div>

                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 transition-opacity duration-500 -z-10 blur-xl`}
                  style={{ opacity: hoveredStep === index ? 0.12 : 0 }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => setIsOptimizeModalOpen(true)}
            className="px-10 py-5 rounded-2xl text-lg font-semibold bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-3 whitespace-nowrap"
          >
            <i className="ri-upload-cloud-2-line"></i>
            Upload Your Resume Now
            <i className="ri-arrow-right-line text-xl"></i>
          </button>
          <p className="text-sm text-gray-500 mt-4">
            <i className="ri-lock-unlock-line text-teal-500 mr-1"></i>
            No signup required • Results in 30 seconds
          </p>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
      `}</style>
    </section>

    <OptimizeModal isOpen={isOptimizeModalOpen} onClose={() => setIsOptimizeModalOpen(false)} />
    </>
  );
}