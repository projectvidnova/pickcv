import { useState } from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: 'ri-shield-check-line',
    title: 'ATS Optimized Resume',
    description: 'Ensure your resume passes Applicant Tracking Systems. Our AI checks formatting, keywords, and structure for maximum compatibility.',
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    large: true,
  },
  {
    icon: 'ri-compass-3-line',
    title: 'Personalized Job Recommendations',
    description: 'Get matched to jobs that fit your skills and experience perfectly. Our AI learns your preferences and suggests opportunities tailored just for you.',
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    large: false,
  },
  {
    icon: 'ri-file-list-3-line',
    title: 'Resume Customization for Every Job',
    description: 'Automatically tailor your resume for each job application. Our AI highlights relevant experience and skills to match specific job requirements.',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    large: false,
  },
  {
    icon: 'ri-bar-chart-box-line',
    title: 'Skill Gap Analysis + Course Suggestions',
    description: 'Identify missing skills for your target roles and get personalized course recommendations to bridge the gap and boost your candidacy.',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    large: false,
  },
  {
    icon: 'ri-kanban-view',
    title: 'Application Tracker',
    description: 'Organize your job search with a visual pipeline. Track applications, interviews, and follow-ups all in one place.',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
    large: false,
  },
];

export default function Features() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <section id="features" className="py-16 lg:py-24 relative overflow-hidden mesh-bg-subtle">
      {/* Orbs */}
      <div className="orb orb-teal absolute top-40 -left-20 w-96 h-96 pointer-events-none"></div>
      <div className="orb orb-emerald absolute bottom-20 -right-32 w-[500px] h-[500px] pointer-events-none"></div>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6">
            <i className="ri-star-line"></i>
            Everything You Need
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            All the tools you need to land your dream job, powered by AI
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto perspective-1000">
          {/* Large Feature Card - ATS Optimized */}
          <div 
            className="md:col-span-2 lg:col-span-1 lg:row-span-2 glass-card rounded-3xl p-10 transition-all duration-500 group preserve-3d relative overflow-hidden"
            onMouseEnter={() => setHoveredFeature(0)}
            onMouseLeave={() => setHoveredFeature(null)}
            style={{
              transform: hoveredFeature === 0 ? 'translateY(-12px) rotateX(2deg)' : 'translateY(0) rotateX(0)',
              boxShadow: hoveredFeature === 0 
                ? '0 30px 60px -15px rgba(13,148,136,0.18), inset 0 1px 0 rgba(255,255,255,1)' 
                : undefined,
            }}
          >
            <div className="h-full flex flex-col relative z-10">
              <div 
                className={`w-20 h-20 ${features[0].bgColor} rounded-2xl flex items-center justify-center mb-8 relative transition-all duration-500`}
                style={{ transform: hoveredFeature === 0 ? 'translateZ(40px) rotateZ(-5deg)' : 'translateZ(0) rotateZ(0)' }}
              >
                <i className={`${features[0].icon} ${features[0].iconColor} text-4xl`}></i>
                <div 
                  className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xl"
                  style={{ transform: hoveredFeature === 0 ? 'translateZ(50px) scale(1.1)' : 'translateZ(0) scale(1)', transition: 'transform 0.5s ease' }}
                >AI</div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">{features[0].title}</h3>
              <p className="text-gray-600 leading-relaxed mb-8 flex-1">{features[0].description}</p>
              
              <div className="rounded-2xl p-6 mt-auto relative overflow-hidden glass">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-200/20 to-transparent h-full transition-all duration-1000"
                  style={{ transform: hoveredFeature === 0 ? 'translateY(100%)' : 'translateY(-100%)' }}></div>
                <div className="space-y-3 relative z-10">
                  {[
                    { label: 'Format ✓' },
                    { label: 'Keywords ✓' },
                    { label: 'Structure ✓' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <i className="ri-check-line text-white text-sm font-bold"></i>
                      </div>
                      <div className="flex-1"><div className="h-2 bg-white/70 rounded-full w-full shadow-sm"></div></div>
                      <span className="text-xs text-green-600 font-semibold">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl p-3 shadow-sm" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)' }}>
                  <span className="text-sm font-semibold text-gray-700">ATS Score</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                      ))}
                    </div>
                    <span className="text-lg font-bold text-green-600">98%</span>
                  </div>
                </div>
              </div>
              
              <a href="#" className="mt-8 text-teal-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Try it now <i className="ri-arrow-right-line"></i>
              </a>
            </div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-500 opacity-0 transition-opacity duration-500 -z-10 blur-2xl"
              style={{ opacity: hoveredFeature === 0 ? 0.08 : 0 }}></div>
          </div>

          {/* Job Matching Card */}
          <div
            className="glass-card rounded-3xl p-8 transition-all duration-500 preserve-3d relative overflow-hidden group"
            onMouseEnter={() => setHoveredFeature(1)}
            onMouseLeave={() => setHoveredFeature(null)}
            style={{
              transform: hoveredFeature === 1 ? 'translateY(-8px) rotateX(3deg)' : 'translateY(0) rotateX(0)',
              boxShadow: hoveredFeature === 1 ? '0 25px 50px -12px rgba(13,148,136,0.16)' : undefined,
            }}
          >
            <div className={`w-16 h-16 ${features[1].bgColor} rounded-2xl flex items-center justify-center mb-6 relative transition-all duration-500`}
              style={{ transform: hoveredFeature === 1 ? 'translateZ(30px) rotateZ(180deg)' : 'translateZ(0) rotateZ(0)' }}>
              <i className={`${features[1].icon} ${features[1].iconColor} text-3xl`}></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{features[1].title}</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{features[1].description}</p>
            <div className="space-y-2">
              {[
                { title: 'Product Manager', match: 98, color: 'bg-green-500' },
                { title: 'Senior PM', match: 94, color: 'bg-green-400' },
                { title: 'PM Lead', match: 89, color: 'bg-cyan-400' },
              ].map((job, idx) => (
                <div key={idx} className="rounded-xl p-3 transition-all duration-300 glass"
                  style={{ transform: hoveredFeature === 1 ? `translateX(${idx * 4}px)` : 'translateX(0)', transitionDelay: `${idx * 50}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">{job.title}</span>
                    <span className="text-sm font-bold text-green-600">{job.match}%</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden">
                    <div className={`${job.color} h-full rounded-full transition-all duration-1000`}
                      style={{ width: hoveredFeature === 1 ? `${job.match}%` : '0%', transitionDelay: `${idx * 100}ms` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resume Customization Card */}
          <div
            className="glass-card rounded-3xl p-8 transition-all duration-500 preserve-3d relative overflow-hidden group"
            onMouseEnter={() => setHoveredFeature(2)}
            onMouseLeave={() => setHoveredFeature(null)}
            style={{
              transform: hoveredFeature === 2 ? 'translateY(-8px) rotateY(-3deg)' : 'translateY(0) rotateY(0)',
              boxShadow: hoveredFeature === 2 ? '0 25px 50px -12px rgba(13,148,136,0.16)' : undefined,
            }}
          >
            <div className={`w-16 h-16 ${features[2].bgColor} rounded-2xl flex items-center justify-center mb-6 transition-all duration-500`}
              style={{ transform: hoveredFeature === 2 ? 'translateZ(30px) scale(1.1)' : 'translateZ(0) scale(1)' }}>
              <i className={`${features[2].icon} ${features[2].iconColor} text-3xl`}></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{features[2].title}</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{features[2].description}</p>
            <div className="relative h-32">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="absolute rounded-xl border-2 border-green-200/60 p-3 w-full shadow-lg transition-all duration-500 glass"
                  style={{
                    transform: hoveredFeature === 2 ? `translateX(${idx * 12}px) translateY(${idx * 12}px) rotateZ(${idx * 2}deg)` : 'translateX(0) translateY(0) rotateZ(0)',
                    zIndex: 3 - idx,
                    opacity: hoveredFeature === 2 ? 1 : idx === 0 ? 1 : 0.3,
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="h-1.5 bg-green-200/60 rounded-full flex-1"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1 bg-white/60 rounded-full w-3/4"></div>
                    <div className="h-1 bg-white/60 rounded-full w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Gap Analysis Card */}
          <div
            className="glass-card rounded-3xl p-8 transition-all duration-500 preserve-3d relative overflow-hidden group"
            onMouseEnter={() => setHoveredFeature(3)}
            onMouseLeave={() => setHoveredFeature(null)}
            style={{
              transform: hoveredFeature === 3 ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredFeature === 3 ? '0 25px 50px -12px rgba(13,148,136,0.16)' : undefined,
            }}
          >
            <div className={`w-16 h-16 ${features[3].bgColor} rounded-2xl flex items-center justify-center mb-6 transition-all duration-500`}
              style={{ transform: hoveredFeature === 3 ? 'translateZ(30px) rotateY(15deg)' : 'translateZ(0) rotateY(0)' }}>
              <i className={`${features[3].icon} ${features[3].iconColor} text-3xl`}></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{features[3].title}</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{features[3].description}</p>
            <div className="space-y-3">
              {[
                { skill: 'Product Strategy', level: 85, needed: 95, color: 'bg-amber-500' },
                { skill: 'Data Analytics', level: 60, needed: 90, color: 'bg-orange-500' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-700">{item.skill}</span>
                    <span className="text-xs text-gray-500">{item.level}% → {item.needed}%</span>
                  </div>
                  <div className="relative w-full bg-white/50 rounded-full h-2 overflow-hidden">
                    <div className={`${item.color} h-full rounded-full transition-all duration-1000`}
                      style={{ width: hoveredFeature === 3 ? `${item.level}%` : '0%', transitionDelay: `${idx * 100}ms` }}></div>
                    <div className="absolute top-0 h-full w-0.5 bg-green-500" style={{ left: `${item.needed}%` }}>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  {hoveredFeature === 3 && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                      <i className="ri-graduation-cap-line"></i><span>Course available</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Application Tracker Card */}
          <div
            className="glass-card rounded-3xl p-8 transition-all duration-500 preserve-3d relative overflow-hidden group"
            onMouseEnter={() => setHoveredFeature(4)}
            onMouseLeave={() => setHoveredFeature(null)}
            style={{
              transform: hoveredFeature === 4 ? 'translateY(-8px) rotateX(-3deg)' : 'translateY(0) rotateX(0)',
              boxShadow: hoveredFeature === 4 ? '0 25px 50px -12px rgba(13,148,136,0.16)' : undefined,
            }}
          >
            <div className={`w-16 h-16 ${features[4].bgColor} rounded-2xl flex items-center justify-center mb-6 transition-all duration-500`}
              style={{ transform: hoveredFeature === 4 ? 'translateZ(30px) rotateZ(-10deg)' : 'translateZ(0) rotateZ(0)' }}>
              <i className={`${features[4].icon} ${features[4].iconColor} text-3xl`}></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{features[4].title}</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{features[4].description}</p>
            <div className="flex gap-2">
              {[
                { label: 'Applied', count: 12, color: 'bg-gray-400' },
                { label: 'Interview', count: 5, color: 'bg-teal-400' },
                { label: 'Offer', count: 2, color: 'bg-emerald-500' },
              ].map((stage, idx) => (
                <div key={idx} className="flex-1 transition-all duration-500"
                  style={{ transform: hoveredFeature === 4 ? `translateY(-${idx * 4}px)` : 'translateY(0)', transitionDelay: `${idx * 100}ms` }}>
                  <div className={`${stage.color} rounded-lg p-3 text-white`}>
                    <div className="text-2xl font-bold mb-1">{stage.count}</div>
                    <div className="text-xs opacity-90">{stage.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">Ready to transform your job search?</p>
          <Link to="/onboarding" className="bg-gray-900 text-white px-10 py-5 rounded-2xl text-lg font-semibold hover:bg-gray-800 transition-all hover:scale-105 flex items-center justify-center gap-3 mx-auto whitespace-nowrap shadow-2xl shadow-gray-900/20 w-fit">
            Get Started Free
            <i className="ri-arrow-right-line text-xl"></i>
          </Link>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
      `}</style>
    </section>
  );
}
