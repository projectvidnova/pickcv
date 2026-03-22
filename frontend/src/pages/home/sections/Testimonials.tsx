import { useState } from 'react';

const faqs = [
  {
    question: 'Can I create resumes for different jobs?',
    answer: 'Yes! Upload the same resume with different job descriptions and PickCV will tailor keywords, tone, and formatting for each specific role. Optimize once, apply everywhere.',
    icon: 'ri-file-list-3-line',
  },
  {
    question: 'How accurate is the ATS matching?',
    answer: 'Our AI analyzes your resume against the same algorithms used by top ATS platforms like Workday, Greenhouse, and Lever. Users typically see scores improve from 30–40% to 85–94% after optimization.',
    icon: 'ri-shield-check-line',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We are DPDP (Digital Personal Data Protection) compliant. Your resume data is encrypted in transit and at rest. We never share your personal information with third parties.',
    icon: 'ri-lock-line',
  },
  {
    question: 'Is there a free plan?',
    answer: 'Yes — you can upload and get your ATS score for free, no signup required. Our premium plan unlocks full optimization, talent signal conversion, and unlimited downloads.',
    icon: 'ri-gift-line',
  },
  {
    question: 'What does the ATS score mean?',
    answer: "Your ATS score represents how likely your resume is to pass through automated filters. Below 60% means most ATS systems will reject it. Above 80% means you're likely to reach a human recruiter. We aim for 90%+.",
    icon: 'ri-bar-chart-box-line',
  },
  {
    question: 'Does the AI change my actual experience?',
    answer: 'Never. PickCV does not fabricate experience or add false information. We only optimize how your real experience is presented — better keywords, stronger action verbs, and clearer quantified impact.',
    icon: 'ri-robot-2-line',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 lg:py-24 relative overflow-hidden mesh-bg-subtle">
      <div className="orb orb-teal absolute top-20 right-10 w-80 h-80 pointer-events-none"></div>
      <div className="orb orb-emerald absolute bottom-20 left-10 w-96 h-96 pointer-events-none"></div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
            <i className="ri-question-answer-line text-teal-600"></i>
            Got Questions?
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-5">
            Frequently Asked
            <span className="block bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-gray-500">
            Everything you need to know about PickCV.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="max-w-4xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'glass-strong shadow-md'
                    : 'glass hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-300 ${
                    isOpen ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg' : 'text-gray-500'
                  }`}
                  style={!isOpen ? { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.7)' } : {}}>
                    <i className={`${faq.icon} text-lg`}></i>
                  </div>

                  <span className={`flex-1 text-base font-semibold transition-colors duration-200 ${
                    isOpen ? 'text-teal-700' : 'text-gray-800'
                  }`}>
                    {faq.question}
                  </span>

                  <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-300 ${
                    isOpen ? 'bg-teal-100 text-teal-600 rotate-180' : 'text-gray-400'
                  }`}
                  style={!isOpen ? { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' } : {}}>
                    <i className="ri-arrow-down-s-line text-xl"></i>
                  </div>
                </button>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-6 pb-6 pl-20 text-gray-600 leading-relaxed text-sm">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <div className="inline-flex flex-col items-center gap-4 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-3xl px-12 py-10 shadow-2xl shadow-teal-200">
            <p className="text-white text-xl font-semibold">Still have questions?</p>
            <p className="text-teal-100 text-sm max-w-sm text-center">
              Our team is happy to walk you through everything. No pressure, no sales pitch.
            </p>
            <a
              href="mailto:hello@pickcv.com"
              className="font-semibold px-8 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap shadow-md glass-strong text-teal-700 hover:bg-white/90"
            >
              <i className="ri-mail-line"></i>
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
