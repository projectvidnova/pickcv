import { useState } from 'react';

const faqs = [
  {
    question: 'Can I create resumes for different jobs?',
    answer:
      'Yes! Upload the same resume with different job descriptions and PickCV will tailor keywords, tone, and formatting for each specific role. Optimize once, apply everywhere.',
  },
  {
    question: 'How accurate is the ATS matching?',
    answer:
      'Our AI analyzes your resume against the same algorithms used by top ATS platforms like Workday, Greenhouse, and Lever. Users typically see scores improve from 30–40% to 85–94% after optimization.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. We are DPDP (Digital Personal Data Protection) compliant. Your resume data is encrypted in transit and at rest. We never share your personal information with third parties.',
  },
  {
    question: 'Is there a free plan?',
    answer:
      'Yes — you can upload and get your ATS score for free, no signup required. Our premium plan unlocks full optimization, keyword injection, and unlimited downloads.',
  },
  {
    question: 'What does the ATS score mean?',
    answer:
      'Your ATS score represents how likely your resume is to pass through automated filters. Below 60% means most ATS systems will reject it. Above 80% means you\'re likely to reach a human recruiter. We aim for 90%+.',
  },
  {
    question: 'Does the AI change my actual experience?',
    answer:
      'Never. PickCV does not fabricate experience or add false information. We only optimize how your real experience is presented — better keywords, stronger action verbs, and clearer quantified impact.',
  },
];

export default function Testimonials() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 glass-badge text-teal-700 px-5 py-2.5 rounded-full text-sm font-medium mb-4">
            <i className="ri-question-answer-fill text-amber-500"></i>
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about PickCV.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="glass-card rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
                >
                  <span className="text-base font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <i
                    className={`ri-arrow-down-s-line text-xl text-gray-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  ></i>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
